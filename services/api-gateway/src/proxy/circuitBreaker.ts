import CircuitBreaker from 'opossum';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../config';
import { logger } from '../utils';

interface CircuitBreakerMap {
  [serviceName: string]: CircuitBreaker<[AxiosRequestConfig], AxiosResponse>;
}

const circuitBreakers: CircuitBreakerMap = {};

// Circuit breaker options
const circuitBreakerOptions = {
  timeout: config.circuitBreaker.timeout,
  errorThresholdPercentage: config.circuitBreaker.errorThreshold,
  resetTimeout: config.circuitBreaker.resetTimeout,
  volumeThreshold: 5,
};

// Create or get circuit breaker for a service
export const getCircuitBreaker = (
  serviceName: string
): CircuitBreaker<[AxiosRequestConfig], AxiosResponse> => {
  if (!circuitBreakers[serviceName]) {
    const breaker = new CircuitBreaker(
      async (requestConfig: AxiosRequestConfig) => {
        return axios(requestConfig);
      },
      circuitBreakerOptions
    );

    // Event handlers
    breaker.on('open', () => {
      logger.warn(`Circuit breaker opened for ${serviceName}`);
    });

    breaker.on('halfOpen', () => {
      logger.info(`Circuit breaker half-open for ${serviceName}`);
    });

    breaker.on('close', () => {
      logger.info(`Circuit breaker closed for ${serviceName}`);
    });

    breaker.on('fallback', () => {
      logger.debug(`Circuit breaker fallback triggered for ${serviceName}`);
    });

    breaker.on('timeout', () => {
      logger.warn(`Request timeout for ${serviceName}`);
    });

    breaker.on('reject', () => {
      logger.warn(`Request rejected (circuit open) for ${serviceName}`);
    });

    circuitBreakers[serviceName] = breaker;
  }

  return circuitBreakers[serviceName];
};

// Get circuit breaker stats for all services
export const getCircuitBreakerStats = () => {
  const stats: Record<string, any> = {};

  for (const [serviceName, breaker] of Object.entries(circuitBreakers)) {
    stats[serviceName] = {
      state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
      stats: breaker.stats,
    };
  }

  return stats;
};
