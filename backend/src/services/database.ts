import { PrismaClient } from '@prisma/client';

// Singleton PrismaClient instance to prevent connection pool conflicts
class DatabaseService {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new PrismaClient({
        log: ['error', 'warn'],
        errorFormat: 'pretty',
      });
    }
    return DatabaseService.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseService.instance) {
      await DatabaseService.instance.$disconnect();
    }
  }
}

// Export the singleton instance
export const prisma = DatabaseService.getInstance();
export default DatabaseService;