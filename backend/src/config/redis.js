const { Redis } = require('ioredis');
const config = require('./env');
const logger = require('./logger');

const redisClient = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

module.exports = redisClient;
