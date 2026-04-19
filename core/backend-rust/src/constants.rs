/// Centralized constants for the application.
/// Avoids magic numbers and repeated strings across the codebase.

// =====================================================
// Validation Limits
// =====================================================

pub mod validation {
    pub const NAME_MIN_LENGTH: u64 = 2;
    pub const NAME_MAX_LENGTH: u64 = 100;
    pub const PASSWORD_MIN_LENGTH: u64 = 8;
    pub const PASSWORD_MAX_LENGTH: u64 = 128;
    pub const EMAIL_MAX_LENGTH: u64 = 254;
}

// =====================================================
// Pagination
// =====================================================

pub mod pagination {
    pub const DEFAULT_PAGE: u32 = 1;
    pub const DEFAULT_PER_PAGE: u32 = 10;
    pub const MAX_PER_PAGE: u32 = 100;
}

// =====================================================
// Auth
// =====================================================

pub mod auth {
    pub const BEARER_PREFIX: &str = "Bearer ";
    pub const TOKEN_KIND_ACCESS: &str = "access";
    pub const TOKEN_KIND_REFRESH: &str = "refresh";
}

// =====================================================
// API Error Codes
// =====================================================

pub mod error_codes {
    pub const NOT_FOUND: &str = "not_found";
    pub const EMAIL_EXISTS: &str = "email_exists";
    pub const INVALID_CREDENTIALS: &str = "invalid_credentials";
    pub const INVALID_TOKEN: &str = "invalid_token";
    pub const TOKEN_EXPIRED: &str = "token_expired";
    pub const FORBIDDEN: &str = "forbidden";
    pub const VALIDATION_ERROR: &str = "validation_error";
    pub const INTERNAL_ERROR: &str = "internal_error";
    pub const INVALID_JSON: &str = "invalid_json";
    pub const MISSING_CONTENT_TYPE: &str = "missing_content_type";
    pub const PAYLOAD_TOO_LARGE: &str = "payload_too_large";
    pub const BAD_REQUEST: &str = "bad_request";
}

// =====================================================
// Defaults
// =====================================================

pub mod defaults {
    pub const HOST: &str = "127.0.0.1";
    pub const PORT: &str = "8000";
    pub const CORS_ORIGIN: &str = "http://localhost:3000";
    pub const JWT_ACCESS_EXPIRY_SECS: &str = "900";
    pub const JWT_REFRESH_EXPIRY_SECS: &str = "604800";
    pub const DB_MAX_CONNECTIONS: &str = "10";
}
