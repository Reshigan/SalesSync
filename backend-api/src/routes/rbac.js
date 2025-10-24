const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth-complete');

// Middleware to check if user has required role
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware to check if user has required permission
const hasPermission = (permission) => {
  return (req, res, next) => {
    const db = req.app.locals.db;

    db.get(
      `SELECT COUNT(*) as count FROM role_permissions rp
       JOIN roles r ON r.id = rp.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE r.name = ? AND p.name = ?`,
      [req.user.role, permission],
      (err, row) => {
        if (err || !row || row.count === 0) {
          return res.status(403).json({ error: 'Permission denied' });
        }
        next();
      }
    );
  };
};

// GET /api/rbac/roles - Get all roles
router.get('/roles', authenticateToken, hasRole('admin'), (req, res) => {
  const db = req.app.locals.db;

  db.all('SELECT * FROM roles ORDER BY name', [], (err, roles) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ success: true, roles });
  });
});

// POST /api/rbac/roles - Create new role
router.post('/roles', authenticateToken, hasRole('admin'), (req, res) => {
  const db = req.app.locals.db;
  const { name, display_name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Role name is required' });
  }

  db.run(
    'INSERT INTO roles (name, display_name, description) VALUES (?, ?, ?)',
    [name, display_name, description],
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ error: 'Role already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({
        success: true,
        role: {
          id: this.lastID,
          name,
          display_name,
          description
        }
      });
    }
  );
});

// PUT /api/rbac/roles/:id - Update role
router.put('/roles/:id', authenticateToken, hasRole('admin'), (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { display_name, description } = req.body;

  db.run(
    'UPDATE roles SET display_name = ?, description = ? WHERE id = ?',
    [display_name, description, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }

      res.json({ success: true, message: 'Role updated' });
    }
  );
});

// DELETE /api/rbac/roles/:id - Delete role
router.delete('/roles/:id', authenticateToken, hasRole('admin'), (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  // Check if role is in use
  db.get('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (row.count > 0) {
      return res.status(400).json({ error: 'Cannot delete role that is assigned to users' });
    }

    db.run('DELETE FROM roles WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }

      res.json({ success: true, message: 'Role deleted' });
    });
  });
});

// GET /api/rbac/permissions - Get all permissions
router.get('/permissions', authenticateToken, hasRole('admin'), (req, res) => {
  const db = req.app.locals.db;

  db.all('SELECT * FROM permissions ORDER BY module, name', [], (err, permissions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ success: true, permissions });
  });
});

// POST /api/rbac/permissions - Create new permission
router.post('/permissions', authenticateToken, hasRole('admin'), (req, res) => {
  const db = req.app.locals.db;
  const { name, display_name, module, description } = req.body;

  if (!name || !module) {
    return res.status(400).json({ error: 'Name and module are required' });
  }

  db.run(
    'INSERT INTO permissions (name, display_name, module, description) VALUES (?, ?, ?, ?)',
    [name, display_name, module, description],
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ error: 'Permission already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({
        success: true,
        permission: {
          id: this.lastID,
          name,
          display_name,
          module,
          description
        }
      });
    }
  );
});

// GET /api/rbac/roles/:roleId/permissions - Get permissions for a role
router.get('/roles/:roleId/permissions', authenticateToken, hasRole('admin', 'manager'), (req, res) => {
  const db = req.app.locals.db;
  const { roleId } = req.params;

  const query = `
    SELECT p.* FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.id
    WHERE rp.role_id = ?
    ORDER BY p.module, p.name
  `;

  db.all(query, [roleId], (err, permissions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ success: true, permissions });
  });
});

// POST /api/rbac/roles/:roleId/permissions - Assign permission to role
router.post('/roles/:roleId/permissions', authenticateToken, hasRole('admin'), (req, res) => {
  const db = req.app.locals.db;
  const { roleId } = req.params;
  const { permissionId } = req.body;

  if (!permissionId) {
    return res.status(400).json({ error: 'Permission ID is required' });
  }

  db.run(
    'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
    [roleId, permissionId],
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ error: 'Permission already assigned to role' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({
        success: true,
        message: 'Permission assigned to role'
      });
    }
  );
});

// DELETE /api/rbac/roles/:roleId/permissions/:permissionId - Remove permission from role
router.delete('/roles/:roleId/permissions/:permissionId', authenticateToken, hasRole('admin'), (req, res) => {
  const db = req.app.locals.db;
  const { roleId, permissionId } = req.params;

  db.run(
    'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
    [roleId, permissionId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Permission assignment not found' });
      }

      res.json({ success: true, message: 'Permission removed from role' });
    }
  );
});

// GET /api/rbac/users/:userId/permissions - Get all permissions for a user
router.get('/users/:userId/permissions', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { userId } = req.params;

  // Only allow users to see their own permissions unless admin
  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const query = `
    SELECT DISTINCT p.* FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.id
    JOIN roles r ON r.id = rp.role_id
    JOIN users u ON u.role = r.name
    WHERE u.id = ?
    ORDER BY p.module, p.name
  `;

  db.all(query, [userId], (err, permissions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ success: true, permissions });
  });
});

// POST /api/rbac/check-permission - Check if current user has a specific permission
router.post('/check-permission', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { permission } = req.body;

  if (!permission) {
    return res.status(400).json({ error: 'Permission name is required' });
  }

  const query = `
    SELECT COUNT(*) as count FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.id
    JOIN roles r ON r.id = rp.role_id
    WHERE r.name = ? AND p.name = ?
  `;

  db.get(query, [req.user.role, permission], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      success: true,
      hasPermission: row.count > 0
    });
  });
});

// POST /api/rbac/seed - Seed default roles and permissions
router.post('/seed', authenticateToken, hasRole('admin'), (req, res) => {
  const db = req.app.locals.db;

  // Default roles
  const roles = [
    { name: 'admin', display_name: 'Administrator', description: 'Full system access' },
    { name: 'manager', display_name: 'Manager', description: 'Manage team and operations' },
    { name: 'supervisor', display_name: 'Supervisor', description: 'Supervise field operations' },
    { name: 'agent', display_name: 'Field Agent', description: 'Field operations and sales' },
    { name: 'user', display_name: 'User', description: 'Basic user access' }
  ];

  // Default permissions
  const permissions = [
    // Orders
    { name: 'orders.view', display_name: 'View Orders', module: 'orders' },
    { name: 'orders.create', display_name: 'Create Orders', module: 'orders' },
    { name: 'orders.edit', display_name: 'Edit Orders', module: 'orders' },
    { name: 'orders.delete', display_name: 'Delete Orders', module: 'orders' },
    
    // Inventory
    { name: 'inventory.view', display_name: 'View Inventory', module: 'inventory' },
    { name: 'inventory.create', display_name: 'Create Inventory', module: 'inventory' },
    { name: 'inventory.edit', display_name: 'Edit Inventory', module: 'inventory' },
    { name: 'inventory.delete', display_name: 'Delete Inventory', module: 'inventory' },
    
    // Finance
    { name: 'finance.view', display_name: 'View Finance', module: 'finance' },
    { name: 'finance.create', display_name: 'Create Finance Records', module: 'finance' },
    { name: 'finance.edit', display_name: 'Edit Finance Records', module: 'finance' },
    { name: 'finance.approve', display_name: 'Approve Payments', module: 'finance' },
    
    // Users
    { name: 'users.view', display_name: 'View Users', module: 'users' },
    { name: 'users.create', display_name: 'Create Users', module: 'users' },
    { name: 'users.edit', display_name: 'Edit Users', module: 'users' },
    { name: 'users.delete', display_name: 'Delete Users', module: 'users' },
    
    // Reports
    { name: 'reports.view', display_name: 'View Reports', module: 'reports' },
    { name: 'reports.export', display_name: 'Export Reports', module: 'reports' },
    
    // Settings
    { name: 'settings.view', display_name: 'View Settings', module: 'settings' },
    { name: 'settings.edit', display_name: 'Edit Settings', module: 'settings' }
  ];

  // Insert roles
  let insertedRoles = 0;
  roles.forEach(role => {
    db.run(
      'INSERT OR IGNORE INTO roles (name, display_name, description) VALUES (?, ?, ?)',
      [role.name, role.display_name, role.description],
      function(err) {
        if (!err && this.changes > 0) insertedRoles++;
      }
    );
  });

  // Insert permissions
  let insertedPermissions = 0;
  permissions.forEach(perm => {
    db.run(
      'INSERT OR IGNORE INTO permissions (name, display_name, module, description) VALUES (?, ?, ?, ?)',
      [perm.name, perm.display_name, perm.module, perm.description],
      function(err) {
        if (!err && this.changes > 0) insertedPermissions++;
      }
    );
  });

  setTimeout(() => {
    res.json({
      success: true,
      message: 'RBAC seeded successfully',
      inserted: {
        roles: insertedRoles,
        permissions: insertedPermissions
      }
    });
  }, 1000);
});

module.exports = router;
module.exports.hasRole = hasRole;
module.exports.hasPermission = hasPermission;
