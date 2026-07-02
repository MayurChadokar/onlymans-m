const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const config = require('../config/env');
const redisClient = require('../config/redis');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window`
  skipSuccessfulRequests: true,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
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
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

module.exports = {
  authLimiter,
  apiLimiter,
  adminLimiter,
};
