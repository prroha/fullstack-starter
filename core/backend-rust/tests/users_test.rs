mod common;

use axum::http::StatusCode;
use common::{auth_request, body_json, json_auth_request, register_and_get_token};
use serde_json::json;
use tower::ServiceExt;

#[sqlx::test(migrations = "./migrations")]
async fn get_profile_returns_user_data(pool: sqlx::PgPool) {
    let app = common::test_app(pool);
    let token = register_and_get_token(&app, "profile@example.com").await;

    let response = app
        .oneshot(auth_request("GET", "/api/v1/users/me", &token))
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_json(response).await;
    assert_eq!(body["data"]["email"], "profile@example.com");
}

#[sqlx::test(migrations = "./migrations")]
async fn update_profile_changes_name_and_email(pool: sqlx::PgPool) {
    let app = common::test_app(pool);
    let token = register_and_get_token(&app, "update@example.com").await;

    let response = app
        .oneshot(json_auth_request(
            "PUT",
            "/api/v1/users/me",
            &token,
            json!({
                "name": "Updated Name",
                "email": "updated@example.com"
            }),
        ))
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_json(response).await;
    assert_eq!(body["data"]["name"], "Updated Name");
    assert_eq!(body["data"]["email"], "updated@example.com");
}

#[sqlx::test(migrations = "./migrations")]
async fn admin_list_users_forbidden_for_regular_user(pool: sqlx::PgPool) {
    let app = common::test_app(pool);
    let token = register_and_get_token(&app, "regular@example.com").await;

    let response = app
        .oneshot(auth_request("GET", "/api/v1/admin/users", &token))
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}

#[sqlx::test(migrations = "./migrations")]
async fn admin_list_users_returns_paginated_results(pool: sqlx::PgPool) {
    use starter_backend::domain::models::UserRole;
    use starter_backend::domain::services::TokenService;
    use starter_backend::infrastructure::auth::JwtService;

    // Seed an admin user directly in the DB
    let admin_id: (uuid::Uuid,) = sqlx::query_as(
        "INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
    )
    .bind("admin@example.com")
    .bind("Admin")
    .bind("$argon2id$v=19$m=19456,t=2,p=1$placeholder$placeholder")
    .bind("admin")
    .fetch_one(&pool)
    .await
    .unwrap();
    let admin_id = admin_id.0;

    let app = common::test_app(pool);

    // Register a regular user so there are 2 users total
    let _ = register_and_get_token(&app, "user1@example.com").await;

    // Generate admin token directly (same secret as test_app)
    let jwt = JwtService::new(common::TEST_JWT_SECRET.into(), 900, 604800);
    let tokens = jwt.generate_pair(admin_id, &UserRole::Admin).unwrap();

    let response = app
        .oneshot(auth_request(
            "GET",
            "/api/v1/admin/users?page=1&per_page=10",
            &tokens.access_token,
        ))
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_json(response).await;
    assert!(body["meta"]["total"].as_i64().unwrap() >= 2);
    assert!(body["data"].as_array().unwrap().len() >= 2);
}
