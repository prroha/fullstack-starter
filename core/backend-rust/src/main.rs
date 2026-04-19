use std::sync::Arc;

use sqlx::postgres::PgPoolOptions;
use tokio::signal;
use tracing_subscriber::EnvFilter;

use starter_backend::api::{self, AppState};
use starter_backend::config;
use starter_backend::infrastructure::auth::{Argon2Hasher, JwtService};
use starter_backend::infrastructure::db::PgUserRepository;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .json()
        .init();

    let config = config::Config::from_env();

    let pool = PgPoolOptions::new()
        .max_connections(config.db_max_connections)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(&config.database_url)
        .await?;

    tracing::info!("Connected to database");

    sqlx::migrate::Migrator::new(std::path::Path::new("./migrations"))
        .await?
        .run(&pool)
        .await?;

    tracing::info!("Migrations applied");

    let state = AppState {
        db_pool: pool.clone(),
        user_repo: Arc::new(PgUserRepository::new(pool.clone())),
        token_service: Arc::new(JwtService::new(
            config.jwt_secret.clone(),
            config.jwt_access_expiry_secs,
            config.jwt_refresh_expiry_secs,
        )),
        password_hasher: Arc::new(Argon2Hasher),
    };

    let app = api::routes::build_router()
        .fallback(api::middleware::fallback_handler)
        .layer(api::middleware::propagate_request_id_layer())
        .layer(api::middleware::trace_layer())
        .layer(api::middleware::request_id_layer())
        .layer(api::middleware::catch_panic_layer())
        .layer(api::middleware::body_limit_layer())
        .layer(api::middleware::cors_layer(&config.cors_origin))
        .with_state(state);

    let addr = config.addr();
    tracing::info!("Starting server on {addr}");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    tracing::info!("Server shut down gracefully");
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        () = ctrl_c => tracing::info!("Received Ctrl+C, shutting down"),
        () = terminate => tracing::info!("Received SIGTERM, shutting down"),
    }
}
