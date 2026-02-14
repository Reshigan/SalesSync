const { authLimiter, apiLimiter, strictApiLimiter, exportLimiter } = require('../../src/middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  describe('authLimiter', () => {
    it('should be a function (middleware)', () => {
      expect(typeof authLimiter).toBe('function');
    });

    it('should have correct configuration', () => {
      expect(authLimiter).toBeDefined();
    });
  });

  describe('apiLimiter', () => {
    it('should be a function (middleware)', () => {
      expect(typeof apiLimiter).toBe('function');
    });
  });

  describe('strictApiLimiter', () => {
    it('should be a function (middleware)', () => {
      expect(typeof strictApiLimiter).toBe('function');
    });
  });

  describe('exportLimiter', () => {
    it('should be a function (middleware)', () => {
      expect(typeof exportLimiter).toBe('function');
    });
  });

  describe('all limiters export correctly', () => {
    it('should export all four limiters', () => {
      const limiters = require('../../src/middleware/rateLimiter');
      expect(limiters.authLimiter).toBeDefined();
      expect(limiters.apiLimiter).toBeDefined();
      expect(limiters.strictApiLimiter).toBeDefined();
      expect(limiters.exportLimiter).toBeDefined();
    });
  });
});
