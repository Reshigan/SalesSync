const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const { v4: uuidv4 } = require('uuid');

router.get('/roles', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const roles = await getQuery(`
    SELECT DISTINCT role as name, role as code
    FROM users
    WHERE tenant_id = $1
    ORDER BY role
  `, [tenantId]);
  
  const standardRoles = [
    { name: 'admin', code: 'admin', description: 'System Administrator', permissions: ['*'] },
    { name: 'manager', code: 'manager', description: 'Manager', permissions: ['dashboard.view', 'orders.*', 'customers.*', 'products.*', 'agents.view', 'visits.view', 'reports.*'] },
    { name: 'agent', code: 'agent', description: 'Field Agent', permissions: ['dashboard.view', 'visits.*', 'customers.view', 'orders.create'] },
    { name: 'sales_agent', code: 'sales_agent', description: 'Sales Agent', permissions: ['dashboard.view', 'visits.*', 'customers.*', 'orders.*'] },
    { name: 'field_agent', code: 'field_agent', description: 'Field Agent', permissions: ['dashboard.view', 'visits.*', 'customers.view', 'orders.create'] },
    { name: 'van_sales_agent', code: 'van_sales_agent', description: 'Van Sales Agent', permissions: ['dashboard.view', 'visits.*', 'customers.*', 'orders.*', 'vans.view', 'inventory.view'] },
    { name: 'merchandiser', code: 'merchandiser', description: 'Merchandiser', permissions: ['dashboard.view', 'visits.*', 'products.view', 'inventory.view'] },
    { name: 'promoter', code: 'promoter', description: 'Promoter', permissions: ['dashboard.view', 'visits.*', 'customers.view', 'campaigns.view'] },
    { name: 'supervisor', code: 'supervisor', description: 'Supervisor', permissions: ['dashboard.view', 'orders.view', 'customers.view', 'agents.view', 'visits.view', 'reports.view'] }
  ];
  
  const existingRoles = roles.map(r => r.name);
  const allRoles = [
    ...roles.map(r => {
      const standardRole = standardRoles.find(sr => sr.code === r.code);
      return {
        ...r,
        description: standardRole?.description || r.name,
        permissions: standardRole?.permissions || []
      };
    }),
    ...standardRoles.filter(sr => !existingRoles.includes(sr.name))
  ];
  
  res.json({ success: true, data: allRoles });
}));

router.get('/permissions', asyncHandler(async (req, res) => {
  const permissions = [
    { module: 'dashboard', actions: ['view'], name: 'Dashboard Access', description: 'View dashboard and analytics' },
    { module: 'orders', actions: ['view', 'create', 'edit', 'delete'], name: 'Orders Management', description: 'Manage customer orders' },
    { module: 'customers', actions: ['view', 'create', 'edit', 'delete'], name: 'Customers Management', description: 'Manage customer records' },
    { module: 'products', actions: ['view', 'create', 'edit', 'delete'], name: 'Products Management', description: 'Manage product catalog' },
    { module: 'agents', actions: ['view', 'create', 'edit', 'delete'], name: 'Agents Management', description: 'Manage field agents' },
    { module: 'visits', actions: ['view', 'create', 'edit', 'delete'], name: 'Visits Management', description: 'Manage customer visits' },
    { module: 'routes', actions: ['view', 'create', 'edit', 'delete'], name: 'Routes Management', description: 'Manage sales routes' },
    { module: 'vans', actions: ['view', 'create', 'edit', 'delete'], name: 'Vans Management', description: 'Manage van sales' },
    { module: 'inventory', actions: ['view', 'create', 'edit', 'delete'], name: 'Inventory Management', description: 'Manage inventory levels' },
    { module: 'finance', actions: ['view', 'create', 'edit', 'delete'], name: 'Finance Management', description: 'Manage financial records' },
    { module: 'reports', actions: ['view', 'export'], name: 'Reports Access', description: 'View and export reports' },
    { module: 'settings', actions: ['view', 'edit'], name: 'Settings Management', description: 'Manage system settings' },
    { module: 'users', actions: ['view', 'create', 'edit', 'delete'], name: 'Users Management', description: 'Manage user accounts' },
    { module: 'campaigns', actions: ['view', 'create', 'edit', 'delete'], name: 'Campaigns Management', description: 'Manage marketing campaigns' }
  ];
  
  res.json({ success: true, data: permissions });
}));

router.get('/role-permissions/:role', asyncHandler(async (req, res) => {
  const { role } = req.params;
  
  const rolePermissions = {
    admin: ['*'],
    manager: ['dashboard.view', 'orders.*', 'customers.*', 'products.*', 'agents.view', 'visits.view', 'reports.*', 'finance.view', 'inventory.view'],
    agent: ['dashboard.view', 'visits.*', 'customers.view', 'orders.create'],
    sales_agent: ['dashboard.view', 'visits.*', 'customers.*', 'orders.*'],
    field_agent: ['dashboard.view', 'visits.*', 'customers.view', 'orders.create'],
    van_sales_agent: ['dashboard.view', 'visits.*', 'customers.*', 'orders.*', 'vans.view', 'inventory.view'],
    merchandiser: ['dashboard.view', 'visits.*', 'products.view', 'inventory.view'],
    promoter: ['dashboard.view', 'visits.*', 'customers.view', 'campaigns.view'],
    supervisor: ['dashboard.view', 'orders.view', 'customers.view', 'agents.view', 'visits.view', 'reports.view']
  };
  
  res.json({
    success: true,
    data: {
      role,
      permissions: rolePermissions[role] || []
    }
  });
}));

router.get('/users/:userId/permissions', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const tenantId = req.tenantId;
  
  const user = await getOneQuery(`
    SELECT id, role, first_name, last_name, email
    FROM users
    WHERE id = $1 AND tenant_id = $2
  `, [userId, tenantId]);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  const rolePermissions = {
    admin: ['*'],
    manager: ['dashboard.view', 'orders.*', 'customers.*', 'products.*', 'agents.view', 'visits.view', 'reports.*'],
    agent: ['dashboard.view', 'visits.*', 'customers.view', 'orders.create'],
    sales_agent: ['dashboard.view', 'visits.*', 'customers.*', 'orders.*'],
    field_agent: ['dashboard.view', 'visits.*', 'customers.view', 'orders.create'],
    van_sales_agent: ['dashboard.view', 'visits.*', 'customers.*', 'orders.*', 'vans.view'],
    merchandiser: ['dashboard.view', 'visits.*', 'products.view'],
    promoter: ['dashboard.view', 'visits.*', 'customers.view'],
    supervisor: ['dashboard.view', 'orders.view', 'customers.view', 'agents.view', 'visits.view', 'reports.view']
  };
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role
      },
      permissions: rolePermissions[user.role] || []
    }
  });
}));

module.exports = router;
