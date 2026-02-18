const SCHEMA_PREFIX = "preview_";
const VALID_CHARS = /^[a-z0-9]+$/;
const MAX_LENGTH = 63; // PostgreSQL identifier limit

/**
 * Convert a session token to a valid PostgreSQL schema name.
 * Format: preview_<sanitized_token>
 */
export function toSchemaName(sessionToken: string): string {
  const sanitized = sessionToken.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!sanitized || sanitized.length < 10) {
    throw new Error("Session token too short after sanitization");
  }
  const name = `${SCHEMA_PREFIX}${sanitized}`;
  if (name.length > MAX_LENGTH) {
    // Truncate but keep prefix
    return `${SCHEMA_PREFIX}${sanitized.slice(0, MAX_LENGTH - SCHEMA_PREFIX.length)}`;
  }
  return name;
}

/**
 * Validate a schema name follows the expected pattern.
 * Used as a safety check before SQL operations.
 */
export function isValidSchemaName(name: string): boolean {
  if (!name.startsWith(SCHEMA_PREFIX)) return false;
  const suffix = name.slice(SCHEMA_PREFIX.length);
  return suffix.length >= 10 && suffix.length <= MAX_LENGTH - SCHEMA_PREFIX.length && VALID_CHARS.test(suffix);
}

/**
 * Strict validation regex for use right before SQL execution.
 * Must match: preview_ followed by 10-55 lowercase alphanumeric chars.
 */
export const SCHEMA_NAME_REGEX = /^preview_[a-z0-9]{10,55}$/;
