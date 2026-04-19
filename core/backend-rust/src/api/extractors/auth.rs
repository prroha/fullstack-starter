use axum::{
    extract::FromRequestParts,
    http::{header::AUTHORIZATION, request::Parts},
};

use crate::api::app_state::AppState;
use crate::constants::auth::BEARER_PREFIX;
use crate::domain::errors::DomainError;
use crate::domain::models::UserRole;

/// Extractor that validates the JWT and provides the authenticated user's claims.
pub struct AuthUser {
    pub user_id: uuid::Uuid,
    pub role: UserRole,
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = DomainError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let header = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .ok_or(DomainError::InvalidToken)?;

        let token = header
            .strip_prefix(BEARER_PREFIX)
            .ok_or(DomainError::InvalidToken)?;

        let claims = state.token_service.verify_access_token(token)?;

        Ok(AuthUser {
            user_id: claims.user_id,
            role: claims.role,
        })
    }
}

/// Extractor that requires admin role.
pub struct AdminUser {
    pub user_id: uuid::Uuid,
}

impl FromRequestParts<AppState> for AdminUser {
    type Rejection = DomainError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let auth = AuthUser::from_request_parts(parts, state).await?;
        if !auth.role.is_admin() {
            return Err(DomainError::Forbidden);
        }
        Ok(AdminUser {
            user_id: auth.user_id,
        })
    }
}
