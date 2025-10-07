const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { cleanupTestApp } = require('./helpers/app');

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = path.join(__dirname, '../database/salessync_test.db');

// Global test setup
beforeAll(() => {
  console.log('Setting up test environment...');
  
  // Ensure directories exist
  const dirs = [
    path.join(__dirname, '../database'),
    path.join(__dirname, '../logs'),
    path.join(__dirname, '../test-uploads')
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
});

// Global test teardown
afterAll(async () => {
  console.log('Cleaning up test environment...');
  
  // Close database connections
  await cleanupTestApp();
  
  // Wait a bit for connections to close
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Clean up test database after all tests
  const testDbPath = path.join(__dirname, '../database/salessync_test.db');
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
      console.log('Test database cleaned up');
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    }
  }
  
  // Clean up test uploads
  const testUploadsPath = path.join(__dirname, '../test-uploads');
  if (fs.existsSync(testUploadsPath)) {
    try {
      fs.rmSync(testUploadsPath, { recursive: true, force: true });
      console.log('Test uploads cleaned up');
    } catch (error) {
      console.error('Error cleaning up test uploads:', error);
    }
  }
});

// Set longer timeout for all tests
jest.setTimeout(30000);
