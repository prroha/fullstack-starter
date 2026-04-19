# API Error Codes

All error responses follow this envelope:

```json
{
  "data": null,
  "error": {
    "code": "error_code",
    "message": "Human-readable description"
  }
}
```

## Error Codes

### Authentication

| Code                  | HTTP Status | When                                                                       |
| --------------------- | ----------- | -------------------------------------------------------------------------- |
| `invalid_credentials` | 401         | Wrong email/password on login                                              |
| `invalid_token`       | 401         | Missing, malformed, or wrong token type                                    |
| `token_expired`       | 401         | JWT access or refresh token has expired                                    |
| `forbidden`           | 403         | Valid token but insufficient role (e.g., non-admin hitting admin endpoint) |

### Validation

| Code                   | HTTP Status | When                                                                 |
| ---------------------- | ----------- | -------------------------------------------------------------------- |
| `validation_error`     | 422         | Request body fails validation (message contains field-level details) |
| `invalid_json`         | 400         | Malformed JSON or wrong field types in request body                  |
| `missing_content_type` | 415         | Request missing `Content-Type: application/json` header              |

### Resources

| Code           | HTTP Status | When                                                     |
| -------------- | ----------- | -------------------------------------------------------- |
| `not_found`    | 404         | User or resource does not exist                          |
| `email_exists` | 409         | Email already registered (on register or profile update) |

### Server

| Code             | HTTP Status | When                                                 |
| ---------------- | ----------- | ---------------------------------------------------- |
| `internal_error` | 500         | Unexpected server error (details logged server-side) |

## Frontend Mapping

Map these codes to user-facing messages in your API client:

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password",
  invalid_token: "Please log in again",
  token_expired: "Your session has expired. Please log in again",
  forbidden: "You don't have permission to do this",
  validation_error: "", // Use the message field directly
  email_exists: "This email is already registered",
  not_found: "Not found",
  internal_error: "Something went wrong. Please try again later",
};
```

## Response Headers

| Header         | Description                                           |
| -------------- | ----------------------------------------------------- |
| `x-request-id` | UUID for request correlation. Include in bug reports. |
