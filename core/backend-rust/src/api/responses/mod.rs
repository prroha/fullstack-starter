use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::Serialize;

use crate::constants::error_codes;
use crate::domain::errors::DomainError;

/// Standard API response envelope.
#[derive(Debug, Serialize)]
pub struct ApiResponse<T: Serialize> {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<ApiError>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<PaginationMeta>,
}

#[derive(Debug, Serialize)]
pub struct ApiError {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct PaginationMeta {
    pub page: u32,
    pub per_page: u32,
    pub total: i64,
    pub total_pages: u32,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn success(data: T) -> (StatusCode, axum::Json<Self>) {
        (
            StatusCode::OK,
            axum::Json(Self {
                data: Some(data),
                error: None,
                meta: None,
            }),
        )
    }

    pub fn created(data: T) -> (StatusCode, axum::Json<Self>) {
        (
            StatusCode::CREATED,
            axum::Json(Self {
                data: Some(data),
                error: None,
                meta: None,
            }),
        )
    }

    pub fn paginated(data: T, meta: PaginationMeta) -> (StatusCode, axum::Json<Self>) {
        (
            StatusCode::OK,
            axum::Json(Self {
                data: Some(data),
                error: None,
                meta: Some(meta),
            }),
        )
    }
}

impl ApiResponse<()> {
    pub fn no_content() -> StatusCode {
        StatusCode::NO_CONTENT
    }
}

/// Converts DomainError into HTTP responses.
impl IntoResponse for DomainError {
    fn into_response(self) -> Response {
        let (status, code) = match &self {
            DomainError::UserNotFound => {
                (StatusCode::NOT_FOUND, error_codes::NOT_FOUND)
            }
            DomainError::EmailAlreadyExists => (StatusCode::CONFLICT, error_codes::EMAIL_EXISTS),
            DomainError::InvalidCredentials => (StatusCode::UNAUTHORIZED, error_codes::INVALID_CREDENTIALS),
            DomainError::InvalidToken => (StatusCode::UNAUTHORIZED, error_codes::INVALID_TOKEN),
            DomainError::TokenExpired => (StatusCode::UNAUTHORIZED, error_codes::TOKEN_EXPIRED),
            DomainError::Forbidden => (StatusCode::FORBIDDEN, error_codes::FORBIDDEN),
            DomainError::Validation(_) => (StatusCode::UNPROCESSABLE_ENTITY, error_codes::VALIDATION_ERROR),
            DomainError::Internal(_) => {
                tracing::error!("Internal error: {}", self);
                (StatusCode::INTERNAL_SERVER_ERROR, error_codes::INTERNAL_ERROR)
            }
        };

        let body = ApiResponse::<()> {
            data: None,
            error: Some(ApiError {
                code: code.to_string(),
                message: self.to_string(),
            }),
            meta: None,
        };

        (status, axum::Json(body)).into_response()
    }
}
