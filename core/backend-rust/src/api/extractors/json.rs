use axum::extract::rejection::JsonRejection;
use axum::extract::FromRequest;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::de::DeserializeOwned;

use crate::api::responses::{ApiError, ApiResponse};
use crate::constants::error_codes;

/// Custom JSON extractor that returns structured error responses
/// instead of Axum's default plain text rejection.
pub struct JsonBody<T>(pub T);

impl<S, T> FromRequest<S> for JsonBody<T>
where
    axum::Json<T>: FromRequest<S, Rejection = JsonRejection>,
    T: DeserializeOwned,
    S: Send + Sync,
{
    type Rejection = Response;

    async fn from_request(
        req: axum::extract::Request,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        match axum::Json::<T>::from_request(req, state).await {
            Ok(axum::Json(value)) => Ok(JsonBody(value)),
            Err(rejection) => {
                let (code, message) = match &rejection {
                    JsonRejection::JsonDataError(_) => {
                        (error_codes::INVALID_JSON, format!("Invalid request body: {rejection}"))
                    }
                    JsonRejection::JsonSyntaxError(_) => {
                        (error_codes::INVALID_JSON, "Malformed JSON in request body".into())
                    }
                    JsonRejection::MissingJsonContentType(_) => (
                        error_codes::MISSING_CONTENT_TYPE,
                        "Content-Type must be application/json".into(),
                    ),
                    JsonRejection::BytesRejection(_) => {
                        (error_codes::PAYLOAD_TOO_LARGE, "Request body too large".into())
                    }
                    _ => (error_codes::BAD_REQUEST, "Invalid request".into()),
                };

                let status = match &rejection {
                    JsonRejection::MissingJsonContentType(_) => StatusCode::UNSUPPORTED_MEDIA_TYPE,
                    JsonRejection::BytesRejection(_) => StatusCode::PAYLOAD_TOO_LARGE,
                    _ => StatusCode::BAD_REQUEST,
                };

                let body = ApiResponse::<()> {
                    data: None,
                    error: Some(ApiError {
                        code: code.into(),
                        message,
                    }),
                    meta: None,
                };

                Err((status, axum::Json(body)).into_response())
            }
        }
    }
}
