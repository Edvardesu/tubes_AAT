import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';
import { logger, Errors } from '../utils';

interface ValidatedUser {
  userId: string;
  email: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: ValidatedUser;
    }
  }
}

// Cache for validated tokens (short TTL)
const tokenCache = new Map<string, { user: ValidatedUser; expiresAt: number }>();
const TOKEN_CACHE_TTL = 60 * 1000; // 1 minute

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw Errors.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Check cache first
    const cached = tokenCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = cached.user;
      return next();
    }

    // Validate token with user-service
    const response = await axios.post(
      `${config.services.userService}/api/v1/internal/users/validate`,
      {},
      {
        headers: {
          Authorization: authHeader,
        },
        timeout: 5000,
      }
    );

    if (response.data.success && response.data.data.valid) {
      const user: ValidatedUser = {
        userId: response.data.data.userId,
        email: response.data.data.email,
        roles: response.data.data.roles || [],
      };

      // Cache the result
      tokenCache.set(token, {
        user,
        expiresAt: Date.now() + TOKEN_CACHE_TTL,
      });

      req.user = user;
      next();
    } else {
      throw Errors.unauthorized('Invalid token');
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      return next(Errors.unauthorized('Invalid or expired token'));
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      logger.error('User service unavailable', { error: error.message });
      return next(Errors.serviceUnavailable('user-service'));
    }

    if (error instanceof Error && error.name === 'GatewayError') {
      return next(error);
    }

    logger.error('Authentication error', { error: error.message });
    next(Errors.unauthorized('Authentication failed'));
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  // If token is provided, try to validate it
  await authenticate(req, res, (err) => {
    // If validation fails, continue without user
    if (err) {
      logger.debug('Optional auth failed, continuing without user', {
        error: err.message,
      });
    }
    next();
  });
};

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(Errors.unauthorized());
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return next(Errors.forbidden('Insufficient permissions'));
    }

    next();
  };
};

// Cleanup expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, value] of tokenCache.entries()) {
    if (value.expiresAt <= now) {
      tokenCache.delete(token);
    }
  }
}, 60 * 1000);
