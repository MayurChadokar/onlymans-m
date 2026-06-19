const fs = require('fs');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerDefinition = require('./src/docs/swaggerDef');

const specs = swaggerJsdoc({
  swaggerDefinition,
  apis: ['src/docs/*.yml', 'src/modules/*/routes/*.js'],
});

fs.writeFileSync('openapi.json', JSON.stringify(specs, null, 2));
console.log('Successfully generated openapi.json');
