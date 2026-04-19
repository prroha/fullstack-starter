use axum::extract::State;
use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::api::app_state::AppState;
use crate::api::extractors::{AuthUser, JsonBody};
use crate::api::responses::ApiResponse;
use crate::domain::errors::DomainError;

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    #[validate(length(min = 2, max = 100, message = "Name must be 2-100 characters"))]
    pub name: String,
    #[validate(length(min = 8, max = 128, message = "Password must be 8-128 characters"))]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    #[validate(length(min = 1, message = "Password is required"))]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RefreshRequest {
    #[validate(length(min = 1, message = "Refresh token is required"))]
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user: UserDto,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserDto {
    pub id: String,
    pub email: String,
    pub name: String,
    pub role: String,
    pub email_verified: bool,
    pub created_at: String,
}

impl From<crate::domain::models::User> for UserDto {
    fn from(u: crate::domain::models::User) -> Self {
        Self {
            id: u.id.to_string(),
            email: u.email,
            name: u.name,
            role: u.role.to_string(),
            email_verified: u.email_verified,
            created_at: u.created_at.to_rfc3339(),
        }
    }
}

pub async fn register(
    State(state): State<AppState>,
    JsonBody(body): JsonBody<RegisterRequest>,
) -> Result<impl axum::response::IntoResponse, DomainError> {
    body.validate()
        .map_err(|e| DomainError::Validation(e.to_string()))?;

    let password_hash = state.password_hasher.hash(&body.password)?;
    let user = state
        .user_repo
        .create(&body.email, &body.name, &password_hash)
        .await?;

    let tokens = state
        .token_service
        .generate_pair(user.id, &user.role)?;

    Ok(ApiResponse::created(AuthResponse {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: user.into(),
    }))
}

pub async fn login(
    State(state): State<AppState>,
    JsonBody(body): JsonBody<LoginRequest>,
) -> Result<impl axum::response::IntoResponse, DomainError> {
    body.validate()
        .map_err(|e| DomainError::Validation(e.to_string()))?;

    let user_with_pw = state
        .user_repo
        .find_by_email(&body.email)
        .await?
        .ok_or(DomainError::InvalidCredentials)?;

    let valid = state
        .password_hasher
        .verify(&body.password, &user_with_pw.password_hash)?;

    if !valid {
        return Err(DomainError::InvalidCredentials);
    }

    let user = user_with_pw.user;
    let tokens = state
        .token_service
        .generate_pair(user.id, &user.role)?;

    Ok(ApiResponse::success(AuthResponse {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: user.into(),
    }))
}

pub async fn refresh(
    State(state): State<AppState>,
    JsonBody(body): JsonBody<RefreshRequest>,
) -> Result<impl axum::response::IntoResponse, DomainError> {
    body.validate()
        .map_err(|e| DomainError::Validation(e.to_string()))?;

    let claims = state
        .token_service
        .verify_refresh_token(&body.refresh_token)?;

    let user = state
        .user_repo
        .find_by_id(claims.user_id)
        .await?
        .ok_or(DomainError::UserNotFound)?;

    let tokens = state
        .token_service
        .generate_pair(user.id, &user.role)?;

    Ok(ApiResponse::success(AuthResponse {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: user.into(),
    }))
}

pub async fn me(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<impl axum::response::IntoResponse, DomainError> {
    let user = state
        .user_repo
        .find_by_id(auth.user_id)
        .await?
        .ok_or(DomainError::UserNotFound)?;

    Ok(ApiResponse::success(UserDto::from(user)))
}
