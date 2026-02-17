import { FastifyRequest, FastifyReply } from 'fastify';

// =============================================================================
// Types
// =============================================================================

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
    name?: string;
  };
}

// =============================================================================
// Auth Middleware (Placeholder)
// =============================================================================
// Replace with: import { authMiddleware } from '../../../../core/backend/src/middleware/auth.middleware';

export const authMiddleware = async (
  req: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw { statusCode: 401, message: 'Authentication required' };
  }
};
