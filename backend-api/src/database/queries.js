/**
 * Database query helper functions
 * Provides reusable database query operations
 */

const getDatabase = () => require('../utils/database').getDatabase();

/**
 * Get multiple records from a table
 */
function getQuery(table, conditions = {}, tenantId) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM ${table}`;
    const params = [];

    if (tenantId) {
      sql += ' WHERE tenant_id = ?';
      params.push(tenantId);
    }

    Object.keys(conditions).forEach((key) => {
      sql += tenantId || params.length > 0 ? ' AND' : ' WHERE';
      sql += ` ${key} = ?`;
      params.push(conditions[key]);
    });

    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

/**
 * Get a single record from a table
 */
function getOneQuery(table, conditions, tenantId) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM ${table}`;
    const params = [];

    if (tenantId) {
      sql += ' WHERE tenant_id = ?';
      params.push(tenantId);
    }

    Object.keys(conditions).forEach((key) => {
      sql += tenantId || params.length > 0 ? ' AND' : ' WHERE';
      sql += ` ${key} = ?`;
      params.push(conditions[key]);
    });

    sql += ' LIMIT 1';

    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

/**
 * Insert a record into a table
 */
function insertQuery(table, data, tenantId) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    const fullData = tenantId ? { ...data, tenant_id: tenantId } : data;
    const columns = Object.keys(fullData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(fullData);

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    db.run(sql, values, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Update records in a table
 */
function updateQuery(table, data, conditions, tenantId) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    // Check if data is empty
    if (!data || Object.keys(data).length === 0) {
      return reject(new Error('No data provided for update'));
    }
    
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const setValues = Object.values(data);
    
    let sql = `UPDATE ${table} SET ${setClause}`;
    const params = [...setValues];

    if (tenantId) {
      sql += ' WHERE tenant_id = ?';
      params.push(tenantId);
    }

    Object.keys(conditions).forEach((key) => {
      sql += tenantId || params.length > setValues.length ? ' AND' : ' WHERE';
      sql += ` ${key} = ?`;
      params.push(conditions[key]);
    });

    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });
}

/**
 * Delete records from a table
 */
function deleteQuery(table, conditions, tenantId) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    let sql = `DELETE FROM ${table}`;
    const params = [];

    if (tenantId) {
      sql += ' WHERE tenant_id = ?';
      params.push(tenantId);
    }

    Object.keys(conditions).forEach((key) => {
      sql += tenantId || params.length > 0 ? ' AND' : ' WHERE';
      sql += ` ${key} = ?`;
      params.push(conditions[key]);
    });

    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });
}

module.exports = {
  getQuery,
  getOneQuery,
  insertQuery,
  updateQuery,
  deleteQuery
};
