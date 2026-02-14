const { AppError, errorHandler, notFoundHandler, asyncHandler } = require('../../src/middleware/errorHandler');

describe('ErrorHandler Middleware', () => {
  describe('AppError', () => {
    it('should create error with message, statusCode, and code', () => {
      const error = new AppError('Not found', 404, 'NOT_FOUND');
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });

    it('should default code to null when not provided', () => {
      const error = new AppError('Server error', 500);
      expect(error.code).toBeNull();
    });

    it('should capture stack trace', () => {
      const error = new AppError('test', 400);
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('errorHandler.test.js');
    });
  });

  describe('notFoundHandler', () => {
    it('should create 404 AppError with route info', () => {
      const req = { originalUrl: '/api/nonexistent' };
      const res = {};
      const next = jest.fn();

      notFoundHandler(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('ROUTE_NOT_FOUND');
      expect(error.message).toContain('/api/nonexistent');
    });
  });

  describe('errorHandler', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        originalUrl: '/api/test',
        method: 'GET',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent'),
        tenantId: 'tenant-1',
        user: { id: 'user-1' }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should handle AppError with correct status', () => {
      const error = new AppError('Bad request', 400, 'BAD_REQUEST');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Bad request',
            code: 'BAD_REQUEST'
          })
        })
      );
    });

    it('should default to 500 status for unknown errors', () => {
      const error = new Error('Something broke');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle ValidationError as 400', () => {
      const error = new Error('Invalid input');
      error.name = 'ValidationError';
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'VALIDATION_ERROR' })
        })
      );
    });

    it('should handle JsonWebTokenError as 401', () => {
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'INVALID_TOKEN' })
        })
      );
    });

    it('should handle TokenExpiredError as 401', () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'TOKEN_EXPIRED' })
        })
      );
    });

    it('should handle SQLITE_CONSTRAINT_UNIQUE as 409', () => {
      const error = new Error('UNIQUE constraint failed');
      error.code = 'SQLITE_CONSTRAINT_UNIQUE';
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'DUPLICATE_RESOURCE' })
        })
      );
    });

    it('should handle SQLITE_CONSTRAINT_FOREIGNKEY as 400', () => {
      const error = new Error('FOREIGN KEY constraint failed');
      error.code = 'SQLITE_CONSTRAINT_FOREIGNKEY';
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'INVALID_REFERENCE' })
        })
      );
    });

    it('should hide error details in production for 500 errors', () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Database connection lost');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Internal server error'
          })
        })
      );

      process.env.NODE_ENV = origEnv;
    });

    it('should include stack trace in non-production', () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const error = new AppError('test error', 400);
      errorHandler(error, req, res, next);

      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.error.stack).toBeDefined();

      process.env.NODE_ENV = origEnv;
    });
  });

  describe('asyncHandler', () => {
    it('should call the wrapped function and pass through on success', async () => {
      const handler = jest.fn().mockResolvedValue('ok');
      const wrapped = asyncHandler(handler);
      const req = {}, res = {}, next = jest.fn();

      await wrapped(req, res, next);
      expect(handler).toHaveBeenCalledWith(req, res, next);
    });

    it('should call next with error on rejection', async () => {
      const error = new Error('async failure');
      const handler = jest.fn().mockRejectedValue(error);
      const wrapped = asyncHandler(handler);
      const req = {}, res = {}, next = jest.fn();

      await wrapped(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle async functions that return values', async () => {
      const handler = jest.fn().mockResolvedValue({ data: 'test' });
      const wrapped = asyncHandler(handler);
      const req = {}, res = {}, next = jest.fn();

      await wrapped(req, res, next);
      expect(handler).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
