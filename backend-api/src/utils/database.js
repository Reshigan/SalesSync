const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Get database instance
let db = null;

function getDatabase() {
  if (!db) {
    const dbPath = path.join(__dirname, '../../database/salessync.db');
    db = new sqlite3.Database(dbPath);
  }
  return db;
}

/**
 * Execute a SELECT query and return all rows
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Array of rows
 */
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

/**
 * Execute a SELECT query and return a single row
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} Single row or null
 */
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

/**
 * Execute an INSERT, UPDATE, or DELETE query
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Result with lastID and changes
 */
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

/**
 * Execute multiple queries in a transaction
 * @param {Array} queries - Array of {query, params} objects
 * @returns {Promise<Array>} Array of results
 */
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

/**
 * Close the database connection
 */
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

module.exports = {
  getDatabase,
  getQuery,
  getOneQuery,
  runQuery,
  runTransaction,
  closeDatabase
};