import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { getOAuthService, OAuthUser, OAuthProvider } from '../services/oauth.service';
import { db } from '@core/backend/src/lib/db';
import { generateAccessToken, generateRefreshToken } from '@core/backend/src/utils/jwt';

// =============================================================================
// Types
// =============================================================================

interface MobileAuthRequest {
  idToken?: string;
  accessToken?: string;
  authorizationCode?: string;
  user?: {
    name?: string;
    email?: string;
  };
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// =============================================================================
// Router Setup
// =============================================================================

const router = Router();
const oauth = getOAuthService();

// Success/failure redirect URLs
const SUCCESS_REDIRECT =
  process.env.OAUTH_SUCCESS_REDIRECT || 'http://localhost:3000/auth/callback';
const FAILURE_REDIRECT =
  process.env.OAUTH_FAILURE_REDIRECT || 'http://localhost:3000/login?error=oauth_failed';

// =============================================================================
// Provider List
// =============================================================================

/**
 * GET /oauth/providers
 * List available OAuth providers
 */
router.get('/providers', (_req: Request, res: Response): void => {
  const providers = oauth.getConfiguredProviders();

  res.json({
    success: true,
    providers: providers.map((p) => ({
      id: p,
      name: p.charAt(0).toUpperCase() + p.slice(1),
      enabled: true,
    })),
  });
});

// =============================================================================
// Google OAuth
// =============================================================================

/**
 * GET /oauth/google
 * Initiate Google OAuth flow
 */
router.get('/google', (req: Request, res: Response, next: NextFunction): void => {
  if (!oauth.isProviderConfigured('google')) {
    res.status(501).json({ error: 'Google OAuth not configured' });
    return;
  }

  // Generate secure state parameter for CSRF protection
  const returnUrl = req.query.returnUrl as string;
  const state = oauth.generateState(returnUrl);

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state,
  } as passport.AuthenticateOptions)(req, res, next);
});

/**
 * GET /oauth/google/callback
 * Handle Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: FAILURE_REDIRECT }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const oauthUser = req.user as OAuthUser;

      if (!oauthUser) {
        res.redirect(FAILURE_REDIRECT);
        return;
      }

      // Validate CSRF state parameter
      let redirectUrl = SUCCESS_REDIRECT;
      if (req.query.state) {
        const stateValidation = oauth.validateState(req.query.state as string);
        if (!stateValidation.valid) {
          console.error('[OAuthRoutes] State validation failed:', stateValidation.error);
          res.redirect(FAILURE_REDIRECT + '&reason=csrf_validation_failed');
          return;
        }
        if (stateValidation.returnUrl && stateValidation.returnUrl.startsWith('/')) {
          redirectUrl = SUCCESS_REDIRECT.replace('/auth/callback', stateValidation.returnUrl);
        }
      }

      // Find or create user in database
      const { user, token } = await findOrCreateUser(oauthUser);

      // Set auth cookie and redirect
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.redirect(redirectUrl + `?provider=google&userId=${user.id}`);
    } catch (error) {
      console.error('[OAuthRoutes] Google callback error:', error);
      res.redirect(FAILURE_REDIRECT);
    }
  }
);

// =============================================================================
// GitHub OAuth
// =============================================================================

/**
 * GET /oauth/github
 * Initiate GitHub OAuth flow
 */
router.get('/github', (req: Request, res: Response, next: NextFunction): void => {
  if (!oauth.isProviderConfigured('github')) {
    res.status(501).json({ error: 'GitHub OAuth not configured' });
    return;
  }

  // Generate secure state parameter for CSRF protection
  const returnUrl = req.query.returnUrl as string;
  const state = oauth.generateState(returnUrl);

  passport.authenticate('github', {
    scope: ['user:email'],
    state,
  } as passport.AuthenticateOptions)(req, res, next);
});

/**
 * GET /oauth/github/callback
 * Handle GitHub OAuth callback
 */
router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: FAILURE_REDIRECT }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const oauthUser = req.user as OAuthUser;

      if (!oauthUser) {
        res.redirect(FAILURE_REDIRECT);
        return;
      }

      // Validate CSRF state parameter
      let redirectUrl = SUCCESS_REDIRECT;
      if (req.query.state) {
        const stateValidation = oauth.validateState(req.query.state as string);
        if (!stateValidation.valid) {
          console.error('[OAuthRoutes] State validation failed:', stateValidation.error);
          res.redirect(FAILURE_REDIRECT + '&reason=csrf_validation_failed');
          return;
        }
        if (stateValidation.returnUrl && stateValidation.returnUrl.startsWith('/')) {
          redirectUrl = SUCCESS_REDIRECT.replace('/auth/callback', stateValidation.returnUrl);
        }
      }

      const { user, token } = await findOrCreateUser(oauthUser);

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(redirectUrl + `?provider=github&userId=${user.id}`);
    } catch (error) {
      console.error('[OAuthRoutes] GitHub callback error:', error);
      res.redirect(FAILURE_REDIRECT);
    }
  }
);

// =============================================================================
// Mobile OAuth Endpoints
// =============================================================================

/**
 * POST /oauth/mobile/google
 * Handle Google sign-in from mobile app
 */
router.post('/mobile/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body as MobileAuthRequest;

    if (!idToken) {
      res.status(400).json({ error: 'idToken is required' });
      return;
    }

    const result = await oauth.verifyGoogleToken(idToken);

    if (!result.success || !result.user) {
      res.status(401).json({ error: result.error || 'Invalid token' });
      return;
    }

    const { user, token, refreshToken } = await findOrCreateUser(result.user);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken: token,
      refreshToken,
    });
  } catch (error) {
    console.error('[OAuthRoutes] Mobile Google auth error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
});

/**
 * POST /oauth/mobile/github
 * Handle GitHub sign-in from mobile app
 */
router.post('/mobile/github', async (req: Request, res: Response): Promise<void> => {
  try {
    const { accessToken } = req.body as MobileAuthRequest;

    if (!accessToken) {
      res.status(400).json({ error: 'accessToken is required' });
      return;
    }

    const result = await oauth.verifyGitHubToken(accessToken);

    if (!result.success || !result.user) {
      res.status(401).json({ error: result.error || 'Invalid token' });
      return;
    }

    const { user, token, refreshToken } = await findOrCreateUser(result.user);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken: token,
      refreshToken,
    });
  } catch (error) {
    console.error('[OAuthRoutes] Mobile GitHub auth error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
});

/**
 * POST /oauth/mobile/apple
 * Handle Apple sign-in from mobile app
 */
router.post('/mobile/apple', async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, authorizationCode, user: appleUser } = req.body as MobileAuthRequest;

    if (!idToken) {
      res.status(400).json({ error: 'idToken is required' });
      return;
    }

    const result = await oauth.verifyAppleToken(idToken, authorizationCode);

    if (!result.success || !result.user) {
      res.status(401).json({ error: result.error || 'Invalid token' });
      return;
    }

    // Apple only sends user info on first sign-in
    if (appleUser) {
      result.user.name = appleUser.name || result.user.name;
      result.user.email = appleUser.email || result.user.email;
    }

    const { user, token, refreshToken } = await findOrCreateUser(result.user);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken: token,
      refreshToken,
    });
  } catch (error) {
    console.error('[OAuthRoutes] Mobile Apple auth error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
});

// =============================================================================
// Account Management
// =============================================================================

/**
 * GET /oauth/accounts
 * List all linked social accounts for the authenticated user
 */
router.get('/accounts', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        socialAccounts: {
          select: {
            id: true,
            provider: true,
            email: true,
            name: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      accounts: user.socialAccounts,
      hasPassword: !!user.passwordHash,
      canDisconnect: !!user.passwordHash || user.socialAccounts.length > 1,
    });
  } catch (error) {
    console.error('[OAuthRoutes] Get accounts error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get linked accounts',
    });
  }
});

/**
 * POST /oauth/link/:provider
 * Link a social account to existing user
 */
router.post(
  '/link/:provider',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const provider = req.params.provider as OAuthProvider;
      const { idToken, accessToken } = req.body as MobileAuthRequest;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!['google', 'github', 'apple'].includes(provider)) {
        res.status(400).json({ error: 'Invalid provider' });
        return;
      }

      let oauthUser: OAuthUser | undefined;

      if (provider === 'google' && idToken) {
        const result = await oauth.verifyGoogleToken(idToken);
        oauthUser = result.user;
      } else if (provider === 'github' && accessToken) {
        const result = await oauth.verifyGitHubToken(accessToken);
        oauthUser = result.user;
      } else if (provider === 'apple' && idToken) {
        const result = await oauth.verifyAppleToken(idToken);
        oauthUser = result.user;
      }

      if (!oauthUser) {
        res.status(400).json({ error: 'Invalid credentials for provider' });
        return;
      }

      // Check if this social account is already linked to another user
      const existingAccount = await db.socialAccount.findUnique({
        where: {
          provider_providerId: {
            provider: oauthUser.provider,
            providerId: oauthUser.providerId,
          },
        },
      });

      if (existingAccount) {
        if (existingAccount.userId === userId) {
          res.status(400).json({ error: 'This account is already linked to your profile' });
          return;
        }
        res.status(400).json({ error: 'This social account is already linked to another user' });
        return;
      }

      // Link account to user
      const linkedAccount = await db.socialAccount.create({
        data: {
          userId,
          provider: oauthUser.provider,
          providerId: oauthUser.providerId,
          email: oauthUser.email,
          name: oauthUser.name,
          avatar: oauthUser.avatar,
          accessToken: oauthUser.accessToken,
          refreshToken: oauthUser.refreshToken,
        },
      });

      res.json({
        success: true,
        message: `${provider} account linked successfully`,
        linkedAccount: {
          id: linkedAccount.id,
          provider: linkedAccount.provider,
          email: linkedAccount.email,
        },
      });
    } catch (error) {
      console.error('[OAuthRoutes] Link account error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to link account',
      });
    }
  }
);

/**
 * DELETE /oauth/disconnect/:provider
 * Disconnect a social account
 */
router.delete(
  '/disconnect/:provider',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const provider = req.params.provider as OAuthProvider;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Validate provider parameter
      if (!['google', 'github', 'apple', 'facebook'].includes(provider)) {
        res.status(400).json({ error: 'Invalid provider' });
        return;
      }

      // Check user has password or other linked accounts before disconnecting
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { socialAccounts: true },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Ensure user won't be locked out
      const hasPassword = !!user.passwordHash;
      const socialAccountCount = user.socialAccounts.length;
      const hasThisProvider = user.socialAccounts.some((acc) => acc.provider === provider);

      if (!hasThisProvider) {
        res.status(400).json({ error: `No ${provider} account is linked` });
        return;
      }

      if (!hasPassword && socialAccountCount <= 1) {
        res.status(400).json({
          error: 'Cannot disconnect last authentication method. Please set a password first or link another social account.',
        });
        return;
      }

      // Delete the social account link
      await db.socialAccount.deleteMany({
        where: { userId, provider },
      });

      res.json({
        success: true,
        message: `${provider} account disconnected`,
      });
    } catch (error) {
      console.error('[OAuthRoutes] Disconnect account error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to disconnect account',
      });
    }
  }
);

// =============================================================================
// Helper Functions
// =============================================================================

interface UserWithTokens {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
  };
  token: string;
  refreshToken: string;
}

/**
 * Find or create user from OAuth data
 * Uses Prisma for database operations
 */
async function findOrCreateUser(oauthUser: OAuthUser): Promise<UserWithTokens> {
  // Check if social account already exists
  let socialAccount = await db.socialAccount.findUnique({
    where: {
      provider_providerId: {
        provider: oauthUser.provider,
        providerId: oauthUser.providerId,
      },
    },
    include: { user: true },
  });

  let user;

  if (socialAccount) {
    // Existing user - update social account tokens if provided
    user = socialAccount.user;

    if (oauthUser.accessToken || oauthUser.refreshToken) {
      await db.socialAccount.update({
        where: { id: socialAccount.id },
        data: {
          accessToken: oauthUser.accessToken,
          refreshToken: oauthUser.refreshToken,
          // Update profile info if changed
          email: oauthUser.email || socialAccount.email,
          name: oauthUser.name || socialAccount.name,
          avatar: oauthUser.avatar || socialAccount.avatar,
          updatedAt: new Date(),
        },
      });
    }

    // Update user's avatar if not set and provider has one
    if (!user.avatar && oauthUser.avatar) {
      await db.user.update({
        where: { id: user.id },
        data: { avatar: oauthUser.avatar },
      });
      user.avatar = oauthUser.avatar;
    }
  } else {
    // No existing social account - check if user with same email exists
    if (oauthUser.email) {
      user = await db.user.findUnique({
        where: { email: oauthUser.email },
      });
    }

    if (!user) {
      // Create new user
      // Generate a placeholder email if none provided (some providers like Apple may hide email)
      const email = oauthUser.email || `${oauthUser.providerId}@${oauthUser.provider}.oauth`;

      user = await db.user.create({
        data: {
          email,
          name: oauthUser.name,
          avatar: oauthUser.avatar,
          authProvider: oauthUser.provider,
          emailVerified: !!oauthUser.email, // Assume verified if provider gave us email
          passwordHash: '', // No password for social-only users
        },
      });
    }

    // Create social account link
    await db.socialAccount.create({
      data: {
        userId: user.id,
        provider: oauthUser.provider,
        providerId: oauthUser.providerId,
        email: oauthUser.email,
        name: oauthUser.name,
        avatar: oauthUser.avatar,
        accessToken: oauthUser.accessToken,
        refreshToken: oauthUser.refreshToken,
      },
    });
  }

  // Generate JWT tokens
  const tokenPayload = { userId: user.id, email: user.email };
  const token = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
    token,
    refreshToken,
  };
}

export default router;
