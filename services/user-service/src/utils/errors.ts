import { HTTP_STATUS, ERROR_CODES } from '@lapor-pakdhe/shared';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Pre-defined error factories
export const Errors = {
  badRequest: (message: string, details?: Record<string, unknown>) =>
    new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_INPUT, message, details),

  unauthorized: (message = 'Unauthorized') =>
    new AppError(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED, message),

  invalidCredentials: () =>
    new AppError(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password'),

  tokenExpired: () =>
    new AppError(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_EXPIRED, 'Token has expired'),

  tokenInvalid: () =>
    new AppError(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_INVALID, 'Invalid token'),

  forbidden: (message = 'Access denied') =>
    new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, message),

  notFound: (resource: string) =>
    new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, `${resource} not found`),

  conflict: (message: string) =>
    new AppError(HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, message),

  alreadyExists: (resource: string) =>
    new AppError(HTTP_STATUS.CONFLICT, ERROR_CODES.ALREADY_EXISTS, `${resource} already exists`),

  validationError: (details: Record<string, unknown>) =>
    new AppError(HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR, 'Validation failed', details),

  internalError: (message = 'Internal server error') =>
    new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR, message, undefined, false),

  databaseError: (message = 'Database error') =>
    new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR, message, undefined, false),
};

export default AppError;
