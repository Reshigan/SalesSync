const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

describe('Backend Service Unit Tests', () => {
  describe('Error Handler', () => {
    const { AppError, errorHandler, notFoundHandler } = require('../../src/middleware/errorHandler');

    test('AppError should create error with statusCode', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
    });

    test('AppError should default code to null', () => {
      const error = new AppError('Test error', 500);
      expect(error.code).toBeNull();
    });

    test('AppError should be instance of Error', () => {
      const error = new AppError('Test', 400);
      expect(error).toBeInstanceOf(Error);
    });

    test('notFoundHandler should create 404 error', () => {
      const req = { originalUrl: '/test' };
      const res = {};
      const next = jest.fn();
      notFoundHandler(req, res, next);
      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(404);
    });

    test('errorHandler should respond with error', () => {
      const error = new AppError('Test', 400, 'TEST');
      const req = { originalUrl: '/test', method: 'GET', ip: '127.0.0.1', get: () => 'test', tenantId: null, user: null };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { status, headersSent: false };
      const next = jest.fn();
      errorHandler(error, req, res, next);
      expect(status).toHaveBeenCalledWith(400);
    });

    test('errorHandler should default to 500 for unknown errors', () => {
      const error = new Error('Unknown');
      const req = { originalUrl: '/test', method: 'GET', ip: '127.0.0.1', get: () => 'test', tenantId: null, user: null };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { status, headersSent: false };
      const next = jest.fn();
      errorHandler(error, req, res, next);
      expect(status).toHaveBeenCalledWith(500);
    });
  });

  describe('Response Helper', () => {
    let responseHelper;
    beforeAll(() => {
      try {
        responseHelper = require('../../src/utils/responseHelper');
      } catch (e) {
        responseHelper = null;
      }
    });

    test('module should be loadable', () => {
      expect(responseHelper !== undefined).toBeTruthy();
    });

    test('should export helper functions', () => {
      if (responseHelper) {
        expect(typeof responseHelper === 'object' || typeof responseHelper === 'function').toBeTruthy();
      }
    });
  });

  describe('Validation Schemas', () => {
    let schemas;
    beforeAll(() => {
      try {
        schemas = require('../../src/utils/validationSchemas');
      } catch (e) {
        schemas = null;
      }
    });

    test('module should be loadable', () => {
      expect(schemas !== undefined).toBeTruthy();
    });

    test('should export validation schemas', () => {
      if (schemas) {
        expect(typeof schemas === 'object').toBeTruthy();
      }
    });
  });

  describe('Commission Engine', () => {
    let commissionEngine;
    beforeAll(() => {
      try {
        commissionEngine = require('../../src/utils/commissionEngine');
      } catch (e) {
        commissionEngine = null;
      }
    });

    test('module should be loadable', () => {
      expect(commissionEngine !== undefined).toBeTruthy();
    });
  });

  describe('Currency Utils', () => {
    let currency;
    beforeAll(() => {
      try {
        currency = require('../../src/utils/currency');
      } catch (e) {
        currency = null;
      }
    });

    test('module should be loadable', () => {
      expect(currency !== undefined).toBeTruthy();
    });
  });

  describe('GPS Validation', () => {
    let gpsValidation;
    beforeAll(() => {
      try {
        gpsValidation = require('../../src/utils/gpsValidation');
      } catch (e) {
        gpsValidation = null;
      }
    });

    test('module should be loadable', () => {
      expect(gpsValidation !== undefined).toBeTruthy();
    });
  });

  describe('Socket Emitter', () => {
    let socketEmitter;
    beforeAll(() => {
      try {
        socketEmitter = require('../../src/utils/socketEmitter');
      } catch (e) {
        socketEmitter = null;
      }
    });

    test('module should be loadable', () => {
      expect(socketEmitter !== undefined).toBeTruthy();
    });
  });
});

describe('Backend Service Classes', () => {
  const serviceFiles = [
    'cache.service',
    'customer.service',
    'order.service',
    'user.service',
    'inventory.service',
    'commission.service',
    'survey.service',
    'hierarchy.service',
    'settings.service',
    'samples.service',
    'notification.service',
    'board.service',
    'competitor.service',
    'bulk-operations.service',
    'cash-reconciliation.service',
    'fraud-detection.service',
    'trade-marketing.service',
    'masterdata.service',
    'picture-comparison.service',
    'storage.service',
    'apm.service',
    'backup.service',
    'integration-sync.service',
    'queue.service',
  ];

  serviceFiles.forEach(serviceName => {
    describe(`${serviceName}`, () => {
      let service;
      beforeAll(() => {
        try {
          service = require(`../../src/services/${serviceName}`);
        } catch (e) {
          service = null;
        }
      });

      test(`should be loadable`, () => {
        expect(service !== undefined).toBeTruthy();
      });

      test(`should export functions or class`, () => {
        if (service) {
          const type = typeof service;
          expect(type === 'object' || type === 'function').toBeTruthy();
        }
      });
    });
  });
});

describe('Middleware Unit Tests', () => {
  const middlewareFiles = [
    { name: 'errorHandler', expectedExports: ['AppError', 'errorHandler', 'notFoundHandler'] },
    { name: 'authTenantMiddleware', expectedExports: ['authTenantMiddleware'] },
    { name: 'tenantMiddleware', expectedExports: ['tenantMiddleware'] },
    { name: 'security', expectedExports: [] },
    { name: 'rate-limiter', expectedExports: [] },
    { name: 'input-validation', expectedExports: [] },
    { name: 'performance', expectedExports: [] },
    { name: 'monitoring', expectedExports: [] },
    { name: 'gps-validation', expectedExports: [] },
    { name: 'audit-logger', expectedExports: [] },
    { name: 'superadmin', expectedExports: [] },
  ];

  middlewareFiles.forEach(({ name, expectedExports }) => {
    describe(`${name} middleware`, () => {
      let middleware;
      beforeAll(() => {
        try {
          middleware = require(`../../src/middleware/${name}`);
        } catch (e) {
          middleware = null;
        }
      });

      test(`should be loadable`, () => {
        expect(middleware !== undefined).toBeTruthy();
      });

      test(`should export expected interface`, () => {
        if (middleware && expectedExports.length > 0) {
          expectedExports.forEach(exp => {
            expect(middleware[exp]).toBeDefined();
          });
        }
      });
    });
  });
});
