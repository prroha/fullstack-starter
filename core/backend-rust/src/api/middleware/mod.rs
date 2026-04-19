use axum::http::{HeaderName, HeaderValue};
use tower_http::catch_panic::{CatchPanicLayer, DefaultResponseForPanic};
use tower_http::cors::{Any, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer};
use tower_http::trace::{self, TraceLayer};
use tracing::Level;

mod error_handling;

pub use error_handling::fallback_handler;

/// Request ID header used for correlation across logs and responses.
static REQUEST_ID_HEADER: HeaderName = HeaderName::from_static("x-request-id");

/// Max request body size (10 MB).
const MAX_BODY_SIZE: usize = 10 * 1024 * 1024;

pub fn cors_layer(origin: &str) -> CorsLayer {
    if origin == "*" {
        return CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any);
    }

    let origin: HeaderValue = origin.parse().unwrap_or_else(|_| {
        tracing::warn!(
            origin,
            "Invalid CORS_ORIGIN, falling back to http://localhost:3000"
        );
        HeaderValue::from_static(crate::constants::defaults::CORS_ORIGIN)
    });

    CorsLayer::new()
        .allow_origin(origin)
        .allow_methods(Any)
        .allow_headers(Any)
}

/// Structured request/response tracing with request ID correlation.
pub fn trace_layer() -> TraceLayer<
    tower_http::classify::SharedClassifier<tower_http::classify::ServerErrorsAsFailures>,
    trace::DefaultMakeSpan,
    trace::DefaultOnRequest,
    trace::DefaultOnResponse,
> {
    TraceLayer::new_for_http()
        .make_span_with(trace::DefaultMakeSpan::new().level(Level::INFO))
        .on_request(trace::DefaultOnRequest::new().level(Level::INFO))
        .on_response(trace::DefaultOnResponse::new().level(Level::INFO))
}

/// Generates a unique request ID and attaches it to each request/response.
pub fn request_id_layer() -> SetRequestIdLayer<MakeRequestUuid> {
    SetRequestIdLayer::new(REQUEST_ID_HEADER.clone(), MakeRequestUuid)
}

/// Propagates the request ID from request to response headers.
pub fn propagate_request_id_layer() -> PropagateRequestIdLayer {
    PropagateRequestIdLayer::new(REQUEST_ID_HEADER.clone())
}

/// Returns a structured JSON error when a handler panics instead of dropping the connection.
pub fn catch_panic_layer() -> CatchPanicLayer<DefaultResponseForPanic> {
    CatchPanicLayer::new()
}

/// Limits request body size to prevent abuse.
pub fn body_limit_layer() -> RequestBodyLimitLayer {
    RequestBodyLimitLayer::new(MAX_BODY_SIZE)
}
