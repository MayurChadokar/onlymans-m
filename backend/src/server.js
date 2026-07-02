const app = require('./app');
const config = require('./config/env');
const logger = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/database');
const { firebaseService } = require('./modules/notifications');

let server;

const startServer = async () => {
  await connectDB();
  firebaseService.initializeFirebase();
  
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
};

startServer();

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = async (error) => {
  logger.error(error);
  await disconnectDB();
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
  await disconnectDB();
});

// trigger restart
