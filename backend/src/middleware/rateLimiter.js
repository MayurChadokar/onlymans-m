const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
  skipSuccessfulRequests: true,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
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
});

module.exports = {
  authLimiter,
  apiLimiter,
  adminLimiter,
};
