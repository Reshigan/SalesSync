-- Migration: Role-Based Access Control (RBAC)
-- Date: 2025-10-23
-- Description: Complete RBAC system with roles, permissions, and assignments

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- Insert default roles
INSERT OR IGNORE INTO roles (name, display_name, description) VALUES
  ('admin', 'Administrator', 'Full system access with all permissions'),
  ('manager', 'Manager', 'Manage team, operations, and view reports'),
  ('supervisor', 'Supervisor', 'Supervise field operations and agents'),
  ('agent', 'Field Agent', 'Perform field operations, sales, and visits'),
  ('user', 'User', 'Basic user access with limited permissions');

-- Insert default permissions
INSERT OR IGNORE INTO permissions (name, display_name, module) VALUES
  -- Orders permissions
  ('orders.view', 'View Orders', 'orders'),
  ('orders.create', 'Create Orders', 'orders'),
  ('orders.edit', 'Edit Orders', 'orders'),
  ('orders.delete', 'Delete Orders', 'orders'),
  ('orders.approve', 'Approve Orders', 'orders'),
  
  -- Inventory permissions
  ('inventory.view', 'View Inventory', 'inventory'),
  ('inventory.create', 'Create Inventory', 'inventory'),
  ('inventory.edit', 'Edit Inventory', 'inventory'),
  ('inventory.delete', 'Delete Inventory', 'inventory'),
  ('inventory.adjust', 'Adjust Inventory', 'inventory'),
  
  -- Finance permissions
  ('finance.view', 'View Finance', 'finance'),
  ('finance.create', 'Create Finance Records', 'finance'),
  ('finance.edit', 'Edit Finance Records', 'finance'),
  ('finance.delete', 'Delete Finance Records', 'finance'),
  ('finance.approve', 'Approve Payments', 'finance'),
  
  -- Customer permissions
  ('customers.view', 'View Customers', 'customers'),
  ('customers.create', 'Create Customers', 'customers'),
  ('customers.edit', 'Edit Customers', 'customers'),
  ('customers.delete', 'Delete Customers', 'customers'),
  
  -- Users permissions
  ('users.view', 'View Users', 'users'),
  ('users.create', 'Create Users', 'users'),
  ('users.edit', 'Edit Users', 'users'),
  ('users.delete', 'Delete Users', 'users'),
  ('users.manage_roles', 'Manage User Roles', 'users'),
  
  -- Reports permissions
  ('reports.view', 'View Reports', 'reports'),
  ('reports.create', 'Create Reports', 'reports'),
  ('reports.export', 'Export Reports', 'reports'),
  ('reports.schedule', 'Schedule Reports', 'reports'),
  
  -- Settings permissions
  ('settings.view', 'View Settings', 'settings'),
  ('settings.edit', 'Edit Settings', 'settings'),
  ('settings.manage_system', 'Manage System Settings', 'settings'),
  
  -- Warehouse permissions
  ('warehouse.view', 'View Warehouse', 'warehouse'),
  ('warehouse.create', 'Create Warehouse Records', 'warehouse'),
  ('warehouse.edit', 'Edit Warehouse Records', 'warehouse'),
  ('warehouse.transfer', 'Transfer Stock', 'warehouse'),
  
  -- Field Operations permissions
  ('field_ops.view', 'View Field Operations', 'field_ops'),
  ('field_ops.create', 'Create Field Operations', 'field_ops'),
  ('field_ops.edit', 'Edit Field Operations', 'field_ops'),
  ('field_ops.track', 'Track Field Agents', 'field_ops'),
  
  -- CRM permissions
  ('crm.view', 'View CRM', 'crm'),
  ('crm.create', 'Create CRM Records', 'crm'),
  ('crm.edit', 'Edit CRM Records', 'crm'),
  ('crm.delete', 'Delete CRM Records', 'crm'),
  
  -- Marketing permissions
  ('marketing.view', 'View Marketing', 'marketing'),
  ('marketing.create', 'Create Campaigns', 'marketing'),
  ('marketing.edit', 'Edit Campaigns', 'marketing'),
  ('marketing.approve', 'Approve Campaigns', 'marketing'),
  
  -- Audit permissions
  ('audit.view', 'View Audit Logs', 'audit'),
  ('audit.export', 'Export Audit Logs', 'audit');
