const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor(db) {
    this.db = db;
    this.logDir = path.join(__dirname, '../../logs/audit');
    this.ensureLogDirectory();
    this.initializeAuditTable();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  initializeAuditTable() {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id TEXT,
          user_id INTEGER,
          user_email TEXT,
          action TEXT NOT NULL,
          resource_type TEXT NOT NULL,
          resource_id TEXT,
          old_values TEXT,
          new_values TEXT,
          ip_address TEXT,
          user_agent TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          session_id TEXT,
          success BOOLEAN DEFAULT 1,
          error_message TEXT
        )
      `);
      
      // Create index for performance
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_timestamp 
        ON audit_logs(tenant_id, timestamp)
      `);
      
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp 
        ON audit_logs(user_id, timestamp)
      `);
    } catch (error) {
      console.error('Failed to initialize audit table:', error);
    }
  }

  // Log audit event to database
  logToDatabase(auditData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO audit_logs (
          tenant_id, user_id, user_email, action, resource_type, 
          resource_id, old_values, new_values, ip_address, 
          user_agent, session_id, success, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        auditData.tenant_id,
        auditData.user_id,
        auditData.user_email,
        auditData.action,
        auditData.resource_type,
        auditData.resource_id,
        JSON.stringify(auditData.old_values),
        JSON.stringify(auditData.new_values),
        auditData.ip_address,
        auditData.user_agent,
        auditData.session_id,
        auditData.success ? 1 : 0,
        auditData.error_message
      );
    } catch (error) {
      console.error('Failed to log audit event to database:', error);
      // Fallback to file logging
      this.logToFile(auditData);
    }
  }

  // Log audit event to file (fallback)
  logToFile(auditData) {
    try {
      const logFile = path.join(this.logDir, `audit-${new Date().toISOString().split('T')[0]}.log`);
      const logEntry = {
        timestamp: new Date().toISOString(),
        ...auditData
      };
      
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to log audit event to file:', error);
    }
  }

  // Main audit logging method
  log(req, action, resourceType, resourceId = null, oldValues = null, newValues = null, success = true, errorMessage = null) {
    const auditData = {
      tenant_id: req.user?.tenant_id || null,
      user_id: req.user?.id || null,
      user_email: req.user?.email || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID || null,
      success,
      error_message: errorMessage
    };

    this.logToDatabase(auditData);
  }

  // Get audit logs with filtering
  getAuditLogs(tenantId, filters = {}) {
    try {
      let query = `
        SELECT * FROM audit_logs 
        WHERE tenant_id = ?
      `;
      const params = [tenantId];

      if (filters.user_id) {
        query += ` AND user_id = ?`;
        params.push(filters.user_id);
      }

      if (filters.action) {
        query += ` AND action = ?`;
        params.push(filters.action);
      }

      if (filters.resource_type) {
        query += ` AND resource_type = ?`;
        params.push(filters.resource_type);
      }

      if (filters.start_date) {
        query += ` AND timestamp >= ?`;
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ` AND timestamp <= ?`;
        params.push(filters.end_date);
      }

      query += ` ORDER BY timestamp DESC`;

      if (filters.limit) {
        query += ` LIMIT ?`;
        params.push(filters.limit);
      }

      return this.db.prepare(query).all(...params);
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }

  // Get audit statistics
  getAuditStats(tenantId, days = 30) {
    try {
      const stats = this.db.prepare(`
        SELECT 
          action,
          resource_type,
          COUNT(*) as count,
          COUNT(CASE WHEN success = 0 THEN 1 END) as failures
        FROM audit_logs 
        WHERE tenant_id = ? 
          AND timestamp >= datetime('now', '-${days} days')
        GROUP BY action, resource_type
        ORDER BY count DESC
      `).all(tenantId);

      const summary = this.db.prepare(`
        SELECT 
          COUNT(*) as total_events,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(CASE WHEN success = 0 THEN 1 END) as total_failures,
          COUNT(CASE WHEN timestamp >= datetime('now', '-1 day') THEN 1 END) as events_last_24h
        FROM audit_logs 
        WHERE tenant_id = ? 
          AND timestamp >= datetime('now', '-${days} days')
      `).get(tenantId);

      return {
        summary,
        breakdown: stats
      };
    } catch (error) {
      console.error('Failed to get audit statistics:', error);
      return { summary: {}, breakdown: [] };
    }
  }
}

// Middleware function to create audit logger
function createAuditLogger(db) {
  return new AuditLogger(db);
}

// Middleware to automatically log certain actions
function auditMiddleware(auditLogger) {
  return (req, res, next) => {
    // Store original res.json to intercept responses
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const action = getActionFromRequest(req);
        const resourceType = getResourceTypeFromRequest(req);
        
        if (action && resourceType) {
          auditLogger.log(
            req, 
            action, 
            resourceType, 
            data?.id || req.params?.id,
            null, // old values - would need to be captured before operation
            data,
            true
          );
        }
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Helper functions
function getActionFromRequest(req) {
  const method = req.method.toLowerCase();
  const path = req.path;
  
  if (method === 'post') return 'CREATE';
  if (method === 'put' || method === 'patch') return 'UPDATE';
  if (method === 'delete') return 'DELETE';
  if (method === 'get' && path.includes('/export')) return 'EXPORT';
  if (method === 'get') return 'READ';
  
  return null;
}

function getResourceTypeFromRequest(req) {
  const path = req.path;
  
  if (path.includes('/customers')) return 'CUSTOMER';
  if (path.includes('/products')) return 'PRODUCT';
  if (path.includes('/orders')) return 'ORDER';
  if (path.includes('/visits')) return 'VISIT';
  if (path.includes('/users')) return 'USER';
  if (path.includes('/inventory')) return 'INVENTORY';
  if (path.includes('/surveys')) return 'SURVEY';
  if (path.includes('/promotions')) return 'PROMOTION';
  if (path.includes('/kyc')) return 'KYC';
  if (path.includes('/van-sales')) return 'VAN_SALES';
  
  return 'UNKNOWN';
}

module.exports = {
  AuditLogger,
  createAuditLogger,
  auditMiddleware
};