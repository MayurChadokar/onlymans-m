const { Redis } = require('ioredis');
const config = require('./env');
const logger = require('./logger');

const redisClient = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 5000,
  commandTimeout: 3000,
  retryStrategy: (times) => {
    if (times > 5) return null; // stop retrying after 5 attempts
    return Math.min(times * 200, 2000); // exponential backoff: 200ms, 400ms, 800ms...
  },
  reconnectOnError: (err) => {
    // Reconnect on connection reset or broken pipe
    return err.message.includes('ECONNRESET') || err.message.includes('EPIPE');
  },
});

redisClient.on('connect', () => logger.info('Connected to Redis'));
redisClient.on('ready', () => logger.info('Redis ready'));
redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));
redisClient.on('close', () => logger.warn('Redis connection closed'));

module.exports = redisClient;
