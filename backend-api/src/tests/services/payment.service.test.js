/**
 * Payment Service Tests
 */

const paymentService = require('../../services/paymentService');

// Mock stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn()
    },
    refunds: {
      create: jest.fn()
    }
  }));
});

// Mock PayPal
jest.mock('@paypal/checkout-server-sdk', () => ({
  core: {
    SandboxEnvironment: jest.fn(),
    LiveEnvironment: jest.fn(),
    PayPalHttpClient: jest.fn()
  },
  orders: {
    OrdersCreateRequest: jest.fn().mockImplementation(() => ({
      prefer: jest.fn(),
      requestBody: jest.fn()
    })),
    OrdersCaptureRequest: jest.fn().mockImplementation(() => ({
      requestBody: jest.fn()
    }))
  },
  payments: {
    CapturesRefundRequest: jest.fn().mockImplementation(() => ({
      requestBody: jest.fn()
    }))
  }
}));

// Mock database
jest.mock('../../database/database', () => ({
  getDatabase: jest.fn().mockReturnValue({
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn()
  })
}));

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePaymentData', () => {
    it('should throw error for invalid amount', () => {
      expect(() => {
        paymentService.validatePaymentData({
          amount: 0,
          customerId: 'cust-123',
          tenantId: 'tenant-123',
          currency: 'USD'
        });
      }).toThrow('Invalid payment amount');
    });

    it('should throw error for missing customerId', () => {
      expect(() => {
        paymentService.validatePaymentData({
          amount: 100,
          tenantId: 'tenant-123',
          currency: 'USD'
        });
      }).toThrow('Customer ID is required');
    });

    it('should throw error for missing tenantId', () => {
      expect(() => {
        paymentService.validatePaymentData({
          amount: 100,
          customerId: 'cust-123',
          currency: 'USD'
        });
      }).toThrow('Tenant ID is required');
    });

    it('should throw error for missing currency', () => {
      expect(() => {
        paymentService.validatePaymentData({
          amount: 100,
          customerId: 'cust-123',
          tenantId: 'tenant-123'
        });
      }).toThrow('Currency is required');
    });

    it('should not throw for valid data', () => {
      expect(() => {
        paymentService.validatePaymentData({
          amount: 100,
          customerId: 'cust-123',
          tenantId: 'tenant-123',
          currency: 'USD'
        });
      }).not.toThrow();
    });
  });

  describe('mapStripeStatus', () => {
    it('should map succeeded to completed', () => {
      expect(paymentService.mapStripeStatus('succeeded')).toBe('completed');
    });

    it('should map pending to pending', () => {
      expect(paymentService.mapStripeStatus('pending')).toBe('pending');
    });

    it('should map requires_payment_method to failed', () => {
      expect(paymentService.mapStripeStatus('requires_payment_method')).toBe('failed');
    });

    it('should map canceled to failed', () => {
      expect(paymentService.mapStripeStatus('canceled')).toBe('failed');
    });

    it('should return pending for unknown status', () => {
      expect(paymentService.mapStripeStatus('unknown_status')).toBe('pending');
    });
  });

  describe('mapPayPalStatus', () => {
    it('should map COMPLETED to completed', () => {
      expect(paymentService.mapPayPalStatus('COMPLETED')).toBe('completed');
    });

    it('should map APPROVED to pending', () => {
      expect(paymentService.mapPayPalStatus('APPROVED')).toBe('pending');
    });

    it('should map VOIDED to failed', () => {
      expect(paymentService.mapPayPalStatus('VOIDED')).toBe('failed');
    });

    it('should return pending for unknown status', () => {
      expect(paymentService.mapPayPalStatus('UNKNOWN')).toBe('pending');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = paymentService.generateId();
      const id2 = paymentService.generateId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^pay_\d+_[a-z0-9]+$/);
    });
  });

  describe('processCashPayment', () => {
    it('should return completed status for cash payments', async () => {
      const result = await paymentService.processCashPayment({
        amount: 100,
        metadata: { receivedBy: 'John Doe' }
      });
      
      expect(result.status).toBe('completed');
      expect(result.transactionId).toMatch(/^CASH-/);
      expect(result.raw.type).toBe('cash');
      expect(result.raw.receivedBy).toBe('John Doe');
    });
  });

  describe('processCheckPayment', () => {
    it('should return pending status for check payments', async () => {
      const result = await paymentService.processCheckPayment({
        amount: 500,
        metadata: { 
          checkNumber: '12345',
          bankName: 'Test Bank'
        }
      });
      
      expect(result.status).toBe('pending');
      expect(result.transactionId).toMatch(/^CHECK-/);
      expect(result.raw.type).toBe('check');
      expect(result.raw.checkNumber).toBe('12345');
    });
  });

  describe('processBankTransferPayment', () => {
    it('should return pending status for bank transfers', async () => {
      const result = await paymentService.processBankTransferPayment({
        amount: 1000,
        metadata: {
          referenceNumber: 'REF123',
          bankName: 'Test Bank',
          accountNumber: '1234567890'
        }
      });
      
      expect(result.status).toBe('pending');
      expect(result.transactionId).toMatch(/^BANK-/);
      expect(result.raw.type).toBe('bank_transfer');
      expect(result.raw.accountNumber).toBe('7890'); // Only last 4 digits
    });
  });

  describe('processPayPalPayment', () => {
    it('should throw error when PayPal not configured', async () => {
      // Clear environment variables
      const originalClientId = process.env.PAYPAL_CLIENT_ID;
      const originalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
      delete process.env.PAYPAL_CLIENT_ID;
      delete process.env.PAYPAL_CLIENT_SECRET;
      
      await expect(paymentService.processPayPalPayment({
        amount: 100,
        currency: 'USD',
        customerId: 'cust-123',
        metadata: {}
      })).rejects.toThrow('PayPal integration not configured');
      
      // Restore environment variables
      if (originalClientId) process.env.PAYPAL_CLIENT_ID = originalClientId;
      if (originalClientSecret) process.env.PAYPAL_CLIENT_SECRET = originalClientSecret;
    });
  });
});
