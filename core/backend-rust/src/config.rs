use std::env;

use crate::constants::defaults;

const MIN_JWT_SECRET_LENGTH: usize = 32;

#[derive(Debug, Clone)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_access_expiry_secs: u64,
    pub jwt_refresh_expiry_secs: u64,
    pub cors_origin: String,
    pub db_max_connections: u32,
}

impl Config {
    pub fn from_env() -> Self {
        let jwt_secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
        assert!(
            jwt_secret.len() >= MIN_JWT_SECRET_LENGTH,
            "JWT_SECRET must be at least {MIN_JWT_SECRET_LENGTH} characters"
        );

        Self {
            host: env::var("HOST").unwrap_or_else(|_| defaults::HOST.into()),
            port: env::var("PORT")
                .unwrap_or_else(|_| defaults::PORT.into())
                .parse()
                .expect("PORT must be a number"),
            database_url: env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            jwt_secret,
            jwt_access_expiry_secs: env::var("JWT_ACCESS_EXPIRY_SECS")
                .unwrap_or_else(|_| defaults::JWT_ACCESS_EXPIRY_SECS.into())
                .parse()
                .expect("JWT_ACCESS_EXPIRY_SECS must be a number"),
            jwt_refresh_expiry_secs: env::var("JWT_REFRESH_EXPIRY_SECS")
                .unwrap_or_else(|_| defaults::JWT_REFRESH_EXPIRY_SECS.into())
                .parse()
                .expect("JWT_REFRESH_EXPIRY_SECS must be a number"),
            cors_origin: env::var("CORS_ORIGIN")
                .unwrap_or_else(|_| defaults::CORS_ORIGIN.into()),
            db_max_connections: env::var("DB_MAX_CONNECTIONS")
                .unwrap_or_else(|_| defaults::DB_MAX_CONNECTIONS.into())
                .parse()
                .expect("DB_MAX_CONNECTIONS must be a number"),
        }
    }

    pub fn addr(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}
