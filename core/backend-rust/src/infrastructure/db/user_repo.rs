use async_trait::async_trait;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::domain::errors::DomainError;
use crate::domain::models::{User, UserRole, UserWithPassword};
use crate::domain::services::UserRepository;

/// All user columns for SELECT queries. Keep in sync with UserRow fields.
const USER_COLUMNS: &str =
    "id, email, name, password_hash, role, email_verified, created_at, updated_at";

pub struct PgUserRepository {
    pool: PgPool,
}

impl PgUserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct UserRow {
    id: Uuid,
    email: String,
    name: String,
    password_hash: String,
    role: String,
    email_verified: bool,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

impl UserRow {
    fn parse_role(role: &str) -> Result<UserRole, DomainError> {
        role.parse().map_err(|_| {
            tracing::error!(role, "Corrupted role value in database");
            DomainError::Internal(format!("Invalid role in database: {role}"))
        })
    }

    fn into_user(self) -> Result<User, DomainError> {
        let role = Self::parse_role(&self.role)?;
        Ok(User {
            id: self.id,
            email: self.email,
            name: self.name,
            role,
            email_verified: self.email_verified,
            created_at: self.created_at,
            updated_at: self.updated_at,
        })
    }

    fn into_user_with_password(self) -> Result<UserWithPassword, DomainError> {
        let password_hash = self.password_hash.clone();
        Ok(UserWithPassword {
            user: self.into_user()?,
            password_hash,
        })
    }
}

fn map_db_error(e: sqlx::Error) -> DomainError {
    match &e {
        sqlx::Error::Database(db_err) if db_err.constraint() == Some("users_email_key") => {
            DomainError::EmailAlreadyExists
        }
        _ => DomainError::Internal(format!("Database error: {e}")),
    }
}

#[async_trait]
impl UserRepository for PgUserRepository {
    async fn create(
        &self,
        email: &str,
        name: &str,
        password_hash: &str,
    ) -> Result<User, DomainError> {
        let query = format!(
            "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING {USER_COLUMNS}"
        );
        let row: UserRow = sqlx::query_as(&query)
            .bind(email)
            .bind(name)
            .bind(password_hash)
            .fetch_one(&self.pool)
            .await
            .map_err(map_db_error)?;

        row.into_user()
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, DomainError> {
        let query = format!("SELECT {USER_COLUMNS} FROM users WHERE id = $1");
        let row: Option<UserRow> = sqlx::query_as(&query)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| DomainError::Internal(format!("Database error: {e}")))?;

        row.map(|r| r.into_user()).transpose()
    }

    async fn find_by_id_with_password(
        &self,
        id: Uuid,
    ) -> Result<Option<UserWithPassword>, DomainError> {
        let query = format!("SELECT {USER_COLUMNS} FROM users WHERE id = $1");
        let row: Option<UserRow> = sqlx::query_as(&query)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| DomainError::Internal(format!("Database error: {e}")))?;

        row.map(|r| r.into_user_with_password()).transpose()
    }

    async fn find_by_email(
        &self,
        email: &str,
    ) -> Result<Option<UserWithPassword>, DomainError> {
        let query = format!("SELECT {USER_COLUMNS} FROM users WHERE email = $1");
        let row: Option<UserRow> = sqlx::query_as(&query)
            .bind(email)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| DomainError::Internal(format!("Database error: {e}")))?;

        row.map(|r| r.into_user_with_password()).transpose()
    }

    async fn update_profile(
        &self,
        id: Uuid,
        name: &str,
        email: &str,
    ) -> Result<User, DomainError> {
        let query = format!(
            "UPDATE users SET name = $2, email = $3 WHERE id = $1 RETURNING {USER_COLUMNS}"
        );
        let row: Option<UserRow> = sqlx::query_as(&query)
            .bind(id)
            .bind(name)
            .bind(email)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_db_error)?;

        row.ok_or(DomainError::UserNotFound)?.into_user()
    }

    async fn update_password(
        &self,
        id: Uuid,
        password_hash: &str,
    ) -> Result<(), DomainError> {
        let result = sqlx::query("UPDATE users SET password_hash = $2 WHERE id = $1")
            .bind(id)
            .bind(password_hash)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Internal(format!("Database error: {e}")))?;

        if result.rows_affected() == 0 {
            return Err(DomainError::UserNotFound);
        }
        Ok(())
    }

    async fn list(
        &self,
        page: u32,
        per_page: u32,
    ) -> Result<(Vec<User>, i64), DomainError> {
        let offset = (page.saturating_sub(1) as i64) * (per_page as i64);

        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| DomainError::Internal(format!("Database error: {e}")))?;

        let query = format!(
            "SELECT {USER_COLUMNS} FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2"
        );
        let rows: Vec<UserRow> = sqlx::query_as(&query)
            .bind(per_page as i64)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| DomainError::Internal(format!("Database error: {e}")))?;

        let users: Result<Vec<User>, DomainError> =
            rows.into_iter().map(|r| r.into_user()).collect();
        Ok((users?, count.0))
    }

    async fn delete(&self, id: Uuid) -> Result<(), DomainError> {
        let result = sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Internal(format!("Database error: {e}")))?;

        if result.rows_affected() == 0 {
            return Err(DomainError::UserNotFound);
        }
        Ok(())
    }
}
