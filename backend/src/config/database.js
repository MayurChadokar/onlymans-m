require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const logger = require('./logger');

const connectionString = process.env.DATABASE_URL;
const isDev = process.env.NODE_ENV !== 'production';

const pool = new Pool({
  connectionString,
  max: 10,                    // max concurrent connections
  idleTimeoutMillis: 30000,   // close idle connections after 30s
  connectionTimeoutMillis: 3000, // fail fast if no connection in 3s
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: isDev
    ? [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ]
    : [
        { emit: 'event', level: 'error' },
      ],
});

if (isDev) {
  prisma.$on('query', (e) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

prisma.$on('error', (e) => {
  logger.error(e.message);
});

if (isDev) {
  prisma.$on('warn', (e) => {
    logger.warn(e.message);
  });
}

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
