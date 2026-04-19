use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum UserRole {
    User,
    Admin,
    SuperAdmin,
}

impl UserRole {
    pub fn is_admin(&self) -> bool {
        matches!(self, Self::Admin | Self::SuperAdmin)
    }

    pub fn is_super_admin(&self) -> bool {
        matches!(self, Self::SuperAdmin)
    }
}

impl std::fmt::Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::User => write!(f, "user"),
            Self::Admin => write!(f, "admin"),
            Self::SuperAdmin => write!(f, "super_admin"),
        }
    }
}

impl std::str::FromStr for UserRole {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "user" => Ok(Self::User),
            "admin" => Ok(Self::Admin),
            "super_admin" => Ok(Self::SuperAdmin),
            _ => Err(format!("Invalid role: {s}")),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub role: UserRole,
    pub email_verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Internal representation that includes the password hash.
/// Never serialize this — use `User` for API responses.
#[derive(Debug, Clone)]
pub struct UserWithPassword {
    pub user: User,
    pub password_hash: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn user_role_is_admin() {
        assert!(!UserRole::User.is_admin());
        assert!(UserRole::Admin.is_admin());
        assert!(UserRole::SuperAdmin.is_admin());
    }

    #[test]
    fn user_role_is_super_admin() {
        assert!(!UserRole::User.is_super_admin());
        assert!(!UserRole::Admin.is_super_admin());
        assert!(UserRole::SuperAdmin.is_super_admin());
    }

    #[test]
    fn user_role_roundtrip() {
        for role in [UserRole::User, UserRole::Admin, UserRole::SuperAdmin] {
            let s = role.to_string();
            let parsed: UserRole = s.parse().unwrap();
            assert_eq!(parsed, role);
        }
    }

    #[test]
    fn user_role_invalid_parse() {
        assert!("invalid".parse::<UserRole>().is_err());
    }
}
