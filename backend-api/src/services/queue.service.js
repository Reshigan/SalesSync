const Queue = require('bull');
const redis = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create queues for different job types
const queues = {
  media: new Queue('media-processing', REDIS_URL, {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 100,
      removeOnFail: 500
    }
  }),
  
  sync: new Queue('data-sync', REDIS_URL, {
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    }
  }),
  
  commission: new Queue('commission-calculation', REDIS_URL, {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 10000
      }
    }
  }),
  
  notification: new Queue('notifications', REDIS_URL, {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    }
  }),
  
  etl: new Queue('etl-jobs', REDIS_URL, {
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 60000
      }
    }
  })
};

class QueueService {
  /**
   * Add job to queue
   */
  async addJob(queueName, jobName, data, options = {}) {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.add(jobName, data, options);
  }

  /**
   * Process jobs in queue
   */
  processJobs(queueName, jobName, processor, concurrency = 1) {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    queue.process(jobName, concurrency, processor);
  }

  /**
   * Get queue stats
   */
  async getQueueStats(queueName) {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Clean old jobs
   */
  async cleanQueue(queueName, grace = 24 * 3600 * 1000) {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.clean(grace, 'completed');
    await queue.clean(grace, 'failed');
  }

  /**
   * Get all queues
   */
  getQueues() {
    return Object.keys(queues);
  }
}

module.exports = new QueueService();
