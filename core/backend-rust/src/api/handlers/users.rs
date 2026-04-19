use axum::extract::{Path, Query, State};
use serde::Deserialize;
use validator::Validate;

use crate::api::app_state::AppState;
use crate::api::extractors::{AdminUser, AuthUser, JsonBody};
use crate::api::handlers::auth::UserDto;
use crate::api::responses::{ApiResponse, PaginationMeta};
use crate::constants::pagination;
use crate::domain::errors::DomainError;

#[derive(Debug, Deserialize)]
pub struct ListUsersQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProfileRequest {
    #[validate(length(min = 2, max = 100, message = "Name must be 2-100 characters"))]
    pub name: String,
    #[validate(email(message = "Invalid email format"), length(max = 254, message = "Email too long"))]
    pub email: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    #[validate(length(min = 8, max = 128, message = "Password must be 8-128 characters"))]
    pub new_password: String,
}

pub async fn get_profile(
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

pub async fn update_profile(
    State(state): State<AppState>,
    auth: AuthUser,
    JsonBody(body): JsonBody<UpdateProfileRequest>,
) -> Result<impl axum::response::IntoResponse, DomainError> {
    body.validate()
        .map_err(|e| DomainError::Validation(e.to_string()))?;

    let user = state
        .user_repo
        .update_profile(auth.user_id, &body.name, &body.email)
        .await?;

    Ok(ApiResponse::success(UserDto::from(user)))
}

pub async fn change_password(
    State(state): State<AppState>,
    auth: AuthUser,
    JsonBody(body): JsonBody<ChangePasswordRequest>,
) -> Result<impl axum::response::IntoResponse, DomainError> {
    body.validate()
        .map_err(|e| DomainError::Validation(e.to_string()))?;

    let user_with_pw = state
        .user_repo
        .find_by_id_with_password(auth.user_id)
        .await?
        .ok_or(DomainError::UserNotFound)?;

    let valid = state
        .password_hasher
        .verify(&body.current_password, &user_with_pw.password_hash)?;

    if !valid {
        return Err(DomainError::InvalidCredentials);
    }

    let new_hash = state.password_hasher.hash(&body.new_password)?;
    state
        .user_repo
        .update_password(auth.user_id, &new_hash)
        .await?;

    Ok(ApiResponse::<()>::no_content())
}

/// Admin: list all users with pagination.
pub async fn list_users(
    State(state): State<AppState>,
    _admin: AdminUser,
    Query(query): Query<ListUsersQuery>,
) -> Result<impl axum::response::IntoResponse, DomainError> {
    let page = query.page.unwrap_or(pagination::DEFAULT_PAGE).max(1);
    let per_page = query.per_page.unwrap_or(pagination::DEFAULT_PER_PAGE).min(pagination::MAX_PER_PAGE);

    let (users, total) = state.user_repo.list(page, per_page).await?;
    let total_pages = ((total as f64) / (per_page as f64)).ceil() as u32;

    let user_dtos: Vec<UserDto> = users.into_iter().map(UserDto::from).collect();

    Ok(ApiResponse::paginated(
        user_dtos,
        PaginationMeta {
            page,
            per_page,
            total,
            total_pages,
        },
    ))
}

/// Admin: delete a user.
pub async fn delete_user(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(user_id): Path<uuid::Uuid>,
) -> Result<impl axum::response::IntoResponse, DomainError> {
    state.user_repo.delete(user_id).await?;
    Ok(ApiResponse::<()>::no_content())
}
