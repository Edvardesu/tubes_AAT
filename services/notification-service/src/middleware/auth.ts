import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils';

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
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No token provided' },
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as TokenPayload;

      if (decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid token type' },
        });
      }

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        roles: decoded.roles,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Token expired' },
        });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Authentication error', { error });
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' },
    });
  }
};

export default { authenticate };
