use std::sync::Arc;

use axum::body::Body;
use axum::http;
use axum::Router;
use serde_json::Value;
use sqlx::PgPool;

use starter_backend::api::app_state::AppState;
use starter_backend::api::routes::build_router;
use starter_backend::infrastructure::auth::{Argon2Hasher, JwtService};
use starter_backend::infrastructure::db::PgUserRepository;

pub const TEST_JWT_SECRET: &str = "test-secret-key-at-least-32-chars-long";

/// Builds the Axum app with a test database pool.
pub fn test_app(pool: PgPool) -> Router {
    let state = AppState {
        db_pool: pool.clone(),
        user_repo: Arc::new(PgUserRepository::new(pool.clone())),
        token_service: Arc::new(JwtService::new(
            TEST_JWT_SECRET.into(),
            900,
            604800,
        )),
        password_hasher: Arc::new(Argon2Hasher),
    };

    build_router().with_state(state)
}

/// Build a JSON request with method, URI, and body.
pub fn json_request(method: &str, uri: &str, body: Value) -> http::Request<Body> {
    http::Request::builder()
        .method(method)
        .uri(uri)
        .header(http::header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_vec(&body).unwrap()))
        .unwrap()
}

/// Build a request with Authorization header (no body).
pub fn auth_request(method: &str, uri: &str, token: &str) -> http::Request<Body> {
    http::Request::builder()
        .method(method)
        .uri(uri)
        .header(http::header::AUTHORIZATION, format!("Bearer {token}"))
        .body(Body::empty())
        .unwrap()
}

/// Build a JSON request with Authorization header.
pub fn json_auth_request(method: &str, uri: &str, token: &str, body: Value) -> http::Request<Body> {
    http::Request::builder()
        .method(method)
        .uri(uri)
        .header(http::header::CONTENT_TYPE, "application/json")
        .header(http::header::AUTHORIZATION, format!("Bearer {token}"))
        .body(Body::from(serde_json::to_vec(&body).unwrap()))
        .unwrap()
}

/// Extract JSON body from response.
pub async fn body_json(response: axum::response::Response) -> Value {
    let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    serde_json::from_slice(&bytes).unwrap()
}

/// Register a user and return the access token.
pub async fn register_and_get_token(app: &Router, email: &str) -> String {
    use serde_json::json;
    use tower::ServiceExt;

    let response = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/api/v1/auth/register",
            json!({
                "email": email,
                "name": "Test User",
                "password": "password123"
            }),
        ))
        .await
        .unwrap();

    let body = body_json(response).await;
    body["data"]["accessToken"]
        .as_str()
        .unwrap()
        .to_string()
}
