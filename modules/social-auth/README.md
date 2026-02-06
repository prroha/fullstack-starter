# Social Authentication Module

OAuth-based social login with Google, GitHub, Facebook, and Apple providers.

## Features

- Google OAuth 2.0
- GitHub OAuth
- Apple Sign In
- Facebook Login
- Account linking (connect social accounts to existing user)
- Profile data sync from providers
- Mobile deep linking support

## Installation

### Backend Dependencies

```bash
cd backend
npm install passport passport-google-oauth20 passport-github2
npm install -D @types/passport @types/passport-google-oauth20 @types/passport-github2
```

### Web Dependencies

No additional dependencies required (uses native fetch).

### Mobile Dependencies

Add to `pubspec.yaml`:

```yaml
dependencies:
  google_sign_in: ^6.2.1
  sign_in_with_apple: ^5.0.0
  flutter_facebook_auth: ^6.0.0
  url_launcher: ^6.2.0
```

## Environment Variables

### Backend (`backend/.env`)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Apple Sign In (optional)
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Facebook Login (optional)
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# OAuth callback URLs
OAUTH_CALLBACK_URL=http://localhost:8000/api/v1/oauth
OAUTH_SUCCESS_REDIRECT=http://localhost:3000/auth/callback
OAUTH_FAILURE_REDIRECT=http://localhost:3000/login?error=oauth_failed
```

### Web (`web/.env.local`)

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
NEXT_PUBLIC_APPLE_CLIENT_ID=your-apple-client-id
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
```

## Setup Instructions

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to APIs & Services > Credentials
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:8000/api/v1/oauth/google/callback` (development)
   - `https://yourdomain.com/api/v1/oauth/google/callback` (production)
6. Copy Client ID and Client Secret to `.env`

### 2. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:8000/api/v1/oauth/github/callback`
4. Copy Client ID and Client Secret to `.env`

### 3. Apple Sign In Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create an App ID with Sign In with Apple capability
3. Create a Services ID for web authentication
4. Create a private key for Sign In with Apple
5. Configure return URLs and domains

### 4. Backend Integration

Register routes in `backend/src/routes/index.ts`:

```typescript
import oauthRoutes from "@modules/social-auth/backend/src/routes/oauth.routes";

v1Router.use("/oauth", oauthRoutes);
```

Initialize Passport in `backend/src/app.ts`:

```typescript
import passport from "passport";
import { configurePassport } from "@modules/social-auth/backend/src/services/oauth.service";

// After session middleware
app.use(passport.initialize());
configurePassport();
```

### 5. Web Integration

Add social login buttons to your login page:

```tsx
import SocialLoginButtons from "@modules/social-auth/web/src/components/social-login-buttons";

export default function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      {/* Regular login form */}
      <SocialLoginButtons />
    </div>
  );
}
```

### 6. Mobile Integration

```dart
import 'social_login_buttons.dart';

// In your login screen
SocialLoginButtons(
  onGoogleSignIn: _handleGoogleSignIn,
  onAppleSignIn: _handleAppleSignIn,
  onGitHubSignIn: _handleGitHubSignIn,
)
```

## Database Schema

Add the SocialAccount model to your `prisma/schema.prisma` and update the User model:

```prisma
// ============================================================================
// ENUMS
// ============================================================================

enum UserRole {
  USER
  ADMIN
}

// ============================================================================
// MODELS
// ============================================================================

/// User model - core authentication
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash") // Empty string for social-only users
  name          String?
  avatar        String?   // Profile picture URL from social provider
  role          UserRole  @default(USER)
  isActive      Boolean   @default(true) @map("is_active")
  emailVerified Boolean   @default(false) @map("email_verified")

  // Auth provider tracking
  authProvider  String    @default("email") @map("auth_provider") // 'email', 'google', 'github', 'apple'

  // Session management
  activeDeviceId String?  @map("active_device_id")

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  socialAccounts SocialAccount[]

  @@index([email])
  @@map("users")
}

/// Social account linking - allows multiple providers per user
model SocialAccount {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  provider      String   // 'google', 'github', 'apple', 'facebook'
  providerId    String   @map("provider_id") // Provider's unique user ID
  email         String?  // Email from provider (may differ from User.email)
  name          String?  // Display name from provider
  avatar        String?  // Avatar URL from provider
  accessToken   String?  @map("access_token") // Encrypted in production
  refreshToken  String?  @map("refresh_token") // Encrypted in production
  expiresAt     DateTime? @map("expires_at") // Token expiration
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerId]) // Each provider account can only be linked once
  @@index([userId])
  @@map("social_accounts")
}
```

After adding the schema, run migrations:

```bash
cd backend
npx prisma migrate dev --name add_social_accounts
npx prisma generate
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/oauth/providers` | List available OAuth providers |
| GET | `/oauth/google` | Initiate Google OAuth (web) |
| GET | `/oauth/google/callback` | Google OAuth callback |
| GET | `/oauth/github` | Initiate GitHub OAuth (web) |
| GET | `/oauth/github/callback` | GitHub OAuth callback |
| POST | `/oauth/mobile/google` | Mobile Google sign-in (ID token) |
| POST | `/oauth/mobile/github` | Mobile GitHub sign-in (access token) |
| POST | `/oauth/mobile/apple` | Mobile Apple sign-in (ID token) |
| GET | `/oauth/accounts` | List linked social accounts (auth required) |
| POST | `/oauth/link/:provider` | Link social account (auth required) |
| DELETE | `/oauth/disconnect/:provider` | Disconnect social account (auth required) |

## Authentication Flow

### Web Flow

```
1. User clicks "Sign in with Google"
2. Redirect to /api/v1/oauth/google
3. User authenticates with Google
4. Google redirects to /api/v1/oauth/google/callback
5. Backend creates/updates user, generates JWT
6. Redirect to frontend with auth cookie set
```

### Mobile Flow

```
1. User taps "Sign in with Google"
2. Google Sign-In SDK opens native flow
3. Get ID token from Google
4. POST token to /api/v1/oauth/mobile/google
5. Backend verifies token, creates/updates user
6. Return JWT tokens to mobile app
```

## Usage Examples

### Backend: Manual OAuth Verification

```typescript
import { OAuthService } from "./services/oauth.service";

const oauth = new OAuthService();

// Verify Google ID token (for mobile)
const user = await oauth.verifyGoogleToken(idToken);

// Verify GitHub token
const profile = await oauth.getGitHubProfile(accessToken);
```

### Web: Custom OAuth Button

```tsx
"use client";

const handleGoogleLogin = () => {
  // Redirect to OAuth endpoint
  window.location.href = "/api/oauth/google";
};

const handleGoogleCallback = async (code: string) => {
  // For popup-based flow
  const response = await fetch("/api/oauth/google/callback", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  const { user, token } = await response.json();
};
```

### Mobile: Google Sign-In

```dart
import 'package:google_sign_in/google_sign_in.dart';

final GoogleSignIn _googleSignIn = GoogleSignIn(
  scopes: ['email', 'profile'],
);

Future<void> signInWithGoogle() async {
  try {
    final account = await _googleSignIn.signIn();
    if (account == null) return;

    final auth = await account.authentication;
    final idToken = auth.idToken;

    // Send to backend
    final response = await api.post('/oauth/mobile/google', {
      'idToken': idToken,
    });

    // Handle response...
  } catch (e) {
    print('Google sign-in error: $e');
  }
}
```

## Account Linking

Users can link multiple social accounts:

```typescript
// Link Google account to existing user
POST /oauth/link/google
Authorization: Bearer <jwt>

// Response includes updated user with linked accounts
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "socialAccounts": [
      { "provider": "google", "email": "user@gmail.com" },
      { "provider": "github", "email": "user@users.noreply.github.com" }
    ]
  }
}
```

## Security Considerations

### CSRF Protection (State Parameter)

This module implements secure CSRF protection using cryptographically random state parameters:

1. **State Generation**: When initiating OAuth flow, a 32-byte random token is generated
2. **State Storage**: The token is stored server-side with a 10-minute TTL
3. **State Validation**: On callback, the state is validated before processing
4. **One-Time Use**: Each state token can only be used once

```typescript
// State is automatically generated and validated
// GET /oauth/google?returnUrl=/dashboard
// The state parameter contains encrypted CSRF token + return URL
```

### Token Security

- **Apple JWT Verification**: Tokens are verified using Apple's public keys (fetched from `appleid.apple.com/auth/keys`)
- **Google Token Verification**: Uses official Google OAuth2Client library
- **GitHub Token Verification**: Validates via GitHub API with the provided access token

### Best Practices

- Always verify OAuth state parameter to prevent CSRF attacks
- Validate ID tokens on the backend, never trust client-side validation
- Store access/refresh tokens encrypted in database (implement encryption before production)
- Implement rate limiting on OAuth endpoints
- Use HTTPS in production (required for OAuth redirects)
- Validate redirect URLs against a whitelist
- Never expose client secrets to frontend code
- Implement token rotation for refresh tokens
- Monitor for suspicious login patterns (multiple providers, geographic anomalies)

## Troubleshooting

### "redirect_uri_mismatch" Error

1. Check that redirect URI in provider console exactly matches
2. Include full path including /callback
3. Ensure protocol matches (http vs https)

### "invalid_client" Error

1. Verify client ID and secret are correct
2. Check if OAuth app is still active
3. Ensure credentials are for correct environment

### Mobile Sign-In Fails

1. Verify SHA-1 fingerprint (Android)
2. Check bundle ID configuration (iOS)
3. Ensure OAuth consent screen is configured
4. Check if app is in testing mode (Google)

### Token Verification Fails

1. Check token hasn't expired
2. Verify audience matches your client ID
3. Ensure token is from correct provider
