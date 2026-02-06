import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import * as jose from 'jose';
import crypto from 'crypto';

// =============================================================================
// Types
// =============================================================================

export interface OAuthConfig {
  google?: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  github?: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  apple?: {
    clientId: string;
    teamId: string;
    keyId: string;
    privateKey: string;
    callbackUrl: string;
  };
}

export interface OAuthUser {
  provider: string;
  providerId: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  accessToken?: string;
  refreshToken?: string;
  raw?: Record<string, unknown>;
}

export interface OAuthResult {
  success: boolean;
  user?: OAuthUser;
  error?: string;
}

export type OAuthProvider = 'google' | 'github' | 'apple' | 'facebook';

// Apple public keys cache
interface ApplePublicKeyCache {
  keys: jose.JWK[];
  lastFetched: number;
}

// CSRF State store (in production, use Redis or database)
interface StateEntry {
  createdAt: number;
  returnUrl?: string;
}

const stateStore = new Map<string, StateEntry>();
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// =============================================================================
// OAuth Service
// =============================================================================

export class OAuthService {
  private googleClient: OAuth2Client | null = null;
  private config: OAuthConfig;
  private applePublicKeyCache: ApplePublicKeyCache | null = null;
  private static readonly APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';
  private static readonly APPLE_ISSUER = 'https://appleid.apple.com';
  private static readonly APPLE_KEYS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(config?: OAuthConfig) {
    this.config = config || this.getDefaultConfig();

    if (this.config.google?.clientId) {
      this.googleClient = new OAuth2Client(this.config.google.clientId);
    }
  }

  private getDefaultConfig(): OAuthConfig {
    return {
      google: process.env.GOOGLE_CLIENT_ID
        ? {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackUrl:
              process.env.OAUTH_CALLBACK_URL + '/google/callback' ||
              'http://localhost:8000/api/v1/oauth/google/callback',
          }
        : undefined,
      github: process.env.GITHUB_CLIENT_ID
        ? {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
            callbackUrl:
              process.env.OAUTH_CALLBACK_URL + '/github/callback' ||
              'http://localhost:8000/api/v1/oauth/github/callback',
          }
        : undefined,
      apple: process.env.APPLE_CLIENT_ID
        ? {
            clientId: process.env.APPLE_CLIENT_ID,
            teamId: process.env.APPLE_TEAM_ID || '',
            keyId: process.env.APPLE_KEY_ID || '',
            privateKey: process.env.APPLE_PRIVATE_KEY || '',
            callbackUrl:
              process.env.OAUTH_CALLBACK_URL + '/apple/callback' ||
              'http://localhost:8000/api/v1/oauth/apple/callback',
          }
        : undefined,
    };
  }

  // ===========================================================================
  // Passport Configuration
  // ===========================================================================

  /**
   * Configure Passport strategies
   */
  configurePassport(): void {
    // Google Strategy
    if (this.config.google) {
      passport.use(
        new GoogleStrategy(
          {
            clientID: this.config.google.clientId,
            clientSecret: this.config.google.clientSecret,
            callbackURL: this.config.google.callbackUrl,
            scope: ['profile', 'email'],
          },
          async (
            accessToken: string,
            refreshToken: string,
            profile: GoogleProfile,
            done: (error: Error | null, user?: OAuthUser) => void
          ) => {
            try {
              const user = this.extractGoogleUser(profile, accessToken, refreshToken);
              done(null, user);
            } catch (error) {
              done(error as Error);
            }
          }
        )
      );
    }

    // GitHub Strategy
    if (this.config.github) {
      passport.use(
        new GitHubStrategy(
          {
            clientID: this.config.github.clientId,
            clientSecret: this.config.github.clientSecret,
            callbackURL: this.config.github.callbackUrl,
            scope: ['user:email'],
          },
          async (
            accessToken: string,
            refreshToken: string,
            profile: GitHubProfile,
            done: (error: Error | null, user?: OAuthUser) => void
          ) => {
            try {
              const user = this.extractGitHubUser(profile, accessToken, refreshToken);
              done(null, user);
            } catch (error) {
              done(error as Error);
            }
          }
        )
      );
    }

    // Serialize/deserialize for session support (optional)
    passport.serializeUser((user, done) => {
      done(null, user);
    });

    passport.deserializeUser((user, done) => {
      done(null, user as Express.User);
    });

    console.log('[OAuthService] Passport strategies configured');
  }

  // ===========================================================================
  // Token Verification (for Mobile)
  // ===========================================================================

  /**
   * Verify Google ID token (for mobile sign-in)
   */
  async verifyGoogleToken(idToken: string): Promise<OAuthResult> {
    if (!this.googleClient) {
      return { success: false, error: 'Google OAuth not configured' };
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.google?.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return { success: false, error: 'Invalid token payload' };
      }

      const user = this.extractGooglePayload(payload);
      return { success: true, user };
    } catch (error) {
      console.error('[OAuthService] Google token verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token verification failed',
      };
    }
  }

  /**
   * Verify GitHub access token and get user profile
   */
  async verifyGitHubToken(accessToken: string): Promise<OAuthResult> {
    try {
      // Fetch user profile
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!userResponse.ok) {
        return { success: false, error: 'Invalid GitHub token' };
      }

      const profile = await userResponse.json();

      // Fetch primary email
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      let email = profile.email;
      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find(
          (e: { primary: boolean; verified: boolean; email: string }) =>
            e.primary && e.verified
        );
        if (primaryEmail) {
          email = primaryEmail.email;
        }
      }

      const user: OAuthUser = {
        provider: 'github',
        providerId: profile.id.toString(),
        email: email,
        name: profile.name || profile.login,
        avatar: profile.avatar_url,
        accessToken,
        raw: profile,
      };

      return { success: true, user };
    } catch (error) {
      console.error('[OAuthService] GitHub token verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token verification failed',
      };
    }
  }

  /**
   * Fetch Apple's public keys for JWT verification
   */
  private async fetchApplePublicKeys(): Promise<jose.JWK[]> {
    // Check cache validity
    if (
      this.applePublicKeyCache &&
      Date.now() - this.applePublicKeyCache.lastFetched < OAuthService.APPLE_KEYS_CACHE_TTL_MS
    ) {
      return this.applePublicKeyCache.keys;
    }

    try {
      const response = await fetch(OAuthService.APPLE_KEYS_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch Apple public keys: ${response.status}`);
      }

      const data = await response.json();
      const keys = data.keys as jose.JWK[];

      // Update cache
      this.applePublicKeyCache = {
        keys,
        lastFetched: Date.now(),
      };

      return keys;
    } catch (error) {
      console.error('[OAuthService] Failed to fetch Apple public keys:', error);
      // Return cached keys if available, even if expired
      if (this.applePublicKeyCache) {
        return this.applePublicKeyCache.keys;
      }
      throw error;
    }
  }

  /**
   * Verify Apple identity token with proper JWT signature verification
   */
  async verifyAppleToken(
    identityToken: string,
    _authorizationCode?: string
  ): Promise<OAuthResult> {
    if (!this.config.apple) {
      return { success: false, error: 'Apple Sign In not configured' };
    }

    try {
      // Decode header to get key ID (kid)
      const protectedHeader = jose.decodeProtectedHeader(identityToken);
      if (!protectedHeader.kid) {
        return { success: false, error: 'Missing key ID in token header' };
      }

      // Fetch Apple's public keys
      const appleKeys = await this.fetchApplePublicKeys();

      // Find the matching key
      const matchingKey = appleKeys.find((key) => key.kid === protectedHeader.kid);
      if (!matchingKey) {
        // Invalidate cache and retry once in case keys were rotated
        this.applePublicKeyCache = null;
        const freshKeys = await this.fetchApplePublicKeys();
        const retryKey = freshKeys.find((key) => key.kid === protectedHeader.kid);
        if (!retryKey) {
          return { success: false, error: 'Unable to find matching Apple public key' };
        }
        Object.assign(matchingKey ?? {}, retryKey);
      }

      // Import the public key
      const publicKey = await jose.importJWK(matchingKey!, protectedHeader.alg!);

      // Verify the token
      const { payload } = await jose.jwtVerify(identityToken, publicKey, {
        issuer: OAuthService.APPLE_ISSUER,
        audience: this.config.apple.clientId,
      });

      // Type assertion for Apple token payload
      const applePayload = payload as {
        sub: string;
        email?: string;
        email_verified?: string | boolean;
        is_private_email?: string | boolean;
        real_user_status?: number;
        nonce_supported?: boolean;
      };

      // Validate required claims
      if (!applePayload.sub) {
        return { success: false, error: 'Missing subject claim in token' };
      }

      const user: OAuthUser = {
        provider: 'apple',
        providerId: applePayload.sub,
        email: applePayload.email || null,
        name: null, // Apple only provides name on first sign-in via authorization response
        avatar: null,
        raw: applePayload as Record<string, unknown>,
      };

      return { success: true, user };
    } catch (error) {
      console.error('[OAuthService] Apple token verification error:', error);

      // Handle specific jose errors
      if (error instanceof jose.errors.JWTExpired) {
        return { success: false, error: 'Token expired' };
      }
      if (error instanceof jose.errors.JWTClaimValidationFailed) {
        return { success: false, error: 'Token claim validation failed' };
      }
      if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
        return { success: false, error: 'Invalid token signature' };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token verification failed',
      };
    }
  }

  // ===========================================================================
  // User Extraction
  // ===========================================================================

  private extractGoogleUser(
    profile: GoogleProfile,
    accessToken: string,
    refreshToken?: string
  ): OAuthUser {
    return {
      provider: 'google',
      providerId: profile.id,
      email: profile.emails?.[0]?.value || null,
      name: profile.displayName || null,
      avatar: profile.photos?.[0]?.value || null,
      accessToken,
      refreshToken,
      raw: profile._json,
    };
  }

  private extractGooglePayload(payload: TokenPayload): OAuthUser {
    return {
      provider: 'google',
      providerId: payload.sub,
      email: payload.email || null,
      name: payload.name || null,
      avatar: payload.picture || null,
    };
  }

  private extractGitHubUser(
    profile: GitHubProfile,
    accessToken: string,
    refreshToken?: string
  ): OAuthUser {
    return {
      provider: 'github',
      providerId: profile.id,
      email: profile.emails?.[0]?.value || null,
      name: profile.displayName || profile.username || null,
      avatar: profile.photos?.[0]?.value || null,
      accessToken,
      refreshToken,
      raw: profile._json,
    };
  }

  // ===========================================================================
  // Provider Info
  // ===========================================================================

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): OAuthProvider[] {
    const providers: OAuthProvider[] = [];

    if (this.config.google) providers.push('google');
    if (this.config.github) providers.push('github');
    if (this.config.apple) providers.push('apple');

    return providers;
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(provider: OAuthProvider): boolean {
    switch (provider) {
      case 'google':
        return !!this.config.google;
      case 'github':
        return !!this.config.github;
      case 'apple':
        return !!this.config.apple;
      default:
        return false;
    }
  }

  /**
   * Get OAuth authorization URL for a provider
   */
  getAuthorizationUrl(provider: OAuthProvider, state?: string): string | null {
    const baseUrl = process.env.OAUTH_CALLBACK_URL || 'http://localhost:8000/api/v1/oauth';

    switch (provider) {
      case 'google':
        if (!this.config.google) return null;
        const googleParams = new URLSearchParams({
          client_id: this.config.google.clientId,
          redirect_uri: this.config.google.callbackUrl,
          response_type: 'code',
          scope: 'openid email profile',
          access_type: 'offline',
          prompt: 'consent',
          ...(state && { state }),
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${googleParams}`;

      case 'github':
        if (!this.config.github) return null;
        const githubParams = new URLSearchParams({
          client_id: this.config.github.clientId,
          redirect_uri: this.config.github.callbackUrl,
          scope: 'user:email',
          ...(state && { state }),
        });
        return `https://github.com/login/oauth/authorize?${githubParams}`;

      default:
        return null;
    }
  }

  // ===========================================================================
  // CSRF State Management
  // ===========================================================================

  /**
   * Generate a cryptographically secure state parameter for CSRF protection
   * @param returnUrl Optional URL to redirect to after authentication
   * @returns Base64-encoded state parameter
   */
  generateState(returnUrl?: string): string {
    // Generate random bytes for CSRF token
    const csrfToken = crypto.randomBytes(32).toString('hex');

    // Store state with metadata
    stateStore.set(csrfToken, {
      createdAt: Date.now(),
      returnUrl,
    });

    // Cleanup expired states periodically
    this.cleanupExpiredStates();

    // Encode state as JSON then Base64 for URL safety
    const statePayload = JSON.stringify({
      csrf: csrfToken,
      returnUrl,
    });

    return Buffer.from(statePayload).toString('base64url');
  }

  /**
   * Validate state parameter from OAuth callback
   * @param state The state parameter from the callback
   * @returns Object with validation result and original returnUrl
   */
  validateState(state: string): { valid: boolean; returnUrl?: string; error?: string } {
    try {
      // Decode the state parameter
      const statePayload = JSON.parse(
        Buffer.from(state, 'base64url').toString('utf-8')
      );

      const csrfToken = statePayload.csrf;
      if (!csrfToken) {
        return { valid: false, error: 'Missing CSRF token in state' };
      }

      // Look up the state entry
      const stateEntry = stateStore.get(csrfToken);
      if (!stateEntry) {
        return { valid: false, error: 'Invalid or expired state parameter' };
      }

      // Check expiration
      if (Date.now() - stateEntry.createdAt > STATE_TTL_MS) {
        stateStore.delete(csrfToken);
        return { valid: false, error: 'State parameter expired' };
      }

      // Remove used state (one-time use)
      stateStore.delete(csrfToken);

      return {
        valid: true,
        returnUrl: stateEntry.returnUrl,
      };
    } catch (error) {
      console.error('[OAuthService] State validation error:', error);
      return { valid: false, error: 'Invalid state parameter format' };
    }
  }

  /**
   * Cleanup expired state entries
   */
  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [token, entry] of stateStore.entries()) {
      if (now - entry.createdAt > STATE_TTL_MS) {
        stateStore.delete(token);
      }
    }
  }
}

// =============================================================================
// Factory
// =============================================================================

let oauthServiceInstance: OAuthService | null = null;

/**
 * Get or create the OAuth service singleton
 */
export function getOAuthService(): OAuthService {
  if (!oauthServiceInstance) {
    oauthServiceInstance = new OAuthService();
  }
  return oauthServiceInstance;
}

/**
 * Configure Passport with OAuth strategies
 */
export function configurePassport(): void {
  getOAuthService().configurePassport();
}

/**
 * Create a custom OAuth service instance
 */
export function createOAuthService(config: OAuthConfig): OAuthService {
  return new OAuthService(config);
}

export default OAuthService;
