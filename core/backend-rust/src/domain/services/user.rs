use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::errors::DomainError;
use crate::domain::models::{User, UserWithPassword};

/// Port for user persistence operations.
#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn create(
        &self,
        email: &str,
        name: &str,
        password_hash: &str,
    ) -> Result<User, DomainError>;

    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, DomainError>;

    async fn find_by_id_with_password(
        &self,
        id: Uuid,
    ) -> Result<Option<UserWithPassword>, DomainError>;

    async fn find_by_email(
        &self,
        email: &str,
    ) -> Result<Option<UserWithPassword>, DomainError>;

    async fn update_profile(
        &self,
        id: Uuid,
        name: &str,
        email: &str,
    ) -> Result<User, DomainError>;

    async fn update_password(
        &self,
        id: Uuid,
        password_hash: &str,
    ) -> Result<(), DomainError>;

    async fn list(
        &self,
        page: u32,
        per_page: u32,
    ) -> Result<(Vec<User>, i64), DomainError>;

    async fn delete(&self, id: Uuid) -> Result<(), DomainError>;
}
