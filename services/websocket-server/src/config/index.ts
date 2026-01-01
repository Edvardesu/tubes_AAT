import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '8081', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'your-super-secret-jwt-key',
  },

  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
  ],

  // Redis channels for pub/sub
  channels: {
    notifications: 'notifications',
    userNotification: (userId: string) => `user:${userId}:notifications`,
  },
};

export type Config = typeof config;
export default config;
