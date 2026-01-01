import { HTTP_STATUS } from '@lapor-pakdhe/shared';

export class GatewayError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: string = 'GATEWAY_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const Errors = {
  serviceUnavailable: (service: string) =>
    new GatewayError(
      `Service ${service} is currently unavailable`,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      'SERVICE_UNAVAILABLE'
    ),

  circuitOpen: (service: string) =>
    new GatewayError(
      `Circuit breaker is open for ${service}`,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      'CIRCUIT_OPEN'
    ),

  unauthorized: (message: string = 'Authentication required') =>
    new GatewayError(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Access denied') =>
    new GatewayError(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN'),

  rateLimitExceeded: () =>
    new GatewayError(
      'Too many requests, please try again later',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'RATE_LIMIT_EXCEEDED'
    ),

  badGateway: (message: string = 'Bad gateway') =>
    new GatewayError(message, HTTP_STATUS.BAD_GATEWAY, 'BAD_GATEWAY'),

  timeout: (service: string) =>
    new GatewayError(
      `Request to ${service} timed out`,
      HTTP_STATUS.GATEWAY_TIMEOUT,
      'GATEWAY_TIMEOUT'
    ),
};
