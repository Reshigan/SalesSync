import { logger } from './utils/logger';
import { prisma } from './services/database';

// Connect to database on startup
prisma.$connect()
  .then(() => {
    logger.info('Successfully connected to PostgreSQL database');
  })
  .catch((error) => {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Disconnected from database');
});

// Export the shared prisma instance for backward compatibility
export { prisma };