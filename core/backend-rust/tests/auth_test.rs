mod common;

use axum::body::Body;
use axum::http::{self, StatusCode};
use common::{auth_request, body_json, json_request};
use serde_json::json;
use tower::ServiceExt;

#[sqlx::test(migrations = "./migrations")]
async fn register_returns_201_with_tokens(pool: sqlx::PgPool) {
    let app = common::test_app(pool);

    let response = app
        .oneshot(json_request(
            "POST",
            "/api/v1/auth/register",
            json!({
                "email": "test@example.com",
                "name": "Test User",
                "password": "password123"
            }),
        ))
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);

    let body = body_json(response).await;
    assert!(body["data"]["accessToken"].is_string());
    assert!(body["data"]["refreshToken"].is_string());
    assert_eq!(body["data"]["user"]["email"], "test@example.com");
    assert_eq!(body["data"]["user"]["name"], "Test User");
    assert_eq!(body["data"]["user"]["role"], "user");
}

#[sqlx::test(migrations = "./migrations")]
async fn register_duplicate_email_returns_409(pool: sqlx::PgPool) {
    let app = common::test_app(pool);

    let body = json!({
        "email": "dup@example.com",
        "name": "First",
        "password": "password123"
    });

    let _ = app
        .clone()
        .oneshot(json_request("POST", "/api/v1/auth/register", body.clone()))
        .await
        .unwrap();

    let response = app
        .oneshot(json_request("POST", "/api/v1/auth/register", body))
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CONFLICT);
    let body = body_json(response).await;
    assert_eq!(body["error"]["code"], "email_exists");
}

#[sqlx::test(migrations = "./migrations")]
async fn register_invalid_email_returns_422(pool: sqlx::PgPool) {
    let app = common::test_app(pool);

    let response = app
        .oneshot(json_request(
            "POST",
            "/api/v1/auth/register",
            json!({
                "email": "not-an-email",
                "name": "Test",
                "password": "password123"
            }),
        ))
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
}

#[sqlx::test(migrations = "./migrations")]
async fn register_short_password_returns_422(pool: sqlx::PgPool) {
    let app = common::test_app(pool);

    let response = app
        .oneshot(json_request(
            "POST",
            "/api/v1/auth/register",
            json!({
                "email": "test@example.com",
                "name": "Test",
                "password": "short"
            }),
        ))
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
}

#[sqlx::test(migrations = "./migrations")]
async fn login_with_valid_credentials_returns_tokens(pool: sqlx::PgPool) {
    let app = common::test_app(pool);

    let _ = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/api/v1/auth/register",
            json!({
                "email": "login@example.com",
                "name": "Login User",
                "password": "password123"
            }),
        ))
        .await
        .unwrap();

    let response = app
        .oneshot(json_request(
            "POST",
            "/api/v1/auth/login",
            json!({
                "email": "login@example.com",
                "password": "password123"
            }),
        ))
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_json(response).await;
    assert!(body["data"]["accessToken"].is_string());
    assert_eq!(body["data"]["user"]["email"], "login@example.com");
}

#[sqlx::test(migrations = "./migrations")]
async fn login_wrong_password_returns_401(pool: sqlx::PgPool) {
    let app = common::test_app(pool);

    let _ = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/api/v1/auth/register",
            json!({
                "email": "wrong@example.com",
                "name": "User",
                "password": "password123"
            }),
        ))
        .await
        .unwrap();

    let response = app
        .oneshot(json_request(
            "POST",
            "/api/v1/auth/login",
            json!({
                "email": "wrong@example.com",
                "password": "wrongpassword"
            }),
        ))
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "./migrations")]
async fn login_nonexistent_user_returns_401(pool: sqlx::PgPool) {
    let app = common::test_app(pool);

    let response = app
        .oneshot(json_request(
            "POST",
            "/api/v1/auth/login",
            json!({
                "email": "nobody@example.com",
                "password": "password123"
            }),
        ))
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "./migrations")]
async fn me_with_valid_token_returns_user(pool: sqlx::PgPool) {
    let app = common::test_app(pool);
    let token = common::register_and_get_token(&app, "me@example.com").await;

    let response = app
        .oneshot(auth_request("GET", "/api/v1/auth/me", &token))
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_json(response).await;
    assert_eq!(body["data"]["email"], "me@example.com");
}

#[sqlx::test(migrations = "./migrations")]
async fn me_without_token_returns_401(pool: sqlx::PgPool) {
    let app = common::test_app(pool);

    let response = app
        .oneshot(
            http::Request::builder()
                .method("GET")
                .uri("/api/v1/auth/me")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "./migrations")]
async fn refresh_returns_new_tokens(pool: sqlx::PgPool) {
    let app = common::test_app(pool);

    let response = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/api/v1/auth/register",
            json!({
                "email": "refresh@example.com",
                "name": "Refresh User",
                "password": "password123"
            }),
        ))
        .await
        .unwrap();

    let body = body_json(response).await;
    let refresh_token = body["data"]["refreshToken"].as_str().unwrap();

    let response = app
        .oneshot(json_request(
            "POST",
            "/api/v1/auth/refresh",
            json!({ "refresh_token": refresh_token }),
        ))
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_json(response).await;
    assert!(body["data"]["accessToken"].is_string());
    assert!(body["data"]["refreshToken"].is_string());
}

#[sqlx::test(migrations = "./migrations")]
async fn health_check_returns_ok(pool: sqlx::PgPool) {
    let app = common::test_app(pool);

    let response = app
        .oneshot(
            http::Request::builder()
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_json(response).await;
    assert_eq!(body["status"], "ok");
}
