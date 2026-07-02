const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const config = require('./config/env');
const { errorConverter, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes/v1');

const app = express();

// response time header — must set before headers are sent, so intercept res.end
app.use((req, res, next) => {
  const logger = require('./config/logger');
  const start = process.hrtime.bigint();
  const originalEnd = res.end.bind(res);
  res.end = function (...args) {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${ms.toFixed(2)}ms`);
    }
    if (ms > 1000) {
      logger.warn(`Slow: ${req.method} ${req.originalUrl} ${ms.toFixed(0)}ms`);
    }
    return originalEnd(...args);
  };
  next();
});

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// gzip compression
app.use(compression());

// enable cors
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

// limit repeated failed requests to endpoints
if (config.env === 'production') {
  app.use('/api', apiLimiter);
}

// v1 api routes
app.use('/api/v1', routes);

// Silence browser-generated requests that aren't part of the API
app.get('/firebase-messaging-sw.js', (_req, res) => res.status(404).end());

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  const error = new Error(`Not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
