const {
  sanitizeInput,
  validateEmail,
  validatePhone,
  validatePassword,
  validateSAIdNumber,
  validateCurrency,
  validateDate,
  validateCoordinates,
  validateInput,
  schemas
} = require('../../src/middleware/input-validation');

describe('Input Validation Middleware', () => {
  describe('sanitizeInput', () => {
    it('should trim and sanitize strings', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should strip XSS from strings', () => {
      const result = sanitizeInput('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
    });

    it('should recursively sanitize objects', () => {
      const input = { name: '  <script>alert(1)</script>  ', nested: { val: ' <img onerror=alert(1)> ' } };
      const result = sanitizeInput(input);
      expect(result.name).not.toContain('<script>');
      expect(result.nested.val).not.toContain('onerror');
    });

    it('should return non-string non-object values as-is', () => {
      expect(sanitizeInput(42)).toBe(42);
      expect(sanitizeInput(null)).toBeNull();
      expect(sanitizeInput(true)).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('admin@demo.co.za')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should accept valid SA phone numbers', () => {
      expect(validatePhone('0821234567')).toBe(true);
      expect(validatePhone('+27821234567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abcdefghij')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const result = validatePassword('StrongPass1');
      expect(result.isValid).toBe(true);
      expect(result.requirements.minLength).toBe(true);
      expect(result.requirements.hasUpperCase).toBe(true);
      expect(result.requirements.hasLowerCase).toBe(true);
      expect(result.requirements.hasNumbers).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('short').isValid).toBe(false);
      expect(validatePassword('nouppercase1').isValid).toBe(false);
      expect(validatePassword('NOLOWERCASE1').isValid).toBe(false);
      expect(validatePassword('NoNumbers').isValid).toBe(false);
    });

    it('should detect special characters', () => {
      const result = validatePassword('Pass1!@#');
      expect(result.requirements.hasSpecialChar).toBe(true);
    });
  });

  describe('validateSAIdNumber', () => {
    it('should reject non-13-digit strings', () => {
      expect(validateSAIdNumber('123')).toBe(false);
      expect(validateSAIdNumber('12345678901234')).toBe(false);
      expect(validateSAIdNumber('abcdefghijklm')).toBe(false);
    });

    it('should validate Luhn checksum', () => {
      expect(validateSAIdNumber('1234567890123')).toBe(false);
    });
  });

  describe('validateCurrency', () => {
    it('should accept valid amounts', () => {
      expect(validateCurrency(0)).toBe(true);
      expect(validateCurrency(100.50)).toBe(true);
      expect(validateCurrency('999999999.99')).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validateCurrency(-1)).toBe(false);
      expect(validateCurrency('abc')).toBe(false);
      expect(validateCurrency(1000000000)).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should accept ISO 8601 dates', () => {
      expect(validateDate('2024-01-15')).toBe(true);
      expect(validateDate('2024-01-15T10:30:00Z')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate('not-a-date')).toBe(false);
      expect(validateDate('15/01/2024')).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    it('should accept valid coordinates', () => {
      expect(validateCoordinates(-33.9249, 18.4241)).toBe(true);
      expect(validateCoordinates(0, 0)).toBe(true);
      expect(validateCoordinates(-90, -180)).toBe(true);
      expect(validateCoordinates(90, 180)).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(validateCoordinates(91, 0)).toBe(false);
      expect(validateCoordinates(0, 181)).toBe(false);
      expect(validateCoordinates('abc', 'def')).toBe(false);
    });
  });

  describe('validateInput middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = { body: {}, query: {}, params: {} };
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      next = jest.fn();
    });

    it('should pass validation with valid data', () => {
      req.body = { email: 'user@test.com', password: 'test123' };
      const middleware = validateInput(schemas.login);
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail on missing required fields', () => {
      req.body = {};
      const middleware = validateInput(schemas.login);
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Validation failed' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail on invalid email format', () => {
      req.body = { email: 'not-an-email', password: 'test123' };
      const middleware = validateInput(schemas.login);
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should sanitize input data', () => {
      req.body = { email: ' user@test.com ', password: 'test123' };
      const middleware = validateInput(schemas.login);
      middleware(req, res, next);
      expect(req.body.email).toBe('user@test.com');
    });

    it('should validate enum values', () => {
      req.body = {
        name: 'Customer',
        email: 'c@test.com',
        business_type: 'invalid_type'
      };
      const middleware = validateInput(schemas.customer);
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should skip non-required empty fields', () => {
      req.body = { name: 'Customer' };
      const middleware = validateInput(schemas.customer);
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should validate minLength', () => {
      req.body = { name: 'A', email: 'a@b.com', password: 'P' };
      const middleware = validateInput(schemas.register);
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('schemas', () => {
    it('should have login schema', () => {
      expect(schemas.login).toBeDefined();
      expect(schemas.login.email.required).toBe(true);
      expect(schemas.login.password.required).toBe(true);
    });

    it('should have register schema', () => {
      expect(schemas.register).toBeDefined();
      expect(schemas.register.email.type).toBe('email');
      expect(schemas.register.password.type).toBe('password');
    });

    it('should have customer schema', () => {
      expect(schemas.customer).toBeDefined();
      expect(schemas.customer.name.required).toBe(true);
    });

    it('should have product schema', () => {
      expect(schemas.product).toBeDefined();
      expect(schemas.product.name.required).toBe(true);
      expect(schemas.product.sku.required).toBe(true);
    });

    it('should have visit schema', () => {
      expect(schemas.visit).toBeDefined();
      expect(schemas.visit.customer_id.required).toBe(true);
    });
  });
});
