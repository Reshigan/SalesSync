const { runQuery } = require('../database/postgres');

const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT'
};

const AUDIT_ENTITIES = {
  USER: 'users',
  CUSTOMER: 'customers',
  ORDER: 'orders',
  PRODUCT: 'products',
  VAN_SALE: 'van_sales',
  PROMOTION: 'promotions',
  CAMPAIGN: 'campaigns'
};

async function logAudit(userId, tenantId, action, entity, entityId, changes = null, ipAddress = null, userAgent = null) {
  try {
    const query = `
      INSERT INTO audit_logs (
        user_id, tenant_id, action, entity_type, entity_id, 
        changes, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;
    
    await runQuery(query, [
      userId,
      tenantId,
      action,
      entity,
      entityId,
      changes ? JSON.stringify(changes) : null,
      ipAddress,
      userAgent
    ]);
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}

function auditMiddleware(action, entity) {
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.userId || req.user?.id;
        const tenantId = req.tenantId;
        const entityId = req.params.id || req.body?.id;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');
        
        let changes = null;
        if (action === AUDIT_ACTIONS.UPDATE && req.body) {
          changes = { updated_fields: Object.keys(req.body) };
        } else if (action === AUDIT_ACTIONS.CREATE && req.body) {
          changes = { created_data: req.body };
        }
        
        logAudit(userId, tenantId, action, entity, entityId, changes, ipAddress, userAgent)
          .catch(err => console.error('Audit log error:', err));
      }
      
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.userId || req.user?.id;
        const tenantId = req.tenantId;
        const entityId = req.params.id || req.body?.id || data?.data?.id;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');
        
        let changes = null;
        if (action === AUDIT_ACTIONS.UPDATE && req.body) {
          changes = { updated_fields: Object.keys(req.body) };
        } else if (action === AUDIT_ACTIONS.CREATE && req.body) {
          changes = { created_data: req.body };
        }
        
        logAudit(userId, tenantId, action, entity, entityId, changes, ipAddress, userAgent)
          .catch(err => console.error('Audit log error:', err));
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

module.exports = {
  auditMiddleware,
  logAudit,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES
};
