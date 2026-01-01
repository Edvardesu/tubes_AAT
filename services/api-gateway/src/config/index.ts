import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_GATEWAY_PORT || '8080', 10),

  // Service URLs (sesuai MASTER_SPEC Section 2.2)
  services: {
    userService: process.env.USER_SERVICE_URL || 'http://localhost:8001',
    reportService: process.env.REPORT_SERVICE_URL || 'http://localhost:8002',
    notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8003',
    analyticsService: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8004',
    routingService: process.env.ROUTING_SERVICE_URL || 'http://localhost:8005',
    escalationService: process.env.ESCALATION_SERVICE_URL || 'http://localhost:8006',
    externalIntegration: process.env.EXTERNAL_INTEGRATION_URL || 'http://localhost:8007',
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    maxAuthRequests: parseInt(process.env.RATE_LIMIT_MAX_AUTH_REQUESTS || '5', 10),
  },

  // Circuit breaker
  circuitBreaker: {
    timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '10000', 10),
    errorThreshold: parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD || '50', 10),
    resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '30000', 10),
  },

  // CORS (Frontend port 3000 sesuai spec)
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

export type Config = typeof config;
