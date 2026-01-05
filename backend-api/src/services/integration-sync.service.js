/**
 * Integration Sync Service
 * Handles real data synchronization with external systems
 */

const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const settingsService = require('./settings.service');
const crypto = require('crypto');

// Active sync jobs tracking
const activeSyncJobs = new Map();

// ============================================
// SYNC JOB MANAGEMENT
// ============================================

/**
 * Start a sync job
 */
async function startSyncJob(tenantId, configId, syncType = 'full') {
  const config = await getOneQuery(`
    SELECT ic.*, ip.name as provider_name, ip.provider_type, ip.api_base_url
    FROM integration_configs ic
    JOIN integration_providers ip ON ic.provider_id = ip.id
    WHERE ic.id = ? AND ic.tenant_id = ? AND ic.is_active = 1
  `, [configId, tenantId]);
  
  if (!config) {
    throw new Error('Integration config not found or inactive');
  }
  
  // Check if sync is already running
  const existingJob = activeSyncJobs.get(`${tenantId}:${configId}`);
  if (existingJob && existingJob.status === 'running') {
    throw new Error('Sync job already running for this integration');
  }
  
  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();
  
  // Create sync job record
  await runQuery(`
    INSERT INTO sync_jobs (id, tenant_id, config_id, sync_type, status, started_at, created_at)
    VALUES (?, ?, ?, ?, 'running', ?, ?)
  `, [jobId, tenantId, configId, syncType, now, now]);
  
  // Track active job
  activeSyncJobs.set(`${tenantId}:${configId}`, {
    jobId,
    status: 'running',
    startedAt: now
  });
  
  // Execute sync based on provider type
  executeSyncJob(tenantId, jobId, config, syncType).catch(error => {
    console.error(`Sync job ${jobId} failed:`, error);
  });
  
  return { jobId, status: 'running', configId, syncType };
}

/**
 * Execute the actual sync job
 */
async function executeSyncJob(tenantId, jobId, config, syncType) {
  const stats = {
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsFailed: 0,
    errors: []
  };
  
  try {
    // Parse config credentials
    const credentials = config.credentials ? JSON.parse(config.credentials) : {};
    const settings = config.sync_settings ? JSON.parse(config.sync_settings) : {};
    
    // Route to appropriate sync handler based on provider type
    switch (config.provider_type) {
      case 'erp':
        await syncERP(tenantId, config, credentials, settings, stats);
        break;
      case 'accounting':
        await syncAccounting(tenantId, config, credentials, settings, stats);
        break;
      case 'ecommerce':
        await syncEcommerce(tenantId, config, credentials, settings, stats);
        break;
      case 'crm':
        await syncCRM(tenantId, config, credentials, settings, stats);
        break;
      case 'payment':
        await syncPayment(tenantId, config, credentials, settings, stats);
        break;
      default:
        await syncGeneric(tenantId, config, credentials, settings, stats);
    }
    
    // Update job as completed
    await runQuery(`
      UPDATE sync_jobs 
      SET status = 'completed', completed_at = ?, 
          records_processed = ?, records_created = ?, records_updated = ?, records_failed = ?,
          error_log = ?
      WHERE id = ?
    `, [
      new Date().toISOString(),
      stats.recordsProcessed,
      stats.recordsCreated,
      stats.recordsUpdated,
      stats.recordsFailed,
      stats.errors.length > 0 ? JSON.stringify(stats.errors) : null,
      jobId
    ]);
    
    // Update last sync time on config
    await runQuery(`
      UPDATE integration_configs SET last_sync_at = ? WHERE id = ?
    `, [new Date().toISOString(), config.id]);
    
  } catch (error) {
    // Update job as failed
    await runQuery(`
      UPDATE sync_jobs 
      SET status = 'failed', completed_at = ?, error_log = ?
      WHERE id = ?
    `, [new Date().toISOString(), JSON.stringify({ error: error.message }), jobId]);
    
    throw error;
  } finally {
    // Remove from active jobs
    activeSyncJobs.delete(`${tenantId}:${config.id}`);
  }
}

// ============================================
// PROVIDER-SPECIFIC SYNC HANDLERS
// ============================================

/**
 * Sync with ERP system (SAP, Oracle, etc.)
 */
async function syncERP(tenantId, config, credentials, settings, stats) {
  const apiUrl = config.api_base_url;
  const apiKey = credentials.api_key;
  
  if (!apiUrl || !apiKey) {
    throw new Error('ERP API URL and API key are required');
  }
  
  // Sync products from ERP
  if (settings.sync_products !== false) {
    try {
      const response = await fetchWithRetry(`${apiUrl}/products`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (response.ok) {
        const products = await response.json();
        for (const product of products.data || products) {
          stats.recordsProcessed++;
          try {
            await upsertProduct(tenantId, product, config.id);
            stats.recordsCreated++;
          } catch (error) {
            stats.recordsFailed++;
            stats.errors.push({ type: 'product', id: product.id, error: error.message });
          }
        }
      }
    } catch (error) {
      stats.errors.push({ type: 'products_sync', error: error.message });
    }
  }
  
  // Sync inventory levels
  if (settings.sync_inventory !== false) {
    try {
      const response = await fetchWithRetry(`${apiUrl}/inventory`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (response.ok) {
        const inventory = await response.json();
        for (const item of inventory.data || inventory) {
          stats.recordsProcessed++;
          try {
            await updateInventoryFromERP(tenantId, item);
            stats.recordsUpdated++;
          } catch (error) {
            stats.recordsFailed++;
            stats.errors.push({ type: 'inventory', id: item.product_id, error: error.message });
          }
        }
      }
    } catch (error) {
      stats.errors.push({ type: 'inventory_sync', error: error.message });
    }
  }
  
  // Push orders to ERP
  if (settings.push_orders !== false) {
    const pendingOrders = await getQuery(`
      SELECT o.* FROM orders o
      LEFT JOIN integration_sync_log isl ON o.id = isl.entity_id AND isl.entity_type = 'order' AND isl.config_id = ?
      WHERE o.tenant_id = ? AND o.status = 'confirmed' AND isl.id IS NULL
      LIMIT 100
    `, [config.id, tenantId]);
    
    for (const order of pendingOrders || []) {
      stats.recordsProcessed++;
      try {
        const response = await fetchWithRetry(`${apiUrl}/orders`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transformOrderForERP(order))
        });
        
        if (response.ok) {
          const result = await response.json();
          await logSyncRecord(tenantId, config.id, 'order', order.id, 'pushed', result.external_id);
          stats.recordsCreated++;
        } else {
          throw new Error(`ERP returned ${response.status}`);
        }
      } catch (error) {
        stats.recordsFailed++;
        stats.errors.push({ type: 'order_push', id: order.id, error: error.message });
      }
    }
  }
}

/**
 * Sync with accounting system (QuickBooks, Xero, etc.)
 */
async function syncAccounting(tenantId, config, credentials, settings, stats) {
  const apiUrl = config.api_base_url;
  const accessToken = credentials.access_token;
  
  if (!apiUrl || !accessToken) {
    throw new Error('Accounting API URL and access token are required');
  }
  
  // Push invoices to accounting system
  if (settings.push_invoices !== false) {
    const pendingInvoices = await getQuery(`
      SELECT o.*, c.name as customer_name, c.email as customer_email
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN integration_sync_log isl ON o.id = isl.entity_id AND isl.entity_type = 'invoice' AND isl.config_id = ?
      WHERE o.tenant_id = ? AND o.status = 'completed' AND isl.id IS NULL
      LIMIT 50
    `, [config.id, tenantId]);
    
    for (const invoice of pendingInvoices || []) {
      stats.recordsProcessed++;
      try {
        const response = await fetchWithRetry(`${apiUrl}/invoices`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transformOrderToInvoice(invoice))
        });
        
        if (response.ok) {
          const result = await response.json();
          await logSyncRecord(tenantId, config.id, 'invoice', invoice.id, 'pushed', result.id);
          stats.recordsCreated++;
        } else {
          throw new Error(`Accounting API returned ${response.status}`);
        }
      } catch (error) {
        stats.recordsFailed++;
        stats.errors.push({ type: 'invoice_push', id: invoice.id, error: error.message });
      }
    }
  }
  
  // Sync payments from accounting
  if (settings.sync_payments !== false) {
    try {
      const lastSync = await getOneQuery(`
        SELECT MAX(synced_at) as last_sync FROM integration_sync_log
        WHERE config_id = ? AND entity_type = 'payment'
      `, [config.id]);
      
      const since = lastSync?.last_sync || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await fetchWithRetry(`${apiUrl}/payments?since=${since}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        const payments = await response.json();
        for (const payment of payments.data || payments) {
          stats.recordsProcessed++;
          try {
            await recordPaymentFromAccounting(tenantId, payment);
            await logSyncRecord(tenantId, config.id, 'payment', payment.id, 'pulled', payment.id);
            stats.recordsCreated++;
          } catch (error) {
            stats.recordsFailed++;
            stats.errors.push({ type: 'payment_sync', id: payment.id, error: error.message });
          }
        }
      }
    } catch (error) {
      stats.errors.push({ type: 'payments_sync', error: error.message });
    }
  }
}

/**
 * Sync with e-commerce platform (Shopify, WooCommerce, etc.)
 */
async function syncEcommerce(tenantId, config, credentials, settings, stats) {
  const apiUrl = config.api_base_url;
  const apiKey = credentials.api_key;
  const apiSecret = credentials.api_secret;
  
  if (!apiUrl || !apiKey) {
    throw new Error('E-commerce API URL and API key are required');
  }
  
  // Pull orders from e-commerce
  if (settings.pull_orders !== false) {
    try {
      const lastSync = await getOneQuery(`
        SELECT MAX(synced_at) as last_sync FROM integration_sync_log
        WHERE config_id = ? AND entity_type = 'ecommerce_order'
      `, [config.id]);
      
      const since = lastSync?.last_sync || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const response = await fetchWithRetry(`${apiUrl}/orders?updated_at_min=${since}`, {
        headers: {
          'X-API-Key': apiKey,
          'X-API-Secret': apiSecret
        }
      });
      
      if (response.ok) {
        const orders = await response.json();
        for (const order of orders.orders || orders.data || orders) {
          stats.recordsProcessed++;
          try {
            await createOrderFromEcommerce(tenantId, order, config.id);
            await logSyncRecord(tenantId, config.id, 'ecommerce_order', order.id, 'pulled', order.id);
            stats.recordsCreated++;
          } catch (error) {
            stats.recordsFailed++;
            stats.errors.push({ type: 'ecommerce_order', id: order.id, error: error.message });
          }
        }
      }
    } catch (error) {
      stats.errors.push({ type: 'ecommerce_orders_sync', error: error.message });
    }
  }
  
  // Push inventory to e-commerce
  if (settings.push_inventory !== false) {
    const inventoryUpdates = await getQuery(`
      SELECT p.id, p.code, p.name, COALESCE(SUM(i.quantity_on_hand), 0) as stock
      FROM products p
      LEFT JOIN inventory_stock i ON p.id = i.product_id
      WHERE p.tenant_id = ? AND p.status = 'active'
      GROUP BY p.id
    `, [tenantId]);
    
    for (const item of inventoryUpdates || []) {
      stats.recordsProcessed++;
      try {
        const response = await fetchWithRetry(`${apiUrl}/inventory/${item.code}`, {
          method: 'PUT',
          headers: {
            'X-API-Key': apiKey,
            'X-API-Secret': apiSecret,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ quantity: item.stock })
        });
        
        if (response.ok) {
          stats.recordsUpdated++;
        } else if (response.status !== 404) {
          throw new Error(`E-commerce API returned ${response.status}`);
        }
      } catch (error) {
        stats.recordsFailed++;
        stats.errors.push({ type: 'inventory_push', id: item.id, error: error.message });
      }
    }
  }
}

/**
 * Sync with CRM system (Salesforce, HubSpot, etc.)
 */
async function syncCRM(tenantId, config, credentials, settings, stats) {
  const apiUrl = config.api_base_url;
  const accessToken = credentials.access_token;
  
  if (!apiUrl || !accessToken) {
    throw new Error('CRM API URL and access token are required');
  }
  
  // Push customers to CRM
  if (settings.push_customers !== false) {
    const newCustomers = await getQuery(`
      SELECT c.* FROM customers c
      LEFT JOIN integration_sync_log isl ON c.id = isl.entity_id AND isl.entity_type = 'customer' AND isl.config_id = ?
      WHERE c.tenant_id = ? AND isl.id IS NULL
      LIMIT 100
    `, [config.id, tenantId]);
    
    for (const customer of newCustomers || []) {
      stats.recordsProcessed++;
      try {
        const response = await fetchWithRetry(`${apiUrl}/contacts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transformCustomerForCRM(customer))
        });
        
        if (response.ok) {
          const result = await response.json();
          await logSyncRecord(tenantId, config.id, 'customer', customer.id, 'pushed', result.id);
          stats.recordsCreated++;
        } else {
          throw new Error(`CRM API returned ${response.status}`);
        }
      } catch (error) {
        stats.recordsFailed++;
        stats.errors.push({ type: 'customer_push', id: customer.id, error: error.message });
      }
    }
  }
  
  // Pull leads from CRM
  if (settings.pull_leads !== false) {
    try {
      const response = await fetchWithRetry(`${apiUrl}/leads?status=new`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        const leads = await response.json();
        for (const lead of leads.data || leads) {
          stats.recordsProcessed++;
          try {
            await createCustomerFromLead(tenantId, lead, config.id);
            await logSyncRecord(tenantId, config.id, 'lead', lead.id, 'pulled', lead.id);
            stats.recordsCreated++;
          } catch (error) {
            stats.recordsFailed++;
            stats.errors.push({ type: 'lead_pull', id: lead.id, error: error.message });
          }
        }
      }
    } catch (error) {
      stats.errors.push({ type: 'leads_sync', error: error.message });
    }
  }
}

/**
 * Sync with payment gateway
 */
async function syncPayment(tenantId, config, credentials, settings, stats) {
  const apiUrl = config.api_base_url;
  const apiKey = credentials.api_key;
  
  if (!apiUrl || !apiKey) {
    throw new Error('Payment API URL and API key are required');
  }
  
  // Pull transaction status updates
  const pendingTransactions = await getQuery(`
    SELECT pt.* FROM payment_transactions pt
    WHERE pt.tenant_id = ? AND pt.status = 'pending' AND pt.gateway_reference IS NOT NULL
    LIMIT 100
  `, [tenantId]);
  
  for (const transaction of pendingTransactions || []) {
    stats.recordsProcessed++;
    try {
      const response = await fetchWithRetry(`${apiUrl}/transactions/${transaction.gateway_reference}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.status !== transaction.status) {
          await runQuery(`
            UPDATE payment_transactions SET status = ?, updated_at = ? WHERE id = ?
          `, [result.status, new Date().toISOString(), transaction.id]);
          stats.recordsUpdated++;
        }
      }
    } catch (error) {
      stats.recordsFailed++;
      stats.errors.push({ type: 'transaction_status', id: transaction.id, error: error.message });
    }
  }
}

/**
 * Generic sync handler for custom integrations
 */
async function syncGeneric(tenantId, config, credentials, settings, stats) {
  // For generic integrations, just ping the API to verify connectivity
  const apiUrl = config.api_base_url;
  
  if (apiUrl) {
    try {
      const response = await fetchWithRetry(`${apiUrl}/health`, {
        headers: credentials.api_key ? { 'Authorization': `Bearer ${credentials.api_key}` } : {}
      });
      
      stats.recordsProcessed = 1;
      if (response.ok) {
        stats.recordsUpdated = 1;
      } else {
        stats.recordsFailed = 1;
        stats.errors.push({ type: 'health_check', error: `API returned ${response.status}` });
      }
    } catch (error) {
      stats.recordsFailed = 1;
      stats.errors.push({ type: 'health_check', error: error.message });
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function fetchWithRetry(url, options, retries = 3) {
  const retryAttempts = await settingsService.getSetting(null, 'integration.retry_attempts', retries);
  const timeout = await settingsService.getSetting(null, 'integration.webhook_timeout_seconds', 30) * 1000;
  
  for (let i = 0; i < retryAttempts; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (i === retryAttempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}

async function logSyncRecord(tenantId, configId, entityType, entityId, direction, externalId) {
  const id = crypto.randomUUID();
  await runQuery(`
    INSERT INTO integration_sync_log (id, tenant_id, config_id, entity_type, entity_id, direction, external_id, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, tenantId, configId, entityType, entityId, direction, externalId, new Date().toISOString()]);
}

async function upsertProduct(tenantId, productData, configId) {
  const existing = await getOneQuery(
    'SELECT id FROM products WHERE tenant_id = ? AND code = ?',
    [tenantId, productData.sku || productData.code]
  );
  
  if (existing) {
    await runQuery(`
      UPDATE products SET name = ?, cost_price = ?, selling_price = ?, updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `, [productData.name, productData.cost, productData.price, new Date().toISOString(), existing.id, tenantId]);
  } else {
    const id = crypto.randomUUID();
    await runQuery(`
      INSERT INTO products (id, tenant_id, code, name, cost_price, selling_price, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `, [id, tenantId, productData.sku || productData.code, productData.name, productData.cost, productData.price, new Date().toISOString(), new Date().toISOString()]);
  }
}

async function updateInventoryFromERP(tenantId, inventoryData) {
  const product = await getOneQuery(
    'SELECT id FROM products WHERE tenant_id = ? AND code = ?',
    [tenantId, inventoryData.sku || inventoryData.product_code]
  );
  
  if (product) {
    const existing = await getOneQuery(
      'SELECT id FROM inventory_stock WHERE tenant_id = ? AND product_id = ?',
      [tenantId, product.id]
    );
    
    if (existing) {
      await runQuery(`
        UPDATE inventory_stock SET quantity_on_hand = ?, updated_at = ? WHERE id = ?
      `, [inventoryData.quantity, new Date().toISOString(), existing.id]);
    }
  }
}

function transformOrderForERP(order) {
  return {
    external_reference: order.order_number,
    customer_id: order.customer_id,
    total_amount: order.total_amount,
    status: order.status,
    created_at: order.created_at
  };
}

function transformOrderToInvoice(order) {
  return {
    reference: order.order_number,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    amount: order.total_amount,
    date: order.created_at
  };
}

function transformCustomerForCRM(customer) {
  return {
    first_name: customer.name.split(' ')[0],
    last_name: customer.name.split(' ').slice(1).join(' ') || '',
    email: customer.email,
    phone: customer.phone,
    company: customer.company_name,
    address: customer.address
  };
}

async function recordPaymentFromAccounting(tenantId, payment) {
  // Find matching order by reference
  const order = await getOneQuery(
    'SELECT id FROM orders WHERE tenant_id = ? AND order_number = ?',
    [tenantId, payment.reference]
  );
  
  if (order) {
    const id = crypto.randomUUID();
    await runQuery(`
      INSERT INTO payments (id, tenant_id, order_id, amount, payment_method, status, external_reference, created_at)
      VALUES (?, ?, ?, ?, ?, 'completed', ?, ?)
    `, [id, tenantId, order.id, payment.amount, payment.method || 'external', payment.id, new Date().toISOString()]);
  }
}

async function createOrderFromEcommerce(tenantId, orderData, configId) {
  // Check if order already exists
  const existing = await getOneQuery(
    'SELECT id FROM orders WHERE tenant_id = ? AND external_reference = ?',
    [tenantId, orderData.id]
  );
  
  if (existing) return; // Skip if already imported
  
  // Find or create customer
  let customerId = null;
  if (orderData.customer?.email) {
    const customer = await getOneQuery(
      'SELECT id FROM customers WHERE tenant_id = ? AND email = ?',
      [tenantId, orderData.customer.email]
    );
    customerId = customer?.id;
  }
  
  const id = crypto.randomUUID();
  const orderNumber = `EC-${Date.now()}`;
  
  await runQuery(`
    INSERT INTO orders (id, tenant_id, order_number, customer_id, total_amount, status, external_reference, source, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, 'ecommerce', ?)
  `, [id, tenantId, orderNumber, customerId, orderData.total || orderData.total_price, orderData.id, new Date().toISOString()]);
}

async function createCustomerFromLead(tenantId, leadData, configId) {
  // Check if customer already exists
  const existing = await getOneQuery(
    'SELECT id FROM customers WHERE tenant_id = ? AND (email = ? OR phone = ?)',
    [tenantId, leadData.email, leadData.phone]
  );
  
  if (existing) return; // Skip if already exists
  
  const id = crypto.randomUUID();
  await runQuery(`
    INSERT INTO customers (id, tenant_id, name, email, phone, source, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'crm_lead', 'prospect', ?)
  `, [id, tenantId, leadData.name || `${leadData.first_name} ${leadData.last_name}`, leadData.email, leadData.phone, new Date().toISOString()]);
}

/**
 * Get sync job status
 */
async function getSyncJobStatus(tenantId, jobId) {
  return await getOneQuery(`
    SELECT sj.*, ic.name as config_name
    FROM sync_jobs sj
    JOIN integration_configs ic ON sj.config_id = ic.id
    WHERE sj.id = ? AND sj.tenant_id = ?
  `, [jobId, tenantId]);
}

/**
 * Get sync history for a config
 */
async function getSyncHistory(tenantId, configId, limit = 20) {
  return await getQuery(`
    SELECT * FROM sync_jobs
    WHERE tenant_id = ? AND config_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `, [tenantId, configId, limit]);
}

/**
 * Cancel a running sync job
 */
async function cancelSyncJob(tenantId, jobId) {
  const job = await getOneQuery(
    'SELECT * FROM sync_jobs WHERE id = ? AND tenant_id = ? AND status = ?',
    [jobId, tenantId, 'running']
  );
  
  if (!job) {
    throw new Error('Running sync job not found');
  }
  
  // Remove from active jobs
  activeSyncJobs.delete(`${tenantId}:${job.config_id}`);
  
  // Update status
  await runQuery(`
    UPDATE sync_jobs SET status = 'cancelled', completed_at = ? WHERE id = ?
  `, [new Date().toISOString(), jobId]);
  
  return { jobId, status: 'cancelled' };
}

module.exports = {
  startSyncJob,
  getSyncJobStatus,
  getSyncHistory,
  cancelSyncJob,
  
  // For testing
  executeSyncJob,
  fetchWithRetry
};
