import { Request, Response, NextFunction } from 'express';
import { ServiceError, logger } from '../utils';
import { HTTP_STATUS } from '@lapor-pakdhe/shared';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default error values
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: Record<string, unknown> | undefined;

  // Handle ServiceError
  if (err instanceof ServiceError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;

    // Log operational errors at warn level
    if (err.isOperational) {
      logger.warn('Service error', {
        code,
        message,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
    } else {
      logger.error('Service error (non-operational)', {
        code,
        message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    }
  } else {
    // Log unexpected errors at error level
    logger.error('Unexpected error', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
      }),
    },
  });
};

// Handle unhandled promise rejections
export const setupUnhandledRejectionHandler = () => {
  process.on('unhandledRejection', (reason: Error) => {
    logger.error('Unhandled promise rejection', {
      message: reason?.message,
      stack: reason?.stack,
    });
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
};

export default errorHandler;
