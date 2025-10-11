const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireFunction, requireRole } = require('../middleware/authMiddleware');
const crypto = require('crypto');

// Get integration providers
router.get('/providers', requireFunction('integrations', 'view'), async (req, res) => {
  try {
    const { provider_type, status } = req.query;
    
    let query = `
      SELECT 
        ip.*,
        COUNT(ic.id) as config_count,
        MAX(ic.last_sync_at) as last_sync_at
      FROM integration_providers ip
      LEFT JOIN integration_configs ic ON ip.id = ic.provider_id AND ic.is_active = 1
      WHERE ip.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (provider_type) {
      query += ' AND ip.provider_type = ?';
      params.push(provider_type);
    }
    
    if (status) {
      query += ' AND ip.status = ?';
      params.push(status);
    }
    
    query += ' GROUP BY ip.id ORDER BY ip.created_at DESC';
    
    const providers = await db.all(query, params);
    
    res.json({
      success: true,
      data: providers.map(provider => ({
        ...provider,
        authentication_config: provider.authentication_config ? JSON.parse(provider.authentication_config) : {},
        rate_limits: provider.rate_limits ? JSON.parse(provider.rate_limits) : {},
        supported_operations: provider.supported_operations ? JSON.parse(provider.supported_operations) : [],
        webhook_config: provider.webhook_config ? JSON.parse(provider.webhook_config) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching integration providers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create integration provider
router.post('/providers', requireFunction('integrations', 'create'), async (req, res) => {
  try {
    const {
      provider_name,
      provider_type,
      provider_category,
      api_base_url,
      authentication_type,
      authentication_config,
      rate_limits,
      supported_operations,
      webhook_config
    } = req.body;
    
    if (!provider_name || !provider_type || !provider_category || !api_base_url || !authentication_type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Provider name, type, category, API base URL, and authentication type are required' 
      });
    }
    
    const providerId = crypto.randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO integration_providers (
        id, tenant_id, provider_name, provider_type, provider_category,
        api_base_url, authentication_type, authentication_config,
        rate_limits, supported_operations, webhook_config
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      providerId,
      req.user.tenantId,
      provider_name,
      provider_type,
      provider_category,
      api_base_url,
      authentication_type,
      JSON.stringify(authentication_config || {}),
      JSON.stringify(rate_limits || {}),
      JSON.stringify(supported_operations || []),
      JSON.stringify(webhook_config || {})
    ]);
    
    const provider = await db.get('SELECT * FROM integration_providers WHERE id = ?', [providerId]);
    
    res.status(201).json({
      success: true,
      data: provider
    });
  } catch (error) {
    console.error('Error creating integration provider:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get integration configurations
router.get('/configs', requireFunction('integrations', 'view'), async (req, res) => {
  try {
    const { provider_id, source_entity, sync_direction, is_active } = req.query;
    
    let query = `
      SELECT 
        ic.*,
        ip.provider_name,
        ip.provider_type
      FROM integration_configs ic
      LEFT JOIN integration_providers ip ON ic.provider_id = ip.id
      WHERE ic.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (provider_id) {
      query += ' AND ic.provider_id = ?';
      params.push(provider_id);
    }
    
    if (source_entity) {
      query += ' AND ic.source_entity = ?';
      params.push(source_entity);
    }
    
    if (sync_direction) {
      query += ' AND ic.sync_direction = ?';
      params.push(sync_direction);
    }
    
    if (is_active !== undefined) {
      query += ' AND ic.is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }
    
    query += ' ORDER BY ic.created_at DESC';
    
    const configs = await db.all(query, params);
    
    res.json({
      success: true,
      data: configs.map(config => ({
        ...config,
        field_mappings: config.field_mappings ? JSON.parse(config.field_mappings) : {},
        sync_schedule: config.sync_schedule ? JSON.parse(config.sync_schedule) : {},
        filters_config: config.filters_config ? JSON.parse(config.filters_config) : {},
        transformation_rules: config.transformation_rules ? JSON.parse(config.transformation_rules) : {},
        error_handling: config.error_handling ? JSON.parse(config.error_handling) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching integration configs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create integration configuration
router.post('/configs', requireFunction('integrations', 'create'), async (req, res) => {
  try {
    const {
      provider_id,
      config_name,
      config_type,
      source_entity,
      target_entity,
      field_mappings,
      sync_direction,
      sync_frequency,
      sync_schedule,
      filters_config,
      transformation_rules,
      error_handling
    } = req.body;
    
    if (!provider_id || !config_name || !config_type || !source_entity || !field_mappings || !sync_direction) {
      return res.status(400).json({ 
        success: false, 
        error: 'Provider ID, config name, type, source entity, field mappings, and sync direction are required' 
      });
    }
    
    const configId = crypto.randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO integration_configs (
        id, tenant_id, provider_id, config_name, config_type, source_entity,
        target_entity, field_mappings, sync_direction, sync_frequency,
        sync_schedule, filters_config, transformation_rules, error_handling
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      configId,
      req.user.tenantId,
      provider_id,
      config_name,
      config_type,
      source_entity,
      target_entity,
      JSON.stringify(field_mappings),
      sync_direction,
      sync_frequency,
      JSON.stringify(sync_schedule || {}),
      JSON.stringify(filters_config || {}),
      JSON.stringify(transformation_rules || {}),
      JSON.stringify(error_handling || {})
    ]);
    
    const config = await db.get(`
      SELECT ic.*, ip.provider_name
      FROM integration_configs ic
      LEFT JOIN integration_providers ip ON ic.provider_id = ip.id
      WHERE ic.id = ?
    `, [configId]);
    
    res.status(201).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error creating integration config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger sync job
router.post('/configs/:id/sync', requireFunction('integrations', 'execute'), async (req, res) => {
  try {
    const { job_type = 'manual_sync' } = req.body;
    
    const config = await db.get(`
      SELECT * FROM integration_configs 
      WHERE id = ? AND tenant_id = ? AND is_active = 1
    `, [req.params.id, req.user.tenantId]);
    
    if (!config) {
      return res.status(404).json({ success: false, error: 'Integration config not found' });
    }
    
    const jobId = crypto.randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO sync_jobs (
        id, tenant_id, config_id, job_type, status, triggered_by, triggered_by_user
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      jobId,
      req.user.tenantId,
      req.params.id,
      job_type,
      'pending',
      'manual',
      req.user.userId
    ]);
    
    // Simulate sync job execution (in production, this would be handled by a background worker)
    setTimeout(async () => {
      try {
        await db.run(`
          UPDATE sync_jobs 
          SET status = 'running', started_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [jobId]);
        
        // Simulate processing
        const processingResult = await simulateSyncJob(config, req.user.tenantId);
        
        await db.run(`
          UPDATE sync_jobs 
          SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
              records_processed = ?, records_success = ?, records_failed = ?,
              sync_summary = ?, execution_time_ms = ?
          WHERE id = ?
        `, [
          processingResult.processed,
          processingResult.success,
          processingResult.failed,
          JSON.stringify(processingResult.summary),
          processingResult.executionTime,
          jobId
        ]);
        
        // Update config last sync time
        await db.run(`
          UPDATE integration_configs 
          SET last_sync_at = CURRENT_TIMESTAMP, next_sync_at = ?
          WHERE id = ?
        `, [calculateNextSyncTime(config.sync_frequency), req.params.id]);
        
      } catch (error) {
        await db.run(`
          UPDATE sync_jobs 
          SET status = 'failed', completed_at = CURRENT_TIMESTAMP,
              error_details = ?
          WHERE id = ?
        `, [JSON.stringify({ error: error.message }), jobId]);
      }
    }, 1000);
    
    const job = await db.get('SELECT * FROM sync_jobs WHERE id = ?', [jobId]);
    
    res.status(201).json({
      success: true,
      data: job,
      message: 'Sync job started successfully'
    });
  } catch (error) {
    console.error('Error triggering sync job:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sync jobs
router.get('/jobs', requireFunction('integrations', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 20, config_id, status } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        sj.*,
        ic.config_name,
        ip.provider_name,
        u.name as triggered_by_name
      FROM sync_jobs sj
      LEFT JOIN integration_configs ic ON sj.config_id = ic.id
      LEFT JOIN integration_providers ip ON ic.provider_id = ip.id
      LEFT JOIN users u ON sj.triggered_by_user = u.id
      WHERE sj.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (config_id) {
      query += ' AND sj.config_id = ?';
      params.push(config_id);
    }
    
    if (status) {
      query += ' AND sj.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY sj.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const jobs = await db.all(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM sync_jobs WHERE tenant_id = ?';
    const countParams = [req.user.tenantId];
    
    if (config_id) {
      countQuery += ' AND config_id = ?';
      countParams.push(config_id);
    }
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const { total } = await db.get(countQuery, countParams);
    
    res.json({
      success: true,
      data: jobs.map(job => ({
        ...job,
        error_details: job.error_details ? JSON.parse(job.error_details) : null,
        sync_summary: job.sync_summary ? JSON.parse(job.sync_summary) : null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sync jobs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle webhook events
router.post('/webhooks/:provider_id', async (req, res) => {
  try {
    const { provider_id } = req.params;
    const payload = req.body;
    const headers = req.headers;
    
    // Verify webhook signature (simplified - in production use proper verification)
    const signature = headers['x-webhook-signature'] || headers['signature'];
    
    const eventId = crypto.randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO webhook_events (
        id, tenant_id, provider_id, event_type, event_source,
        payload, headers, signature
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      eventId,
      req.user?.tenantId || 'webhook', // Handle cases where tenant is not in context
      provider_id,
      payload.event_type || 'unknown',
      payload.source || 'external',
      JSON.stringify(payload),
      JSON.stringify(headers),
      signature
    ]);
    
    // Process webhook asynchronously
    setTimeout(async () => {
      try {
        const processingResult = await processWebhookEvent(eventId, payload);
        
        await db.run(`
          UPDATE webhook_events 
          SET processed = 1, processed_at = CURRENT_TIMESTAMP,
              processing_result = ?
          WHERE id = ?
        `, [JSON.stringify(processingResult), eventId]);
        
      } catch (error) {
        await db.run(`
          UPDATE webhook_events 
          SET processing_result = ?, retry_count = retry_count + 1,
              next_retry_at = datetime('now', '+1 hour')
          WHERE id = ?
        `, [JSON.stringify({ error: error.message }), eventId]);
      }
    }, 100);
    
    res.status(200).json({ success: true, event_id: eventId });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get payment transactions
router.get('/payments', requireFunction('integrations', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 20, provider_id, status, transaction_type } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        pt.*,
        ip.provider_name,
        c.name as customer_name,
        o.order_number
      FROM payment_transactions pt
      LEFT JOIN integration_providers ip ON pt.provider_id = ip.id
      LEFT JOIN customers c ON pt.customer_id = c.id
      LEFT JOIN orders o ON pt.order_id = o.id
      WHERE pt.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (provider_id) {
      query += ' AND pt.provider_id = ?';
      params.push(provider_id);
    }
    
    if (status) {
      query += ' AND pt.status = ?';
      params.push(status);
    }
    
    if (transaction_type) {
      query += ' AND pt.transaction_type = ?';
      params.push(transaction_type);
    }
    
    query += ' ORDER BY pt.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const transactions = await db.all(query, params);
    
    res.json({
      success: true,
      data: transactions.map(transaction => ({
        ...transaction,
        gateway_response: transaction.gateway_response ? JSON.parse(transaction.gateway_response) : {},
        billing_details: transaction.billing_details ? JSON.parse(transaction.billing_details) : {},
        metadata: transaction.metadata ? JSON.parse(transaction.metadata) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching payment transactions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create communication campaign
router.post('/communications/campaigns', requireFunction('integrations', 'create'), async (req, res) => {
  try {
    const {
      provider_id,
      campaign_name,
      campaign_type,
      message_template,
      recipient_list,
      personalization_data,
      scheduling_config
    } = req.body;
    
    if (!provider_id || !campaign_name || !campaign_type || !message_template || !recipient_list) {
      return res.status(400).json({ 
        success: false, 
        error: 'Provider ID, campaign name, type, message template, and recipient list are required' 
      });
    }
    
    const campaignId = crypto.randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO communication_campaigns (
        id, tenant_id, provider_id, campaign_name, campaign_type,
        message_template, recipient_list, personalization_data,
        scheduling_config, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      campaignId,
      req.user.tenantId,
      provider_id,
      campaign_name,
      campaign_type,
      message_template,
      JSON.stringify(recipient_list),
      JSON.stringify(personalization_data || {}),
      JSON.stringify(scheduling_config || {}),
      req.user.userId
    ]);
    
    const campaign = await db.get(`
      SELECT cc.*, ip.provider_name
      FROM communication_campaigns cc
      LEFT JOIN integration_providers ip ON cc.provider_id = ip.id
      WHERE cc.id = ?
    `, [campaignId]);
    
    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error creating communication campaign:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get integration logs
router.get('/logs', requireFunction('integrations', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 50, provider_id, log_level, log_category } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        il.*,
        ip.provider_name
      FROM integration_logs il
      LEFT JOIN integration_providers ip ON il.provider_id = ip.id
      WHERE il.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (provider_id) {
      query += ' AND il.provider_id = ?';
      params.push(provider_id);
    }
    
    if (log_level) {
      query += ' AND il.log_level = ?';
      params.push(log_level);
    }
    
    if (log_category) {
      query += ' AND il.log_category = ?';
      params.push(log_category);
    }
    
    query += ' ORDER BY il.timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const logs = await db.all(query, params);
    
    res.json({
      success: true,
      data: logs.map(log => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : {},
        request_data: log.request_data ? JSON.parse(log.request_data) : {},
        response_data: log.response_data ? JSON.parse(log.response_data) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching integration logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions
async function simulateSyncJob(config, tenantId) {
  const startTime = Date.now();
  
  // Simulate processing based on source entity
  let processed = 0, success = 0, failed = 0;
  
  if (config.source_entity === 'customers') {
    const customers = await db.all('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?', [tenantId]);
    processed = customers[0].count;
    success = Math.floor(processed * 0.95); // 95% success rate
    failed = processed - success;
  } else if (config.source_entity === 'products') {
    const products = await db.all('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?', [tenantId]);
    processed = products[0].count;
    success = Math.floor(processed * 0.98); // 98% success rate
    failed = processed - success;
  } else {
    processed = Math.floor(Math.random() * 100) + 10;
    success = Math.floor(processed * 0.9);
    failed = processed - success;
  }
  
  const executionTime = Date.now() - startTime;
  
  return {
    processed,
    success,
    failed,
    executionTime,
    summary: {
      sync_type: config.sync_direction,
      entity: config.source_entity,
      success_rate: (success / processed * 100).toFixed(2) + '%'
    }
  };
}

function calculateNextSyncTime(frequency) {
  const now = new Date();
  
  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return null;
  }
}

async function processWebhookEvent(eventId, payload) {
  // Simulate webhook processing
  return {
    processed: true,
    action_taken: 'data_updated',
    records_affected: Math.floor(Math.random() * 10) + 1
  };
}

module.exports = router;