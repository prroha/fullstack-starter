use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;

use crate::api::responses::{ApiError, ApiResponse};
use crate::constants::error_codes;

/// Fallback handler for unmatched routes (404).
pub async fn fallback_handler() -> Response {
    let body = ApiResponse::<()> {
        data: None,
        error: Some(ApiError {
            code: error_codes::NOT_FOUND.into(),
            message: "The requested endpoint does not exist".into(),
        }),
        meta: None,
    };
    (StatusCode::NOT_FOUND, Json(body)).into_response()
}
