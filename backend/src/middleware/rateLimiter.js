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

// Key = userId (if logged in) + IP — prevents bypass via VPN or IP spoofing
const makeKeyGenerator = (label) => (req) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userId = req.user?.id || 'anon';
  const key = `${userId}:${ip}`;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[RateLimit:${label}] key=${key} | ${req.method} ${req.originalUrl}`);
  }
  return key;
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 20,                      // 20 login/register attempts per window
  skipSuccessfulRequests: true, // only failed attempts count
  passOnStoreError: true,
  validate: { doubleCount: false },
  keyGenerator: makeKeyGenerator('AUTH'),
  message: { code: 429, message: 'Too many attempts. Please try again after 15 minutes.' },
  store: new RedisStore({ sendCommand: sendRedisCommand }),
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,                    // 500 requests per 15 min per user+IP
  passOnStoreError: true,
  validate: { doubleCount: false },
  keyGenerator: makeKeyGenerator('API'),
  message: { code: 429, message: 'Too many requests. Please slow down.' },
  store: new RedisStore({ sendCommand: sendRedisCommand }),
});

const adminLimiter = rateLimit({
  windowMs: config.admin.rateLimitWindowMs,
  max: config.admin.rateLimitMax,
  message: { code: 429, message: 'Too many admin requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  validate: { doubleCount: false },
  keyGenerator: makeKeyGenerator('ADMIN'),
  store: new RedisStore({ sendCommand: sendRedisCommand }),
});

module.exports = {
  authLimiter,
  apiLimiter,
  adminLimiter,
};



