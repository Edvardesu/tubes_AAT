import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '8003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lapor_pakdhe',

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // RabbitMQ
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  },

  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],

  // JWT (for WebSocket auth)
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-jwt-access-key',
  },

  // SMTP (Mock for PoC)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || 'noreply@lapor-pakdhe.id',
    password: process.env.SMTP_PASSWORD || 'mock-password',
    from: process.env.SMTP_FROM || 'Lapor Pakdhe <noreply@lapor-pakdhe.id>',
    // Mock mode - just logs emails instead of sending
    mockMode: process.env.SMTP_MOCK_MODE !== 'false', // Default true for PoC
  },
};

export type Config = typeof config;
export default config;
