const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const config = require('../config/env');
const redisClient = require('../config/redis');

// Helper to send command to Redis only if it's connected/ready
// This avoids waiting for a 3-second commandTimeout when Redis is down/unreachable
const sendRedisCommand = async (...args) => {
  if (redisClient.status !== 'ready') {
    throw new Error('Redis connection is not ready');
  }
  return redisClient.call(...args);
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window`
  skipSuccessfulRequests: true,
  passOnStoreError: true, // Allow requests through if Redis fails
  validate: { doubleCount: false },
  store: new RedisStore({
    sendCommand: sendRedisCommand,
  }),
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  passOnStoreError: true, // Allow requests through if Redis fails
  validate: { doubleCount: false },
  store: new RedisStore({
    sendCommand: sendRedisCommand,
  }),
});

const adminLimiter = rateLimit({
  windowMs: config.admin.rateLimitWindowMs, // default: 15 minutes
  max: config.admin.rateLimitMax,           // default: 200 requests per window
  message: {
    code: 429,
    message: 'Too many admin requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true, // Allow requests through if Redis fails
  validate: { doubleCount: false },
  store: new RedisStore({
    sendCommand: sendRedisCommand,
  }),
});

module.exports = {
  authLimiter,
  apiLimiter,
  adminLimiter,
};

