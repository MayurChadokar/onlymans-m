const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('query', (e) => {
  logger.debug(`Query: ${e.query}`);
  logger.debug(`Duration: ${e.duration}ms`);
});

prisma.$on('error', (e) => {
  logger.error(e.message);
});

prisma.$on('info', (e) => {
  logger.info(e.message);
});

prisma.$on('warn', (e) => {
  logger.warn(e.message);
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL via Prisma successfully');
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
  logger.info('Disconnected from PostgreSQL');
};

module.exports = {
  prisma,
  connectDB,
  disconnectDB
};
