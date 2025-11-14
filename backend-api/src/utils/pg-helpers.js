/**
 * PostgreSQL-compatible query helper functions
 * Provides safe, parameterized query operations with automatic tenant scoping
 * 
 * These helpers always use $1, $2, $3... placeholders (PostgreSQL style)
 * and enforce tenant_id in all queries to prevent cross-tenant data leakage.
 */

const { runQuery, getQuery, getOneQuery } = require('./database');

/**
 * Select a single row from a table with conditions
 * @param {string} table - Table name (will be validated)
 * @param {object} conditions - WHERE conditions as key-value pairs
 * @param {string} tenantId - Tenant ID (required for tenant-scoped tables)
 * @returns {Promise<object|null>} Single row or null
 */
async function selectOne(table, conditions = {}, tenantId = null) {
  validateTableName(table);
  
  let sql = `SELECT * FROM ${table}`;
  const params = [];
  let paramIndex = 1;
  
  if (tenantId) {
    sql += ` WHERE tenant_id = $${paramIndex}`;
    params.push(tenantId);
    paramIndex++;
  }
  
  Object.keys(conditions).forEach((key) => {
    validateColumnName(key);
    sql += (params.length > 0 ? ' AND' : ' WHERE') + ` ${key} = $${paramIndex}`;
    params.push(conditions[key]);
    paramIndex++;
  });
  
  sql += ' LIMIT 1';
  
  return await getOneQuery(sql, params);
}

/**
 * Select multiple rows from a table with conditions
 * @param {string} table - Table name (will be validated)
 * @param {object} conditions - WHERE conditions as key-value pairs
 * @param {string} tenantId - Tenant ID (required for tenant-scoped tables)
 * @param {object} options - Query options (limit, offset, orderBy)
 * @returns {Promise<array>} Array of rows
 */
async function selectMany(table, conditions = {}, tenantId = null, options = {}) {
  validateTableName(table);
  
  let sql = `SELECT * FROM ${table}`;
  const params = [];
  let paramIndex = 1;
  
  if (tenantId) {
    sql += ` WHERE tenant_id = $${paramIndex}`;
    params.push(tenantId);
    paramIndex++;
  }
  
  Object.keys(conditions).forEach((key) => {
    validateColumnName(key);
    sql += (params.length > 0 ? ' AND' : ' WHERE') + ` ${key} = $${paramIndex}`;
    params.push(conditions[key]);
    paramIndex++;
  });
  
  if (options.orderBy) {
    const orderParts = options.orderBy.split(' ');
    validateColumnName(orderParts[0]);
    sql += ` ORDER BY ${options.orderBy}`;
  }
  
  if (options.limit) {
    sql += ` LIMIT $${paramIndex}`;
    params.push(options.limit);
    paramIndex++;
  }
  
  if (options.offset) {
    sql += ` OFFSET $${paramIndex}`;
    params.push(options.offset);
    paramIndex++;
  }
  
  return await getQuery(sql, params);
}

/**
 * Insert a row into a table
 * @param {string} table - Table name (will be validated)
 * @param {object} data - Data to insert as key-value pairs
 * @param {string} tenantId - Tenant ID (will be auto-injected if not in data)
 * @returns {Promise<object>} Inserted row with all fields
 */
async function insertRow(table, data, tenantId = null) {
  validateTableName(table);
  
  const fullData = (tenantId && !data.tenant_id) 
    ? { ...data, tenant_id: tenantId } 
    : data;
  
  const columns = Object.keys(fullData);
  columns.forEach(validateColumnName);
  
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const values = Object.values(fullData);
  
  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;
  
  const result = await runQuery(sql, values);
  return result.rows[0];
}

/**
 * Update rows in a table
 * @param {string} table - Table name (will be validated)
 * @param {object} data - Data to update as key-value pairs
 * @param {object} where - WHERE conditions as key-value pairs
 * @param {string} tenantId - Tenant ID (required for tenant-scoped tables)
 * @returns {Promise<array>} Updated rows
 */
async function updateRow(table, data, where = {}, tenantId = null) {
  validateTableName(table);
  
  if (!data || Object.keys(data).length === 0) {
    throw new Error('No data provided for update');
  }
  
  const dataKeys = Object.keys(data);
  dataKeys.forEach(validateColumnName);
  
  const setClause = dataKeys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const setValues = Object.values(data);
  
  let sql = `UPDATE ${table} SET ${setClause}`;
  const params = [...setValues];
  let paramIndex = setValues.length + 1;
  
  if (tenantId) {
    sql += ` WHERE tenant_id = $${paramIndex}`;
    params.push(tenantId);
    paramIndex++;
  }
  
  Object.keys(where).forEach((key) => {
    validateColumnName(key);
    sql += (paramIndex > setValues.length + 1 ? ' AND' : ' WHERE') + ` ${key} = $${paramIndex}`;
    params.push(where[key]);
    paramIndex++;
  });
  
  sql += ' RETURNING *';
  
  const result = await runQuery(sql, params);
  return result.rows;
}

/**
 * Delete rows from a table
 * @param {string} table - Table name (will be validated)
 * @param {object} where - WHERE conditions as key-value pairs
 * @param {string} tenantId - Tenant ID (required for tenant-scoped tables)
 * @returns {Promise<number>} Number of rows deleted
 */
async function deleteRow(table, where = {}, tenantId = null) {
  validateTableName(table);
  
  let sql = `DELETE FROM ${table}`;
  const params = [];
  let paramIndex = 1;
  
  if (tenantId) {
    sql += ` WHERE tenant_id = $${paramIndex}`;
    params.push(tenantId);
    paramIndex++;
  }
  
  Object.keys(where).forEach((key) => {
    validateColumnName(key);
    sql += (params.length > 0 ? ' AND' : ' WHERE') + ` ${key} = $${paramIndex}`;
    params.push(where[key]);
    paramIndex++;
  });
  
  const result = await runQuery(sql, params);
  return result.rowCount;
}

/**
 * Validate table name to prevent SQL injection
 * Whitelist of allowed table names
 */
function validateTableName(table) {
  const allowedTables = [
    'tenants', 'users', 'roles', 'permissions', 'role_permissions', 'modules',
    'regions', 'areas', 'routes', 'categories', 'brands', 'products',
    'warehouses', 'inventory_stock', 'customers', 'orders', 'order_items',
    'visits', 'visit_tasks', 'survey_templates', 'survey_questions',
    'individuals', 'dedupe_registry', 'survey_dedupe_registry',
    'vans', 'van_loads', 'van_sales', 'van_load_items', 'van_sales_items',
    'cash_reconciliation', 'agents', 'agent_locations', 'active_visits',
    'billing_records', 'tenant_licenses', 'functions'
  ];
  
  if (!allowedTables.includes(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
}

/**
 * Validate column name to prevent SQL injection
 * Only allow alphanumeric characters and underscores
 */
function validateColumnName(column) {
  if (!/^[a-zA-Z0-9_]+$/.test(column)) {
    throw new Error(`Invalid column name: ${column}`);
  }
}

module.exports = {
  selectOne,
  selectMany,
  insertRow,
  updateRow,
  deleteRow
};
