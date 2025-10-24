/**
 * E2E Tests for Transaction-Capable Features (Option D Sprint - Week 1-5)
 * Tests: Payments, Quotes, Approvals, Advanced UI Components
 */

import { test, expect } from '@playwright/test';

// Test Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:12000';
const API_URL = process.env.API_URL || 'http://localhost:12001';

let authToken: string;
let tenantId: string;
let customerId: string;
let quoteId: string;
let paymentId: string;
let approvalId: string;

test.describe('SalesSync Transaction Features E2E Tests', () => {
  
  test.beforeAll(async ({ request }) => {
    // Login and get auth token
    const response = await request.post(`${API_URL}/api/auth/login`, {
      headers: {
        'X-Tenant-Code': 'DEMO'
      },
      data: {
        email: 'admin@demo.com',
        password: 'admin123'
      }
    });

    if (!response.ok()) {
      const error = await response.text();
      console.error('Login failed:', error);
    }

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    authToken = data.data.token;
    tenantId = data.data.user.tenantId;

    console.log(`✓ Authenticated as admin@demo.com (Token: ${authToken.substring(0, 20)}...)`);
  });

  test.describe('1. Payment Processing (Stripe Integration)', () => {
    
    test('1.1 Create Payment Intent', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/payments/create-payment-intent`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          amount: 150.00,
          currency: 'usd',
          customerId: 'test-customer-001',
          metadata: {
            description: 'Test payment intent'
          }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.clientSecret).toBeTruthy();
      expect(data.paymentIntentId).toBeTruthy();

      console.log(`✓ Payment Intent created: ${data.paymentIntentId}`);
    });

    test('1.2 Process Payment and Record in Database', async ({ request }) => {
      // First get a customer ID
      const customersRes = await request.get(`${API_URL}/api/customers?limit=1`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });

      const customers = await customersRes.json();
      customerId = customers.customers[0]?.id || '1';

      // Process payment
      const response = await request.post(`${API_URL}/api/payments/process`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          customerId,
          amount: 250.00,
          currency: 'USD',
          paymentMethod: 'credit_card',
          paymentIntentId: 'pi_test_' + Date.now(),
          status: 'completed',
          notes: 'E2E test payment'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.payment).toBeTruthy();
      expect(data.payment.amount).toBe(250.00);
      paymentId = data.payment.id;

      console.log(`✓ Payment processed and recorded: ID ${paymentId}`);
    });

    test('1.3 Get Payment Details', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });

      expect(response.ok()).toBeTruthy();
      const payment = await response.json();
      expect(payment.id).toBe(paymentId);
      expect(payment.amount).toBe(250.00);
      expect(payment.status).toBe('completed');

      console.log(`✓ Payment details retrieved: $${payment.amount}`);
    });

    test('1.4 List Payments with Filters', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/payments?status=completed&limit=10`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.payments).toBeTruthy();
      expect(Array.isArray(data.payments)).toBe(true);
      expect(data.pagination).toBeTruthy();

      console.log(`✓ Retrieved ${data.payments.length} payments`);
    });

    test('1.5 Get Payment Statistics', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/payments/tenant/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.stats).toBeTruthy();
      expect(data.stats.total_payments).toBeGreaterThan(0);
      expect(data.paymentsByMethod).toBeTruthy();

      console.log(`✓ Payment stats: ${data.stats.total_payments} payments, $${data.stats.total_amount}`);
    });
  });

  test.describe('2. Quote Management', () => {
    
    test('2.1 Create New Quote', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/quotes`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          customerId,
          quoteNumber: `Q-${Date.now()}`,
          title: 'E2E Test Quote',
          description: 'Comprehensive product bundle',
          subtotal: 1000.00,
          tax: 80.00,
          discount: 50.00,
          total: 1030.00,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          terms: 'Net 30',
          notes: 'Generated by E2E test',
          items: [
            {
              productName: 'Product A',
              description: 'High-quality product',
              quantity: 10,
              unitPrice: 50.00,
              tax: 40.00,
              discount: 25.00,
              total: 515.00
            },
            {
              productName: 'Product B',
              description: 'Premium service',
              quantity: 5,
              unitPrice: 100.00,
              tax: 40.00,
              discount: 25.00,
              total: 515.00
            }
          ]
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.quote).toBeTruthy();
      expect(data.quote.total).toBe(1030.00);
      quoteId = data.quote.id;

      console.log(`✓ Quote created: ${data.quote.quote_number} (ID: ${quoteId})`);
    });

    test('2.2 Get Quote with Items', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/quotes/${quoteId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });

      expect(response.ok()).toBeTruthy();
      const quote = await response.json();
      expect(quote.id).toBe(quoteId);
      expect(quote.items).toBeTruthy();
      expect(quote.items.length).toBe(2);
      expect(quote.total).toBe(1030.00);

      console.log(`✓ Quote retrieved with ${quote.items.length} line items`);
    });

    test('2.3 Update Quote', async ({ request }) => {
      const response = await request.put(`${API_URL}/api/quotes/${quoteId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          title: 'E2E Test Quote - Updated',
          notes: 'Updated via E2E test',
          total: 1100.00
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.quote.title).toBe('E2E Test Quote - Updated');
      expect(data.quote.total).toBe(1100.00);

      console.log(`✓ Quote updated: new total $${data.quote.total}`);
    });

    test('2.4 Send Quote to Customer', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/quotes/${quoteId}/send`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.quote.status).toBe('sent');

      console.log(`✓ Quote marked as sent`);
    });

    test('2.5 Accept Quote', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/quotes/${quoteId}/accept`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.quote.status).toBe('accepted');

      console.log(`✓ Quote accepted - ready for conversion to order`);
    });

    test('2.6 List All Quotes', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/quotes?limit=20`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.quotes).toBeTruthy();
      expect(Array.isArray(data.quotes)).toBe(true);
      expect(data.pagination).toBeTruthy();

      console.log(`✓ Retrieved ${data.quotes.length} quotes`);
    });
  });

  test.describe('3. Approval Workflow', () => {
    
    test('3.1 Create Approval Request', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/approvals`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          entityType: 'quote',
          entityId: quoteId,
          requestType: 'discount_approval',
          amount: 50.00,
          reason: 'Customer requested volume discount'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.approval).toBeTruthy();
      expect(data.approval.status).toBe('pending');
      approvalId = data.approval.id;

      console.log(`✓ Approval request created: ID ${approvalId}`);
    });

    test('3.2 Get Approval Details', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/approvals/${approvalId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });

      expect(response.ok()).toBeTruthy();
      const approval = await response.json();
      expect(approval.id).toBe(approvalId);
      expect(approval.status).toBe('pending');
      expect(approval.request_type).toBe('discount_approval');

      console.log(`✓ Approval details retrieved: ${approval.request_type}`);
    });

    test('3.3 List Pending Approvals', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/approvals/pending`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.approvals).toBeTruthy();
      expect(Array.isArray(data.approvals)).toBe(true);

      console.log(`✓ ${data.count} pending approvals found`);
    });

    test('3.4 Approve Request', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/approvals/${approvalId}/approve`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          comments: 'Approved - customer is high-value account'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.approval.status).toBe('approved');

      console.log(`✓ Approval request approved`);
    });

    test('3.5 Get Approval Statistics', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/approvals/tenant/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.stats).toBeTruthy();
      expect(data.byType).toBeTruthy();

      console.log(`✓ Approval stats: ${data.stats.total_requests} total, ${data.stats.approved} approved`);
    });

    test('3.6 Create and Reject Approval', async ({ request }) => {
      // Create new approval
      const createRes = await request.post(`${API_URL}/api/approvals`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          entityType: 'order',
          entityId: '999',
          requestType: 'price_override',
          amount: 100.00,
          reason: 'Special pricing request'
        }
      });

      const createData = await createRes.json();
      const newApprovalId = createData.approval.id;

      // Reject it
      const rejectRes = await request.post(`${API_URL}/api/approvals/${newApprovalId}/reject`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          comments: 'Price override not justified'
        }
      });

      expect(rejectRes.ok()).toBeTruthy();
      const rejectData = await rejectRes.json();
      expect(rejectData.success).toBe(true);
      expect(rejectData.approval.status).toBe('rejected');

      console.log(`✓ Approval request rejected successfully`);
    });
  });

  test.describe('4. Integration Tests - End-to-End Workflow', () => {
    
    test('4.1 Complete Sales Cycle: Quote → Approval → Payment', async ({ request }) => {
      // Step 1: Create Quote
      const quoteRes = await request.post(`${API_URL}/api/quotes`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          customerId,
          quoteNumber: `Q-CYCLE-${Date.now()}`,
          title: 'Full Sales Cycle Test',
          subtotal: 500.00,
          tax: 40.00,
          total: 540.00,
          items: [
            {
              productName: 'Test Product',
              quantity: 10,
              unitPrice: 50.00,
              total: 500.00
            }
          ]
        }
      });

      const quoteData = await quoteRes.json();
      const cycleQuoteId = quoteData.quote.id;
      console.log(`  1. Quote created: ${quoteData.quote.quote_number}`);

      // Step 2: Send Quote
      await request.post(`${API_URL}/api/quotes/${cycleQuoteId}/send`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      console.log(`  2. Quote sent to customer`);

      // Step 3: Request Discount Approval
      const approvalRes = await request.post(`${API_URL}/api/approvals`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          entityType: 'quote',
          entityId: cycleQuoteId,
          requestType: 'discount_approval',
          amount: 40.00,
          reason: 'Customer requested 10% discount'
        }
      });

      const approvalData = await approvalRes.json();
      const cycleApprovalId = approvalData.approval.id;
      console.log(`  3. Discount approval requested`);

      // Step 4: Approve Discount
      await request.post(`${API_URL}/api/approvals/${cycleApprovalId}/approve`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          comments: 'Discount approved'
        }
      });
      console.log(`  4. Discount approved`);

      // Step 5: Accept Quote
      await request.post(`${API_URL}/api/quotes/${cycleQuoteId}/accept`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      console.log(`  5. Quote accepted by customer`);

      // Step 6: Process Payment
      const paymentRes = await request.post(`${API_URL}/api/payments/process`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          customerId,
          amount: 500.00,
          paymentMethod: 'credit_card',
          paymentIntentId: 'pi_cycle_' + Date.now(),
          status: 'completed',
          notes: `Payment for quote ${quoteData.quote.quote_number}`
        }
      });

      const paymentData = await paymentRes.json();
      console.log(`  6. Payment processed: $${paymentData.payment.amount}`);

      // Verify complete workflow
      expect(quoteData.success).toBe(true);
      expect(approvalData.success).toBe(true);
      expect(paymentData.success).toBe(true);

      console.log(`✓ Complete sales cycle executed successfully!`);
    });
  });

  test.describe('5. Error Handling & Validation', () => {
    
    test('5.1 Payment - Invalid Amount', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/payments/process`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          customerId,
          amount: -100.00,  // Invalid negative amount
          paymentMethod: 'credit_card'
        }
      });

      // Should handle validation error gracefully
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('5.2 Quote - Missing Required Fields', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/quotes`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          // Missing customerId and title
          total: 100.00
        }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('5.3 Approval - Invalid Entity ID', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/approvals/99999999`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });

      expect(response.status()).toBe(404);
    });
  });

  test.describe('6. Performance & Load Tests', () => {
    
    test('6.1 Bulk Payment Processing', async ({ request }) => {
      const payments = [];
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        const response = await request.post(`${API_URL}/api/payments/process`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-Tenant-Code': 'DEMO'
          },
          data: {
            customerId,
            amount: 50.00 + i * 10,
            paymentMethod: 'credit_card',
            paymentIntentId: `pi_bulk_${Date.now()}_${i}`,
            status: 'completed',
            notes: `Bulk test payment ${i + 1}`
          }
        });

        if (response.ok()) {
          payments.push(await response.json());
        }
      }

      const duration = Date.now() - startTime;
      const avgTime = duration / payments.length;

      expect(payments.length).toBe(10);
      console.log(`✓ Processed 10 payments in ${duration}ms (avg: ${avgTime.toFixed(2)}ms per payment)`);
    });

    test('6.2 Concurrent API Calls', async ({ request }) => {
      const startTime = Date.now();

      const promises = [
        request.get(`${API_URL}/api/payments?limit=50`, {
          headers: { 'Authorization': `Bearer ${authToken}`, 'X-Tenant-Code': 'DEMO' }
        }),
        request.get(`${API_URL}/api/quotes?limit=50`, {
          headers: { 'Authorization': `Bearer ${authToken}`, 'X-Tenant-Code': 'DEMO' }
        }),
        request.get(`${API_URL}/api/approvals?limit=50`, {
          headers: { 'Authorization': `Bearer ${authToken}`, 'X-Tenant-Code': 'DEMO' }
        }),
        request.get(`${API_URL}/api/payments/tenant/stats`, {
          headers: { 'Authorization': `Bearer ${authToken}`, 'X-Tenant-Code': 'DEMO' }
        }),
        request.get(`${API_URL}/api/approvals/tenant/stats`, {
          headers: { 'Authorization': `Bearer ${authToken}`, 'X-Tenant-Code': 'DEMO' }
        })
      ];

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      const allSuccessful = results.every(r => r.ok());
      expect(allSuccessful).toBe(true);

      console.log(`✓ Executed 5 concurrent API calls in ${duration}ms`);
    });
  });
});
