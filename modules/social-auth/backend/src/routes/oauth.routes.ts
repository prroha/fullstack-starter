import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getOAuthService, OAuthUser, OAuthProvider } from '../services/oauth.service.js';
import { db } from '@core/backend/src/lib/db.js';
import { generateAccessToken, generateRefreshToken } from '@core/backend/src/utils/jwt.js';

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

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Success/failure redirect URLs
const SUCCESS_REDIRECT =
  process.env.OAUTH_SUCCESS_REDIRECT || 'http://localhost:3000/auth/callback';
const FAILURE_REDIRECT =
  process.env.OAUTH_FAILURE_REDIRECT || 'http://localhost:3000/login?error=oauth_failed';

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
      const email = oauthUser.email || `${oauthUser.providerId}@${oauthUser.provider}.oauth`;

      user = await db.user.create({
        data: {
          email,
          name: oauthUser.name,
          avatar: oauthUser.avatar,
          authProvider: oauthUser.provider,
          emailVerified: !!oauthUser.email,
          passwordHash: '',
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

// =============================================================================
// Routes Plugin
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  const oauth = getOAuthService();

  // ===========================================================================
  // Provider List
  // ===========================================================================

  /**
   * GET /oauth/providers
   * List available OAuth providers
   */
  fastify.get('/providers', async (_req: FastifyRequest, reply: FastifyReply) => {
    const providers = oauth.getConfiguredProviders();

    return reply.send({
      success: true,
      providers: providers.map((p) => ({
        id: p,
        name: p.charAt(0).toUpperCase() + p.slice(1),
        enabled: true,
      })),
    });
  });

  // ===========================================================================
  // Google OAuth
  // ===========================================================================

  /**
   * GET /oauth/google
   * Initiate Google OAuth flow
   *
   * Note: Passport.js integration requires @fastify/passport or similar adapter.
   * This route redirects to Google for authentication.
   */
  fastify.get('/google', async (req: FastifyRequest, reply: FastifyReply) => {
    if (!oauth.isProviderConfigured('google')) {
      return reply.code(501).send({ error: 'Google OAuth not configured' });
    }

    const query = req.query as Record<string, string>;
    const returnUrl = query.returnUrl;
    const state = oauth.generateState(returnUrl);

    // Build Google OAuth URL manually (or use @fastify/passport)
    const googleAuthUrl = oauth.getAuthorizationUrl('google', {
      scope: ['profile', 'email'],
      state,
    });

    return reply.redirect(googleAuthUrl);
  });

  /**
   * GET /oauth/google/callback
   * Handle Google OAuth callback
   */
  fastify.get('/google/callback', async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const code = query.code;
    const state = query.state;

    if (!code) {
      return reply.redirect(FAILURE_REDIRECT);
    }

    // Exchange code for tokens and get user info
    const oauthResult = await oauth.handleCallback('google', code);

    if (!oauthResult.success || !oauthResult.user) {
      return reply.redirect(FAILURE_REDIRECT);
    }

    const oauthUser = oauthResult.user;

    // Validate CSRF state parameter
    let redirectUrl = SUCCESS_REDIRECT;
    if (state) {
      const stateValidation = oauth.validateState(state);
      if (!stateValidation.valid) {
        console.error('[OAuthRoutes] State validation failed:', stateValidation.error);
        return reply.redirect(FAILURE_REDIRECT + '&reason=csrf_validation_failed');
      }
      if (stateValidation.returnUrl && stateValidation.returnUrl.startsWith('/')) {
        redirectUrl = SUCCESS_REDIRECT.replace('/auth/callback', stateValidation.returnUrl);
      }
    }

    // Find or create user in database
    const { user, token } = await findOrCreateUser(oauthUser);

    // Set auth cookie and redirect
    reply.setCookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return reply.redirect(redirectUrl + `?provider=google&userId=${user.id}`);
  });

  // ===========================================================================
  // GitHub OAuth
  // ===========================================================================

  /**
   * GET /oauth/github
   * Initiate GitHub OAuth flow
   */
  fastify.get('/github', async (req: FastifyRequest, reply: FastifyReply) => {
    if (!oauth.isProviderConfigured('github')) {
      return reply.code(501).send({ error: 'GitHub OAuth not configured' });
    }

    const query = req.query as Record<string, string>;
    const returnUrl = query.returnUrl;
    const state = oauth.generateState(returnUrl);

    const githubAuthUrl = oauth.getAuthorizationUrl('github', {
      scope: ['user:email'],
      state,
    });

    return reply.redirect(githubAuthUrl);
  });

  /**
   * GET /oauth/github/callback
   * Handle GitHub OAuth callback
   */
  fastify.get('/github/callback', async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const code = query.code;
    const state = query.state;

    if (!code) {
      return reply.redirect(FAILURE_REDIRECT);
    }

    const oauthResult = await oauth.handleCallback('github', code);

    if (!oauthResult.success || !oauthResult.user) {
      return reply.redirect(FAILURE_REDIRECT);
    }

    const oauthUser = oauthResult.user;

    // Validate CSRF state parameter
    let redirectUrl = SUCCESS_REDIRECT;
    if (state) {
      const stateValidation = oauth.validateState(state);
      if (!stateValidation.valid) {
        console.error('[OAuthRoutes] State validation failed:', stateValidation.error);
        return reply.redirect(FAILURE_REDIRECT + '&reason=csrf_validation_failed');
      }
      if (stateValidation.returnUrl && stateValidation.returnUrl.startsWith('/')) {
        redirectUrl = SUCCESS_REDIRECT.replace('/auth/callback', stateValidation.returnUrl);
      }
    }

    const { user, token } = await findOrCreateUser(oauthUser);

    reply.setCookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return reply.redirect(redirectUrl + `?provider=github&userId=${user.id}`);
  });

  // ===========================================================================
  // Mobile OAuth Endpoints
  // ===========================================================================

  /**
   * POST /oauth/mobile/google
   * Handle Google sign-in from mobile app
   */
  fastify.post('/mobile/google', async (req: FastifyRequest, reply: FastifyReply) => {
    const { idToken } = req.body as MobileAuthRequest;

    if (!idToken) {
      return reply.code(400).send({ error: 'idToken is required' });
    }

    const result = await oauth.verifyGoogleToken(idToken);

    if (!result.success || !result.user) {
      return reply.code(401).send({ error: result.error || 'Invalid token' });
    }

    const { user, token, refreshToken } = await findOrCreateUser(result.user);

    return reply.send({
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
  });

  /**
   * POST /oauth/mobile/github
   * Handle GitHub sign-in from mobile app
   */
  fastify.post('/mobile/github', async (req: FastifyRequest, reply: FastifyReply) => {
    const { accessToken } = req.body as MobileAuthRequest;

    if (!accessToken) {
      return reply.code(400).send({ error: 'accessToken is required' });
    }

    const result = await oauth.verifyGitHubToken(accessToken);

    if (!result.success || !result.user) {
      return reply.code(401).send({ error: result.error || 'Invalid token' });
    }

    const { user, token, refreshToken } = await findOrCreateUser(result.user);

    return reply.send({
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
  });

  /**
   * POST /oauth/mobile/apple
   * Handle Apple sign-in from mobile app
   */
  fastify.post('/mobile/apple', async (req: FastifyRequest, reply: FastifyReply) => {
    const { idToken, authorizationCode, user: appleUser } = req.body as MobileAuthRequest;

    if (!idToken) {
      return reply.code(400).send({ error: 'idToken is required' });
    }

    const result = await oauth.verifyAppleToken(idToken, authorizationCode);

    if (!result.success || !result.user) {
      return reply.code(401).send({ error: result.error || 'Invalid token' });
    }

    // Apple only sends user info on first sign-in
    if (appleUser) {
      result.user.name = appleUser.name || result.user.name;
      result.user.email = appleUser.email || result.user.email;
    }

    const { user, token, refreshToken } = await findOrCreateUser(result.user);

    return reply.send({
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
  });

  // ===========================================================================
  // Account Management
  // ===========================================================================

  /**
   * GET /oauth/accounts
   * List all linked social accounts for the authenticated user
   */
  fastify.get('/accounts', async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' });
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
      return reply.code(404).send({ error: 'User not found' });
    }

    return reply.send({
      success: true,
      accounts: user.socialAccounts,
      hasPassword: !!user.passwordHash,
      canDisconnect: !!user.passwordHash || user.socialAccounts.length > 1,
    });
  });

  /**
   * POST /oauth/link/:provider
   * Link a social account to existing user
   */
  fastify.post('/link/:provider', async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const { provider } = req.params as { provider: string };
    const { idToken, accessToken } = req.body as MobileAuthRequest;

    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    if (!['google', 'github', 'apple'].includes(provider)) {
      return reply.code(400).send({ error: 'Invalid provider' });
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
      return reply.code(400).send({ error: 'Invalid credentials for provider' });
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
        return reply.code(400).send({ error: 'This account is already linked to your profile' });
      }
      return reply.code(400).send({ error: 'This social account is already linked to another user' });
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

    return reply.send({
      success: true,
      message: `${provider} account linked successfully`,
      linkedAccount: {
        id: linkedAccount.id,
        provider: linkedAccount.provider,
        email: linkedAccount.email,
      },
    });
  });

  /**
   * DELETE /oauth/disconnect/:provider
   * Disconnect a social account
   */
  fastify.delete('/disconnect/:provider', async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const { provider } = req.params as { provider: string };

    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    // Validate provider parameter
    if (!['google', 'github', 'apple', 'facebook'].includes(provider)) {
      return reply.code(400).send({ error: 'Invalid provider' });
    }

    // Check user has password or other linked accounts before disconnecting
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { socialAccounts: true },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // Ensure user won't be locked out
    const hasPassword = !!user.passwordHash;
    const socialAccountCount = user.socialAccounts.length;
    const hasThisProvider = user.socialAccounts.some((acc) => acc.provider === provider);

    if (!hasThisProvider) {
      return reply.code(400).send({ error: `No ${provider} account is linked` });
    }

    if (!hasPassword && socialAccountCount <= 1) {
      return reply.code(400).send({
        error: 'Cannot disconnect last authentication method. Please set a password first or link another social account.',
      });
    }

    // Delete the social account link
    await db.socialAccount.deleteMany({
      where: { userId, provider },
    });

    return reply.send({
      success: true,
      message: `${provider} account disconnected`,
    });
  });
};

export default routes;
