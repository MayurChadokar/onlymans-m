const { version } = require('../../package.json');
const config = require('../config/env');

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'OnlyMans API documentation',
    version,
    description: 'API Documentation for the Creator Subscription Platform.',
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api/v1`,
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

module.exports = swaggerDef;
