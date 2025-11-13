/**
 * Database utility module that dynamically loads the correct database implementation
 * based on NODE_ENV and DB_TYPE configuration.
 * 
 * In production with PostgreSQL (DB_TYPE=postgres), uses postgres-init module.
 * Otherwise, uses SQLite (init module).
 */

const config = require('../config/database');

let dbModule;
if (process.env.NODE_ENV === 'production' && config.type === 'postgres') {
  dbModule = require('../database/postgres-init');
  console.log('[utils/database] Using PostgreSQL database module');
} else {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  
  let db = null;
  
  function getDatabase() {
    if (!db) {
      const dbPath = path.join(__dirname, '../../database/salessync.db');
      db = new sqlite3.Database(dbPath);
    }
    return db;
  }
  
  function getQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      const database = getDatabase();
      database.all(query, params, (err, rows) => {
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
  
  function getOneQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      const database = getDatabase();
      database.get(query, params, (err, row) => {
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }
  
  function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      const database = getDatabase();
      database.run(query, params, function(err) {
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }
  
  function runTransaction(queries) {
    return new Promise((resolve, reject) => {
      const database = getDatabase();
      const results = [];
      
      database.serialize(() => {
        database.run('BEGIN TRANSACTION');
        
        let completed = 0;
        let hasError = false;
        
        queries.forEach((queryObj, index) => {
          if (hasError) return;
          
          database.run(queryObj.query, queryObj.params || [], function(err) {
            if (err && !hasError) {
              hasError = true;
              database.run('ROLLBACK');
              reject(err);
              return;
            }
            
            results[index] = {
              lastID: this.lastID,
              changes: this.changes
            };
            
            completed++;
            
            if (completed === queries.length && !hasError) {
              database.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  reject(commitErr);
                } else {
                  resolve(results);
                }
              });
            }
          });
        });
      });
    });
  }
  
  function closeDatabase() {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed.');
        }
      });
      db = null;
    }
  }
  
  dbModule = {
    getDatabase,
    getQuery,
    getOneQuery,
    runQuery,
    runTransaction,
    closeDatabase
  };
  
  console.log('[utils/database] Using SQLite database module');
}

module.exports = {
  getDatabase: dbModule.getDatabase,
  getQuery: dbModule.getQuery,
  getOneQuery: dbModule.getOneQuery,
  runQuery: dbModule.runQuery,
  runTransaction: dbModule.runTransaction,
  closeDatabase: dbModule.closeDatabase
};
