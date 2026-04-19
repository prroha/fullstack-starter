use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher as _, PasswordVerifier, SaltString},
    Argon2,
};

use crate::domain::errors::DomainError;
use crate::domain::services::PasswordHasher;

pub struct Argon2Hasher;

impl PasswordHasher for Argon2Hasher {
    fn hash(&self, password: &str) -> Result<String, DomainError> {
        let salt = SaltString::generate(&mut OsRng);
        let hash = Argon2::default()
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| DomainError::Internal(format!("Password hashing failed: {e}")))?;
        Ok(hash.to_string())
    }

    fn verify(&self, password: &str, hash: &str) -> Result<bool, DomainError> {
        let parsed = PasswordHash::new(hash)
            .map_err(|e| DomainError::Internal(format!("Invalid hash format: {e}")))?;
        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed)
            .is_ok())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hash_and_verify_password() {
        let hasher = Argon2Hasher;
        let hash = hasher.hash("my-secret-password").unwrap();
        assert!(hasher.verify("my-secret-password", &hash).unwrap());
    }

    #[test]
    fn reject_wrong_password() {
        let hasher = Argon2Hasher;
        let hash = hasher.hash("correct-password").unwrap();
        assert!(!hasher.verify("wrong-password", &hash).unwrap());
    }

    #[test]
    fn different_hashes_for_same_password() {
        let hasher = Argon2Hasher;
        let hash1 = hasher.hash("same-password").unwrap();
        let hash2 = hasher.hash("same-password").unwrap();
        assert_ne!(hash1, hash2); // different salts
    }
}
