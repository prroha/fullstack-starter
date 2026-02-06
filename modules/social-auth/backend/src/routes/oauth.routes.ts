import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { getOAuthService, OAuthUser, OAuthProvider } from '../services/oauth.service';

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

  // Store return URL in session/state if provided
  const returnUrl = req.query.returnUrl as string;
  const state = returnUrl ? Buffer.from(returnUrl).toString('base64') : undefined;

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

      // Find or create user in database
      const { user, token } = await findOrCreateUser(oauthUser);

      // Decode return URL from state
      let redirectUrl = SUCCESS_REDIRECT;
      if (req.query.state) {
        try {
          const returnUrl = Buffer.from(req.query.state as string, 'base64').toString();
          if (returnUrl.startsWith('/')) {
            redirectUrl = SUCCESS_REDIRECT.replace('/auth/callback', returnUrl);
          }
        } catch {
          // Ignore invalid state
        }
      }

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

  const returnUrl = req.query.returnUrl as string;
  const state = returnUrl ? Buffer.from(returnUrl).toString('base64') : undefined;

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

      const { user, token } = await findOrCreateUser(oauthUser);

      let redirectUrl = SUCCESS_REDIRECT;
      if (req.query.state) {
        try {
          const returnUrl = Buffer.from(req.query.state as string, 'base64').toString();
          if (returnUrl.startsWith('/')) {
            redirectUrl = SUCCESS_REDIRECT.replace('/auth/callback', returnUrl);
          }
        } catch {
          // Ignore invalid state
        }
      }

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
// Account Linking
// =============================================================================

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

      // Link account to user (implement with your database)
      // await prisma.socialAccount.create({
      //   data: {
      //     userId,
      //     provider: oauthUser.provider,
      //     providerId: oauthUser.providerId,
      //     email: oauthUser.email,
      //     name: oauthUser.name,
      //     avatar: oauthUser.avatar,
      //   },
      // });

      res.json({
        success: true,
        message: `${provider} account linked successfully`,
        linkedAccount: {
          provider: oauthUser.provider,
          email: oauthUser.email,
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

      // Check user has password or other linked accounts before disconnecting
      // const user = await prisma.user.findUnique({
      //   where: { id: userId },
      //   include: { socialAccounts: true },
      // });
      //
      // if (!user?.passwordHash && user?.socialAccounts.length <= 1) {
      //   return res.status(400).json({
      //     error: 'Cannot disconnect last authentication method',
      //   });
      // }
      //
      // await prisma.socialAccount.deleteMany({
      //   where: { userId, provider },
      // });

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
 * Replace this with your actual database implementation
 */
async function findOrCreateUser(oauthUser: OAuthUser): Promise<UserWithTokens> {
  // TODO: Implement with your database (Prisma example below)
  //
  // // Check if social account exists
  // let socialAccount = await prisma.socialAccount.findUnique({
  //   where: {
  //     provider_providerId: {
  //       provider: oauthUser.provider,
  //       providerId: oauthUser.providerId,
  //     },
  //   },
  //   include: { user: true },
  // });
  //
  // let user;
  //
  // if (socialAccount) {
  //   // Existing user
  //   user = socialAccount.user;
  //
  //   // Update social account tokens
  //   await prisma.socialAccount.update({
  //     where: { id: socialAccount.id },
  //     data: {
  //       accessToken: oauthUser.accessToken,
  //       refreshToken: oauthUser.refreshToken,
  //     },
  //   });
  // } else {
  //   // Check if user with same email exists
  //   if (oauthUser.email) {
  //     user = await prisma.user.findUnique({
  //       where: { email: oauthUser.email },
  //     });
  //   }
  //
  //   if (!user) {
  //     // Create new user
  //     user = await prisma.user.create({
  //       data: {
  //         email: oauthUser.email || `${oauthUser.providerId}@${oauthUser.provider}.oauth`,
  //         name: oauthUser.name,
  //         avatar: oauthUser.avatar,
  //       },
  //     });
  //   }
  //
  //   // Create social account link
  //   await prisma.socialAccount.create({
  //     data: {
  //       userId: user.id,
  //       provider: oauthUser.provider,
  //       providerId: oauthUser.providerId,
  //       email: oauthUser.email,
  //       name: oauthUser.name,
  //       avatar: oauthUser.avatar,
  //       accessToken: oauthUser.accessToken,
  //       refreshToken: oauthUser.refreshToken,
  //     },
  //   });
  // }
  //
  // // Generate JWT tokens
  // const token = generateAccessToken(user);
  // const refreshToken = generateRefreshToken(user);

  // Stub implementation - replace with above
  const stubUser = {
    id: `user-${oauthUser.providerId}`,
    email: oauthUser.email,
    name: oauthUser.name,
    avatar: oauthUser.avatar,
  };

  return {
    user: stubUser,
    token: 'stub-access-token',
    refreshToken: 'stub-refresh-token',
  };
}

export default router;
