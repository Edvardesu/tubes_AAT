import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { HTTP_STATUS, ERROR_CODES } from '@lapor-pakdhe/shared';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log the error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle AppError (our custom errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = (err.meta?.target as string[]) || ['field'];
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: {
            code: ERROR_CODES.ALREADY_EXISTS,
            message: `A record with this ${target.join(', ')} already exists`,
          },
        });
      }
      case 'P2025': {
        // Record not found
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Record not found',
          },
        });
      }
      default: {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Database error occurred',
          },
        });
      }
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: ERROR_CODES.TOKEN_INVALID,
        message: 'Invalid token',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: 'Token has expired',
      },
    });
  }

  // Handle validation errors from express-validator
  if (err.name === 'ValidationError') {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: err.message,
      },
    });
  }

  // Default to internal server error
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    },
  });
};

export default errorHandler;
