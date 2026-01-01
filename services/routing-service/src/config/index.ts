import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.ROUTING_SERVICE_PORT || '8005', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lapor_pakdhe',

  // RabbitMQ
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  },

  // Report Service URL (for internal API calls)
  reportServiceUrl: process.env.REPORT_SERVICE_URL || 'http://localhost:8002',

  // Routing configuration
  routing: {
    // Default priority if no rules match
    defaultPriority: 3,
    // Minimum keyword matches to auto-assign department
    minKeywordMatches: 1,
  },
};

export type Config = typeof config;
export default config;
