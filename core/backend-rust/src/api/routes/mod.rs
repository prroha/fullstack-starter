use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::api::app_state::AppState;
use crate::api::handlers::{auth, health, users};

pub fn build_router() -> Router<AppState> {
    Router::new()
        .nest("/api/v1", api_routes())
        .route("/health", get(health::health))
}

fn api_routes() -> Router<AppState> {
    Router::new()
        .nest("/auth", auth_routes())
        .nest("/users", user_routes())
        .nest("/admin", admin_routes())
}

fn auth_routes() -> Router<AppState> {
    Router::new()
        .route("/register", post(auth::register))
        .route("/login", post(auth::login))
        .route("/refresh", post(auth::refresh))
        .route("/me", get(auth::me))
}

fn user_routes() -> Router<AppState> {
    Router::new()
        .route("/me", get(users::get_profile).put(users::update_profile))
        .route("/me/password", put(users::change_password))
}

fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/users", get(users::list_users))
        .route("/users/{user_id}", delete(users::delete_user))
}
