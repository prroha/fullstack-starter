use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use serde::Serialize;

use crate::api::app_state::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub database: Option<String>,
}

pub async fn health(State(state): State<AppState>) -> (StatusCode, Json<HealthResponse>) {
    let db_status = match state.check_db().await {
        Ok(()) => Some("connected".into()),
        Err(e) => {
            tracing::error!("Health check: database unreachable: {e}");
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(HealthResponse {
                    status: "degraded".into(),
                    version: env!("CARGO_PKG_VERSION").into(),
                    database: Some("unreachable".into()),
                }),
            );
        }
    };

    (
        StatusCode::OK,
        Json(HealthResponse {
            status: "ok".into(),
            version: env!("CARGO_PKG_VERSION").into(),
            database: db_status,
        }),
    )
}
