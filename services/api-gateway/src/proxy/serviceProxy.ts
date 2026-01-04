import { Request, Response, NextFunction, Router } from 'express';
import { AxiosRequestConfig, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';
import { config } from '../config';
import { logger, Errors } from '../utils';
import { getCircuitBreaker } from './circuitBreaker';
import { authenticate, optionalAuth, getAuthRateLimiter } from '../middleware';

interface ServiceRoute {
  path: string;
  target: string;
  serviceName: string;
  requireAuth?: boolean;
  optionalAuth?: boolean;
  authRateLimit?: boolean;
  pathRewrite?: Record<string, string>;
}

// Define service routes
// NOTE: More specific routes MUST come before general routes
const serviceRoutes: ServiceRoute[] = [
  // User Service Routes
  {
    path: '/auth',
    target: config.services.userService,
    serviceName: 'user-service',
    requireAuth: false,
    authRateLimit: true,
  },
  // User's reports - routed to report-service (must be before /users)
  {
    path: '/users/me/reports',
    target: config.services.reportService,
    serviceName: 'report-service',
    requireAuth: true,
  },
  {
    path: '/users',
    target: config.services.userService,
    serviceName: 'user-service',
    requireAuth: true,
  },

  // Report Service Routes
  {
    path: '/reports',
    target: config.services.reportService,
    serviceName: 'report-service',
    optionalAuth: true, // Public access for viewing, auth for creating/editing
  },
  {
    path: '/staff',
    target: config.services.reportService,
    serviceName: 'report-service',
    requireAuth: true,
  },

  // Notification Service Routes
  {
    path: '/notifications',
    target: config.services.notificationService,
    serviceName: 'notification-service',
    requireAuth: true,
  },

  // Analytics Service Routes
  {
    path: '/analytics',
    target: config.services.analyticsService,
    serviceName: 'analytics-service',
    requireAuth: true,
  },
];

// Handle multipart requests by piping raw stream
const handleMultipartProxy = (
  req: Request,
  res: Response,
  route: ServiceRoute,
  targetPath: string,
  requestId: string,
  startTime: number,
  next: NextFunction
) => {
  const targetUrl = new URL(route.target);

  const proxyReq = http.request(
    {
      hostname: targetUrl.hostname,
      port: targetUrl.port || 80,
      path: targetPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host,
        'x-request-id': requestId,
        'x-forwarded-for': req.ip || '',
      },
    },
    (proxyRes) => {
      const duration = Date.now() - startTime;

      logger.info('Proxy request completed', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        target: route.serviceName,
        status: proxyRes.statusCode,
        duration: `${duration}ms`,
      });

      // Forward response headers
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (value && !['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
          res.setHeader(key, value as string | string[]);
        }
      }

      res.setHeader('x-request-id', requestId);
      res.status(proxyRes.statusCode || 500);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (error: any) => {
    const duration = Date.now() - startTime;

    if (error.code === 'ECONNREFUSED') {
      logger.error('Service unavailable', {
        requestId,
        serviceName: route.serviceName,
        error: error.message,
      });
      return next(Errors.serviceUnavailable(route.serviceName));
    }

    logger.error('Proxy error', {
      requestId,
      serviceName: route.serviceName,
      error: error.message,
      duration: `${duration}ms`,
    });
    next(Errors.badGateway(error.message));
  });

  // Pipe the incoming request to the proxy request
  req.pipe(proxyReq);
};

// Create proxy handler for a service
const createProxyHandler = (route: ServiceRoute) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestId = uuidv4();
    const startTime = Date.now();

    // Construct target URL
    let targetPath = req.originalUrl;

    // Apply path rewrite if configured
    if (route.pathRewrite) {
      for (const [from, to] of Object.entries(route.pathRewrite)) {
        targetPath = targetPath.replace(new RegExp(from), to);
      }
    }

    const targetUrl = `${route.target}${targetPath}`;

    logger.debug('Proxying request', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      target: targetUrl,
      serviceName: route.serviceName,
    });

    // Check if this is a multipart request - use raw stream proxy
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      return handleMultipartProxy(req, res, route, targetPath, requestId, startTime, next);
    }

    // Prepare request config for non-multipart requests
    // Note: Don't include params here since targetUrl already contains query string from req.originalUrl
    const requestConfig: AxiosRequestConfig = {
      method: req.method as any,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: new URL(route.target).host,
        'x-request-id': requestId,
        'x-forwarded-for': req.ip,
      },
      data: req.body,
      timeout: config.circuitBreaker.timeout,
      validateStatus: () => true, // Don't throw on any status
    };

    // Remove hop-by-hop headers
    delete requestConfig.headers!['connection'];
    delete requestConfig.headers!['keep-alive'];
    delete requestConfig.headers!['transfer-encoding'];
    delete requestConfig.headers!['content-length'];

    try {
      const circuitBreaker = getCircuitBreaker(route.serviceName);

      const response = await circuitBreaker.fire(requestConfig);

      const duration = Date.now() - startTime;

      logger.info('Proxy request completed', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        target: route.serviceName,
        status: response.status,
        duration: `${duration}ms`,
      });

      // Forward response headers
      for (const [key, value] of Object.entries(response.headers)) {
        if (value && !['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
          res.setHeader(key, value as string);
        }
      }

      // Add request ID to response
      res.setHeader('x-request-id', requestId);

      // Send response
      res.status(response.status).send(response.data);
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Handle circuit breaker open
      if (error.message?.includes('Breaker is open')) {
        logger.warn('Circuit breaker is open', {
          requestId,
          serviceName: route.serviceName,
          duration: `${duration}ms`,
        });
        return next(Errors.circuitOpen(route.serviceName));
      }

      // Handle timeout
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        logger.error('Request timeout', {
          requestId,
          serviceName: route.serviceName,
          duration: `${duration}ms`,
        });
        return next(Errors.timeout(route.serviceName));
      }

      // Handle connection refused
      if (error.code === 'ECONNREFUSED') {
        logger.error('Service unavailable', {
          requestId,
          serviceName: route.serviceName,
          error: error.message,
        });
        return next(Errors.serviceUnavailable(route.serviceName));
      }

      // Handle axios errors
      if ((error as AxiosError).isAxiosError) {
        const axiosError = error as AxiosError;
        logger.error('Proxy error', {
          requestId,
          serviceName: route.serviceName,
          status: axiosError.response?.status,
          message: axiosError.message,
        });
        return next(Errors.badGateway(axiosError.message));
      }

      // Unknown error
      logger.error('Unknown proxy error', {
        requestId,
        serviceName: route.serviceName,
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  };
};

// Create router with all service routes
export const createServiceRouter = (): Router => {
  const router = Router();

  for (const route of serviceRoutes) {
    const handlers: any[] = [];

    // Add auth rate limiter if needed
    if (route.authRateLimit) {
      handlers.push((req: Request, res: Response, next: NextFunction) => {
        const authRateLimiter = getAuthRateLimiter();
        if (authRateLimiter) {
          return authRateLimiter(req, res, next);
        }
        next();
      });
    }

    // Add authentication middleware if required
    if (route.requireAuth) {
      handlers.push(authenticate);
    } else if (route.optionalAuth) {
      handlers.push(optionalAuth);
    }

    // Add proxy handler
    handlers.push(createProxyHandler(route));

    // Register route for all methods
    router.all(`${route.path}*`, ...handlers);
  }

  return router;
};
