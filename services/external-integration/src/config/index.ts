export const config = {
  port: parseInt(process.env.PORT || '8007', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lapor_pakdhe',
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  },

  // Mock external systems configuration
  externalSystems: {
    policeApi: {
      url: process.env.POLICE_API_URL || 'https://mock-police.example.com/api',
      apiKey: process.env.POLICE_API_KEY || 'mock-police-key',
    },
    fireApi: {
      url: process.env.FIRE_API_URL || 'https://mock-fire.example.com/api',
      apiKey: process.env.FIRE_API_KEY || 'mock-fire-key',
    },
    healthApi: {
      url: process.env.HEALTH_API_URL || 'https://mock-health.example.com/api',
      apiKey: process.env.HEALTH_API_KEY || 'mock-health-key',
    },
  },

  // Enable mock mode for PoC
  mockMode: process.env.MOCK_MODE !== 'false',
};
