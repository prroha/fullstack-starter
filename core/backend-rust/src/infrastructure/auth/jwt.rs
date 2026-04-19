use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::constants::auth::{TOKEN_KIND_ACCESS, TOKEN_KIND_REFRESH};
use crate::domain::errors::DomainError;
use crate::domain::models::UserRole;
use crate::domain::services::{TokenClaims, TokenPair, TokenService};

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    role: String,
    exp: usize,
    iat: usize,
    kind: String,
}

pub struct JwtService {
    secret: String,
    access_expiry_secs: u64,
    refresh_expiry_secs: u64,
}

impl JwtService {
    pub fn new(secret: String, access_expiry_secs: u64, refresh_expiry_secs: u64) -> Self {
        Self {
            secret,
            access_expiry_secs,
            refresh_expiry_secs,
        }
    }

    fn encode_token(
        &self,
        user_id: Uuid,
        role: &UserRole,
        expiry_secs: u64,
        kind: &str,
    ) -> Result<String, DomainError> {
        let now = Utc::now().timestamp() as usize;
        let claims = Claims {
            sub: user_id.to_string(),
            role: role.to_string(),
            exp: now + expiry_secs as usize,
            iat: now,
            kind: kind.to_string(),
        };
        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )
        .map_err(|e| DomainError::Internal(format!("Token encoding failed: {e}")))
    }

    fn decode_token(&self, token: &str, expected_kind: &str) -> Result<TokenClaims, DomainError> {
        let mut validation = Validation::default();
        validation.leeway = 0;
        let data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.secret.as_bytes()),
            &validation,
        )
        .map_err(|e| match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => DomainError::TokenExpired,
            _ => DomainError::InvalidToken,
        })?;

        if data.claims.kind != expected_kind {
            return Err(DomainError::InvalidToken);
        }

        let user_id = Uuid::parse_str(&data.claims.sub)
            .map_err(|_| DomainError::InvalidToken)?;

        let role: UserRole = data.claims.role.parse().map_err(|_| {
            tracing::error!(role = %data.claims.role, "Invalid role in JWT");
            DomainError::InvalidToken
        })?;

        Ok(TokenClaims { user_id, role })
    }
}

impl TokenService for JwtService {
    fn generate_pair(&self, user_id: Uuid, role: &UserRole) -> Result<TokenPair, DomainError> {
        Ok(TokenPair {
            access_token: self.encode_token(user_id, role, self.access_expiry_secs, TOKEN_KIND_ACCESS)?,
            refresh_token: self.encode_token(user_id, role, self.refresh_expiry_secs, TOKEN_KIND_REFRESH)?,
        })
    }

    fn verify_access_token(&self, token: &str) -> Result<TokenClaims, DomainError> {
        self.decode_token(token, TOKEN_KIND_ACCESS)
    }

    fn verify_refresh_token(&self, token: &str) -> Result<TokenClaims, DomainError> {
        self.decode_token(token, TOKEN_KIND_REFRESH)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_service() -> JwtService {
        JwtService::new("test-secret-key-at-least-32-chars".into(), 900, 604800)
    }

    #[test]
    fn generate_and_verify_access_token() {
        let svc = test_service();
        let user_id = Uuid::new_v4();
        let pair = svc.generate_pair(user_id, &UserRole::User).unwrap();

        let claims = svc.verify_access_token(&pair.access_token).unwrap();
        assert_eq!(claims.user_id, user_id);
        assert_eq!(claims.role, UserRole::User);
    }

    #[test]
    fn generate_and_verify_refresh_token() {
        let svc = test_service();
        let user_id = Uuid::new_v4();
        let pair = svc.generate_pair(user_id, &UserRole::Admin).unwrap();

        let claims = svc.verify_refresh_token(&pair.refresh_token).unwrap();
        assert_eq!(claims.user_id, user_id);
        assert_eq!(claims.role, UserRole::Admin);
    }

    #[test]
    fn access_token_rejected_as_refresh() {
        let svc = test_service();
        let pair = svc.generate_pair(Uuid::new_v4(), &UserRole::User).unwrap();
        assert!(matches!(svc.verify_refresh_token(&pair.access_token), Err(DomainError::InvalidToken)));
    }

    #[test]
    fn refresh_token_rejected_as_access() {
        let svc = test_service();
        let pair = svc.generate_pair(Uuid::new_v4(), &UserRole::User).unwrap();
        assert!(matches!(svc.verify_access_token(&pair.refresh_token), Err(DomainError::InvalidToken)));
    }

    #[test]
    fn invalid_token_rejected() {
        let svc = test_service();
        assert!(matches!(svc.verify_access_token("garbage-token"), Err(DomainError::InvalidToken)));
    }

    #[test]
    fn expired_token_detected() {
        let secret = "test-secret-key-at-least-32-chars";
        let now = Utc::now().timestamp() as usize;
        let claims = Claims {
            sub: Uuid::new_v4().to_string(),
            role: "user".into(),
            exp: now - 10,
            iat: now - 20,
            kind: TOKEN_KIND_ACCESS.into(),
        };
        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_bytes()),
        )
        .unwrap();

        let svc = JwtService::new(secret.into(), 900, 604800);
        assert!(matches!(svc.verify_access_token(&token), Err(DomainError::TokenExpired)));
    }
}
