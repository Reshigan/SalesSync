import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';

// Initialize Prisma Client with real PostgreSQL database
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

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