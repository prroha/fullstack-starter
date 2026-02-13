import { Request, Response, NextFunction } from 'express';

// =============================================================================
// Types
// =============================================================================

export interface AuthenticatedRequest extends Request {
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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
};
