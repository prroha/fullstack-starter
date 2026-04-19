use uuid::Uuid;

use crate::domain::errors::DomainError;
use crate::domain::models::UserRole;

/// Token pair returned after authentication.
#[derive(Debug, Clone)]
pub struct TokenPair {
    pub access_token: String,
    pub refresh_token: String,
}

/// Claims extracted from a valid JWT.
#[derive(Debug, Clone)]
pub struct TokenClaims {
    pub user_id: Uuid,
    pub role: UserRole,
}

/// Port for password hashing operations.
pub trait PasswordHasher: Send + Sync {
    fn hash(&self, password: &str) -> Result<String, DomainError>;
    fn verify(&self, password: &str, hash: &str) -> Result<bool, DomainError>;
}

/// Port for JWT token operations.
pub trait TokenService: Send + Sync {
    fn generate_pair(&self, user_id: Uuid, role: &UserRole) -> Result<TokenPair, DomainError>;
    fn verify_access_token(&self, token: &str) -> Result<TokenClaims, DomainError>;
    fn verify_refresh_token(&self, token: &str) -> Result<TokenClaims, DomainError>;
}
