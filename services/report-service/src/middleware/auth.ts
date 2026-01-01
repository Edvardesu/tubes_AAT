import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { Errors, logger } from '../utils';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        roles: string[];
      };
    }
  }
}

interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  type: string;
}

// Authentication middleware - validates JWT from Authorization header
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw Errors.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as TokenPayload;

      if (decoded.type !== 'access') {
        throw Errors.unauthorized('Invalid token type');
      }

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        roles: decoded.roles,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw Errors.unauthorized('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw Errors.unauthorized('Invalid token');
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as TokenPayload;

      if (decoded.type === 'access') {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          roles: decoded.roles,
        };
      }
    } catch {
      // Token invalid but that's ok for optional auth
      logger.debug('Optional auth: invalid token provided');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
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

// Check if user is staff (ADMIN, STAFF, DEPARTMENT_HEAD, CITY_ADMIN)
export const isStaff = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(Errors.unauthorized());
  }

  const staffRoles = ['ADMIN', 'STAFF', 'DEPARTMENT_HEAD', 'CITY_ADMIN'];
  const hasStaffRole = req.user.roles.some((role) => staffRoles.includes(role));

  if (!hasStaffRole) {
    return next(Errors.forbidden('Staff access required'));
  }

  next();
};

export default {
  authenticate,
  optionalAuth,
  authorize,
  isStaff,
};
