/**
 * User Service
 * Business logic for user management
 */

const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const { AppError } = require('../middleware/errorHandler');
const bcrypt = require('bcrypt');

class UserService {
  /**
   * Get all users with optional filters
   */
  async getUsers(tenantId, options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      role = '',
      is_active = null,
      department = '',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = options;

    const offset = (page - 1) * limit;
    const params = [tenantId];
    let whereClause = 'WHERE u.tenant_id = ?';

    if (search) {
      whereClause += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (role) {
      whereClause += ' AND u.role = ?';
      params.push(role);
    }

    if (is_active !== null) {
      whereClause += ' AND u.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (department) {
      whereClause += ' AND u.department = ?';
      params.push(department);
    }

    const validSortColumns = ['name', 'email', 'created_at', 'role'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const countResult = await getQuery(countQuery, params);
    const total = countResult[0]?.total || 0;

    const dataQuery = `
      SELECT 
        u.id, u.email, u.name, u.role, u.phone, u.department,
        u.is_active, u.created_at, u.updated_at, u.last_login
      FROM users u
      ${whereClause}
      ORDER BY u.${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const users = await getQuery(dataQuery, params);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(tenantId, userId) {
    const user = await getOneQuery(
      `SELECT id, email, name, role, phone, department, is_active, 
              created_at, updated_at, last_login
       FROM users
       WHERE id = ? AND tenant_id = ?`,
      [userId, tenantId]
    );

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(tenantId, email) {
    return getOneQuery(
      `SELECT * FROM users WHERE email = ? AND tenant_id = ?`,
      [email, tenantId]
    );
  }

  /**
   * Create a new user
   */
  async createUser(tenantId, data) {
    const id = require('crypto').randomUUID();
    const now = new Date().toISOString();

    const {
      email, password, name, role = 'viewer', phone, department, is_active = true
    } = data;

    const existingUser = await this.getUserByEmail(tenantId, email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await runQuery(
      `INSERT INTO users (
        id, tenant_id, email, password, name, role, phone, department,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tenantId, email, hashedPassword, name, role,
        phone || null, department || null, is_active ? 1 : 0, now, now
      ]
    );

    return this.getUserById(tenantId, id);
  }

  /**
   * Update a user
   */
  async updateUser(tenantId, userId, data) {
    const existing = await this.getUserById(tenantId, userId);
    const now = new Date().toISOString();

    const fields = [];
    const values = [];

    const allowedFields = ['email', 'name', 'role', 'phone', 'department', 'is_active'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(field === 'is_active' ? (data[field] ? 1 : 0) : data[field]);
      }
    }

    if (data.email && data.email !== existing.email) {
      const existingWithEmail = await this.getUserByEmail(tenantId, data.email);
      if (existingWithEmail && existingWithEmail.id !== userId) {
        throw new AppError('Email already in use', 409, 'EMAIL_EXISTS');
      }
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(userId, tenantId);

    await runQuery(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );

    return this.getUserById(tenantId, userId);
  }

  /**
   * Delete a user (soft delete)
   */
  async deleteUser(tenantId, userId) {
    await this.getUserById(tenantId, userId);

    await runQuery(
      `UPDATE users SET is_active = 0, updated_at = ? WHERE id = ? AND tenant_id = ?`,
      [new Date().toISOString(), userId, tenantId]
    );

    return { success: true, message: 'User deleted successfully' };
  }

  /**
   * Change user password
   */
  async changePassword(tenantId, userId, currentPassword, newPassword) {
    const user = await getOneQuery(
      `SELECT * FROM users WHERE id = ? AND tenant_id = ?`,
      [userId, tenantId]
    );

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await runQuery(
      `UPDATE users SET password = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`,
      [hashedPassword, new Date().toISOString(), userId, tenantId]
    );

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Reset user password (admin action)
   */
  async resetPassword(tenantId, userId, newPassword) {
    await this.getUserById(tenantId, userId);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await runQuery(
      `UPDATE users SET password = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`,
      [hashedPassword, new Date().toISOString(), userId, tenantId]
    );

    return { success: true, message: 'Password reset successfully' };
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(tenantId, userId) {
    await runQuery(
      `UPDATE users SET last_login = ? WHERE id = ? AND tenant_id = ?`,
      [new Date().toISOString(), userId, tenantId]
    );
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(tenantId, userId) {
    const user = await this.getUserById(tenantId, userId);

    const permissions = await getQuery(
      `SELECT rp.*, m.name as module_name, f.name as function_name
       FROM role_permissions rp
       LEFT JOIN modules m ON rp.module_id = m.id
       LEFT JOIN functions f ON rp.function_id = f.id
       WHERE rp.role = ? AND rp.tenant_id = ?`,
      [user.role, tenantId]
    );

    return {
      user,
      permissions
    };
  }

  /**
   * Get users by role
   */
  async getUsersByRole(tenantId, role) {
    return getQuery(
      `SELECT id, email, name, role, phone, department, is_active
       FROM users
       WHERE role = ? AND tenant_id = ? AND is_active = 1
       ORDER BY name`,
      [role, tenantId]
    );
  }

  /**
   * Get field agents
   */
  async getFieldAgents(tenantId) {
    return getQuery(
      `SELECT u.id, u.email, u.name, u.phone,
        (SELECT COUNT(*) FROM visits WHERE agent_id = u.id AND DATE(check_in_time) = DATE('now')) as visits_today,
        (SELECT COUNT(*) FROM orders WHERE agent_id = u.id AND DATE(created_at) = DATE('now')) as orders_today
       FROM users u
       WHERE u.role = 'agent' AND u.tenant_id = ? AND u.is_active = 1
       ORDER BY u.name`,
      [tenantId]
    );
  }

  /**
   * Bulk import users
   */
  async bulkImport(tenantId, users) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const userData of users) {
      try {
        await this.createUser(tenantId, userData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          data: { ...userData, password: '[REDACTED]' },
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new UserService();
