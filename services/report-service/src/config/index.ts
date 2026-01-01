import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.REPORT_SERVICE_PORT || '8002', 10),
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

  // MinIO
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'reports-media',
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },

  // JWT (for validating tokens from API Gateway)
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-jwt-access-key',
  },

  // Encryption for anonymous reports
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key!',
  },

  // SLA Configuration
  sla: {
    level1Hours: parseInt(process.env.SLA_LEVEL1_HOURS || '72', 10),
    level2Hours: parseInt(process.env.SLA_LEVEL2_HOURS || '168', 10),
  },

  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],

  // Upload limits
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
};

export type Config = typeof config;
export default config;
