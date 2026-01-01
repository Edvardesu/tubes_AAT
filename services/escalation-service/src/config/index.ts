import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.ESCALATION_SERVICE_PORT || '8006', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lapor_pakdhe',

  // RabbitMQ
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  },

  // Report Service URL (for internal API calls)
  reportServiceUrl: process.env.REPORT_SERVICE_URL || 'http://localhost:8002',

  // SLA Configuration
  sla: {
    level1Hours: parseInt(process.env.SLA_LEVEL1_HOURS || '72', 10),
    level2Hours: parseInt(process.env.SLA_LEVEL2_HOURS || '168', 10),
    maxEscalationLevel: parseInt(process.env.MAX_ESCALATION_LEVEL || '3', 10),
  },

  // Escalation check interval (cron expression)
  escalationCheckCron: process.env.ESCALATION_CHECK_CRON || '*/5 * * * *', // Every 5 minutes

  // Escalation report interval (cron expression)
  escalationReportCron: process.env.ESCALATION_REPORT_CRON || '0 * * * *', // Every hour
};

export type Config = typeof config;
export default config;
