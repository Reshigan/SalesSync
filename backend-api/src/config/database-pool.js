const Database = require('better-sqlite3');
const path = require('path');

class DatabasePool {
  constructor() {
    this.pools = new Map();
    this.maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS) || 10;
    this.connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000;
  }

  // Get or create database connection pool for tenant
  getConnection(tenantId = 'default') {
    if (!this.pools.has(tenantId)) {
      this.createPool(tenantId);
    }
    
    return this.pools.get(tenantId);
  }

  // Create new connection pool
  createPool(tenantId) {
    try {
      const dbPath = this.getDatabasePath(tenantId);
      
      const db = new Database(dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : null,
        timeout: this.connectionTimeout,
        fileMustExist: false
      });

      // Configure database for performance
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('cache_size = 1000000');
      db.pragma('temp_store = memory');
      db.pragma('mmap_size = 268435456'); // 256MB

      // Connection pool wrapper
      const pool = {
        db,
        tenantId,
        createdAt: new Date(),
        lastUsed: new Date(),
        activeQueries: 0,
        totalQueries: 0
      };

      this.pools.set(tenantId, pool);
      
      console.log(`Database pool created for tenant: ${tenantId}`);
      return pool;
    } catch (error) {
      console.error(`Failed to create database pool for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  // Get database file path for tenant
  getDatabasePath(tenantId) {
    if (tenantId === 'default') {
      return path.join(__dirname, '../../database.sqlite');
    }
    
    const dbDir = path.join(__dirname, '../../databases');
    if (!require('fs').existsSync(dbDir)) {
      require('fs').mkdirSync(dbDir, { recursive: true });
    }
    
    return path.join(dbDir, `${tenantId}.sqlite`);
  }

  // Execute query with connection pooling
  async executeQuery(tenantId, query, params = []) {
    const pool = this.getConnection(tenantId);
    
    try {
      pool.activeQueries++;
      pool.totalQueries++;
      pool.lastUsed = new Date();
      
      // Determine query type
      const queryType = query.trim().toLowerCase().split(' ')[0];
      
      let result;
      if (queryType === 'select') {
        if (params.length > 0) {
          result = pool.db.prepare(query).all(...params);
        } else {
          result = pool.db.prepare(query).all();
        }
      } else {
        if (params.length > 0) {
          result = pool.db.prepare(query).run(...params);
        } else {
          result = pool.db.prepare(query).run();
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Database query error for tenant ${tenantId}:`, error);
      throw error;
    } finally {
      pool.activeQueries--;
    }
  }

  // Execute transaction
  async executeTransaction(tenantId, queries) {
    const pool = this.getConnection(tenantId);
    
    const transaction = pool.db.transaction((queries) => {
      const results = [];
      for (const { query, params = [] } of queries) {
        const result = pool.db.prepare(query).run(...params);
        results.push(result);
      }
      return results;
    });
    
    try {
      pool.activeQueries++;
      pool.totalQueries += queries.length;
      pool.lastUsed = new Date();
      
      return transaction(queries);
    } catch (error) {
      console.error(`Database transaction error for tenant ${tenantId}:`, error);
      throw error;
    } finally {
      pool.activeQueries--;
    }
  }

  // Get pool statistics
  getPoolStats() {
    const stats = {};
    
    for (const [tenantId, pool] of this.pools.entries()) {
      stats[tenantId] = {
        createdAt: pool.createdAt,
        lastUsed: pool.lastUsed,
        activeQueries: pool.activeQueries,
        totalQueries: pool.totalQueries,
        isHealthy: this.isPoolHealthy(pool)
      };
    }
    
    return stats;
  }

  // Check if pool is healthy
  isPoolHealthy(pool) {
    try {
      pool.db.prepare('SELECT 1').get();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Cleanup idle connections
  cleanupIdleConnections() {
    const idleTimeout = 30 * 60 * 1000; // 30 minutes
    const now = new Date();
    
    for (const [tenantId, pool] of this.pools.entries()) {
      const idleTime = now - pool.lastUsed;
      
      if (idleTime > idleTimeout && pool.activeQueries === 0) {
        try {
          pool.db.close();
          this.pools.delete(tenantId);
          console.log(`Closed idle database connection for tenant: ${tenantId}`);
        } catch (error) {
          console.error(`Error closing database connection for tenant ${tenantId}:`, error);
        }
      }
    }
  }

  // Close all connections
  closeAllConnections() {
    for (const [tenantId, pool] of this.pools.entries()) {
      try {
        pool.db.close();
        console.log(`Closed database connection for tenant: ${tenantId}`);
      } catch (error) {
        console.error(`Error closing database connection for tenant ${tenantId}:`, error);
      }
    }
    
    this.pools.clear();
  }

  // Health check for all pools
  async healthCheck() {
    const results = {};
    
    for (const [tenantId, pool] of this.pools.entries()) {
      try {
        const start = Date.now();
        pool.db.prepare('SELECT 1 as health_check').get();
        const responseTime = Date.now() - start;
        
        results[tenantId] = {
          status: 'healthy',
          responseTime,
          activeQueries: pool.activeQueries,
          totalQueries: pool.totalQueries
        };
      } catch (error) {
        results[tenantId] = {
          status: 'unhealthy',
          error: error.message,
          activeQueries: pool.activeQueries,
          totalQueries: pool.totalQueries
        };
      }
    }
    
    return results;
  }
}

// Create singleton instance
const dbPool = new DatabasePool();

// Start cleanup interval
setInterval(() => {
  dbPool.cleanupIdleConnections();
}, 5 * 60 * 1000); // Every 5 minutes

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connections...');
  dbPool.closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Closing database connections...');
  dbPool.closeAllConnections();
  process.exit(0);
});

module.exports = {
  DatabasePool,
  dbPool
};