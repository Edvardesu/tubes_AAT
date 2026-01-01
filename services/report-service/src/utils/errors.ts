import { HTTP_STATUS } from '@lapor-pakdhe/shared';

export class ServiceError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, ServiceError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const Errors = {
  badRequest: (message: string = 'Bad request') =>
    new ServiceError(message, HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST'),

  unauthorized: (message: string = 'Unauthorized') =>
    new ServiceError(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Forbidden') =>
    new ServiceError(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN'),

  notFound: (resource: string = 'Resource') =>
    new ServiceError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND'),

  conflict: (message: string = 'Conflict') =>
    new ServiceError(message, HTTP_STATUS.CONFLICT, 'CONFLICT'),

  validationError: (details: Record<string, string>) =>
    new ServiceError(
      'Validation failed',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'VALIDATION_ERROR',
      true,
      { fields: details }
    ),

  fileUploadError: (message: string = 'File upload failed') =>
    new ServiceError(message, HTTP_STATUS.BAD_REQUEST, 'FILE_UPLOAD_ERROR'),

  fileTooLarge: (maxSize: number) =>
    new ServiceError(
      `File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`,
      HTTP_STATUS.BAD_REQUEST,
      'FILE_TOO_LARGE'
    ),

  invalidFileType: (allowedTypes: string[]) =>
    new ServiceError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST,
      'INVALID_FILE_TYPE'
    ),

  tooManyFiles: (maxFiles: number) =>
    new ServiceError(
      `Too many files. Maximum allowed: ${maxFiles}`,
      HTTP_STATUS.BAD_REQUEST,
      'TOO_MANY_FILES'
    ),

  reportNotEditable: () =>
    new ServiceError(
      'Report can only be edited when status is PENDING',
      HTTP_STATUS.BAD_REQUEST,
      'REPORT_NOT_EDITABLE'
    ),

  reportNotDeletable: () =>
    new ServiceError(
      'Report can only be deleted when status is PENDING',
      HTTP_STATUS.BAD_REQUEST,
      'REPORT_NOT_DELETABLE'
    ),

  alreadyUpvoted: () =>
    new ServiceError(
      'You have already upvoted this report',
      HTTP_STATUS.CONFLICT,
      'ALREADY_UPVOTED'
    ),

  cannotUpvoteOwnReport: () =>
    new ServiceError(
      'You cannot upvote your own report',
      HTTP_STATUS.BAD_REQUEST,
      'CANNOT_UPVOTE_OWN_REPORT'
    ),

  invalidTrackingToken: () =>
    new ServiceError(
      'Invalid tracking token',
      HTTP_STATUS.UNAUTHORIZED,
      'INVALID_TRACKING_TOKEN'
    ),

  internalError: (message: string = 'Internal server error') =>
    new ServiceError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', false),
};

export default Errors;
