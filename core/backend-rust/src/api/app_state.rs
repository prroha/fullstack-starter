use std::sync::Arc;

use sqlx::PgPool;

use crate::domain::services::{PasswordHasher, TokenService, UserRepository};

/// Shared application state passed to all handlers via Axum's State extractor.
#[derive(Clone)]
pub struct AppState {
    pub db_pool: PgPool,
    pub user_repo: Arc<dyn UserRepository>,
    pub token_service: Arc<dyn TokenService>,
    pub password_hasher: Arc<dyn PasswordHasher>,
}

impl AppState {
    /// Ping the database to verify connectivity.
    pub async fn check_db(&self) -> Result<(), sqlx::Error> {
        sqlx::query("SELECT 1").execute(&self.db_pool).await?;
        Ok(())
    }
}
