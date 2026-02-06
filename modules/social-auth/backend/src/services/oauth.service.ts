import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

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

// =============================================================================
// OAuth Service
// =============================================================================

export class OAuthService {
  private googleClient: OAuth2Client | null = null;
  private config: OAuthConfig;

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
   * Verify Apple identity token
   */
  async verifyAppleToken(
    identityToken: string,
    authorizationCode?: string
  ): Promise<OAuthResult> {
    if (!this.config.apple) {
      return { success: false, error: 'Apple Sign In not configured' };
    }

    try {
      // Decode the JWT (Apple identity token)
      const parts = identityToken.split('.');
      if (parts.length !== 3) {
        return { success: false, error: 'Invalid identity token format' };
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );

      // Verify issuer
      if (payload.iss !== 'https://appleid.apple.com') {
        return { success: false, error: 'Invalid token issuer' };
      }

      // Verify audience
      if (payload.aud !== this.config.apple.clientId) {
        return { success: false, error: 'Invalid token audience' };
      }

      // Check expiration
      if (payload.exp * 1000 < Date.now()) {
        return { success: false, error: 'Token expired' };
      }

      const user: OAuthUser = {
        provider: 'apple',
        providerId: payload.sub,
        email: payload.email || null,
        name: null, // Apple only provides name on first sign-in
        avatar: null,
        raw: payload,
      };

      return { success: true, user };
    } catch (error) {
      console.error('[OAuthService] Apple token verification error:', error);
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
