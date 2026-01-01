export const config = {
  port: parseInt(process.env.PORT || '8004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lapor_pakdhe',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  },

  cache: {
    statsExpiry: 300, // 5 minutes
    trendsExpiry: 600, // 10 minutes
  },
};
