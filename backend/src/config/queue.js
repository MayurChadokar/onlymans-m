const { Queue, Worker, QueueEvents } = require('bullmq');
const redisClient = require('./redis');
const logger = require('./logger');

const createQueue = (queueName) => {
  return new Queue(queueName, { connection: redisClient });
};

const createWorker = (queueName, processor, options = {}) => {
  const worker = new Worker(queueName, processor, {
    connection: redisClient,
    ...options
  });

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} has failed with ${err.message}`);
  });

  return worker;
};

module.exports = {
  createQueue,
  createWorker
};
