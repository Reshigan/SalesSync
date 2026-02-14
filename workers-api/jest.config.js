export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  transform: {},
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js'],
  verbose: true,
  forceExit: true,
  testTimeout: 15000,
};
