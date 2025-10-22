const { Pool } = require('pg');
const config = require('../config/config');

// Create PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'salessync_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'salessync',
  password: process.env.DB_PASSWORD || 'salessync_password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute a SELECT query
 * @param {string} query - SQL query with $1, $2, etc. placeholders
 * @param {Array} params - Parameters for the query
 * @returns {Promise<Array>} Array of rows
 */
async function getQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 * @param {string} query - SQL query with $1, $2, etc. placeholders
 * @param {Array} params - Parameters for the query
 * @returns {Promise<Object>} Result with rowCount, rows, etc.
 */
async function runQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return {
      changes: result.rowCount,
      lastID: result.rows[0]?.id || null,
      rows: result.rows
    };
  } catch (error) {
    console.error('Database run error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute multiple queries in a transaction
 * @param {Function} callback - Async function that receives a client
 * @returns {Promise<any>} Result from the callback
 */
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get a single row
 * @param {string} query - SQL query
 * @param {Array} params - Parameters
 * @returns {Promise<Object|null>} Single row or null
 */
async function get(query, params = []) {
  const rows = await getQuery(query, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get all rows
 * @param {string} query - SQL query
 * @param {Array} params - Parameters
 * @returns {Promise<Array>} Array of rows
 */
async function all(query, params = []) {
  return await getQuery(query, params);
}

/**
 * Execute a query (for non-SELECT statements)
 * @param {string} query - SQL query
 * @param {Array} params - Parameters
 * @returns {Promise<Object>} Result object
 */
async function run(query, params = []) {
  return await runQuery(query, params);
}

/**
 * Close the pool
 */
async function close() {
  await pool.end();
}

/**
 * Get pool stats
 */
function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  };
}

module.exports = {
  getQuery,
  runQuery,
  transaction,
  get,
  all,
  run,
  close,
  getPoolStats,
  pool
};
