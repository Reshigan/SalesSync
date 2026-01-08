-- RBAC (Role-Based Access Control) Tables Migration
-- Run this migration to add roles, permissions, and user role assignments

-- Permissions table - defines all available permissions in the system
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Roles table - defines roles that can be assigned to users
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_system_role INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(tenant_id, name)
);

-- Role permissions - maps permissions to roles
CREATE TABLE IF NOT EXISTS role_permissions (
    id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- User roles - maps roles to users (supports composite roles - users can have multiple roles)
CREATE TABLE IF NOT EXISTS user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    assigned_by TEXT,
    assigned_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE(user_id, role_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);

-- Insert standard permissions
INSERT OR IGNORE INTO permissions (id, name, description, module, action) VALUES
-- Customer permissions
('perm-customers-view', 'customers:view', 'View customers', 'customers', 'view'),
('perm-customers-create', 'customers:create', 'Create customers', 'customers', 'create'),
('perm-customers-edit', 'customers:edit', 'Edit customers', 'customers', 'edit'),
('perm-customers-delete', 'customers:delete', 'Delete customers', 'customers', 'delete'),

-- Product permissions
('perm-products-view', 'products:view', 'View products', 'products', 'view'),
('perm-products-create', 'products:create', 'Create products', 'products', 'create'),
('perm-products-edit', 'products:edit', 'Edit products', 'products', 'edit'),
('perm-products-delete', 'products:delete', 'Delete products', 'products', 'delete'),

-- Order permissions
('perm-orders-view', 'orders:view', 'View orders', 'orders', 'view'),
('perm-orders-create', 'orders:create', 'Create orders', 'orders', 'create'),
('perm-orders-edit', 'orders:edit', 'Edit orders', 'orders', 'edit'),
('perm-orders-delete', 'orders:delete', 'Delete orders', 'orders', 'delete'),
('perm-orders-approve', 'orders:approve', 'Approve orders', 'orders', 'approve'),

-- Van Sales permissions
('perm-vansales-view', 'van-sales:view', 'View van sales', 'van-sales', 'view'),
('perm-vansales-create', 'van-sales:create', 'Create van sales', 'van-sales', 'create'),
('perm-vansales-edit', 'van-sales:edit', 'Edit van sales', 'van-sales', 'edit'),
('perm-vansales-delete', 'van-sales:delete', 'Delete van sales', 'van-sales', 'delete'),

-- Visit permissions
('perm-visits-view', 'visits:view', 'View visits', 'visits', 'view'),
('perm-visits-create', 'visits:create', 'Create visits', 'visits', 'create'),
('perm-visits-edit', 'visits:edit', 'Edit visits', 'visits', 'edit'),
('perm-visits-delete', 'visits:delete', 'Delete visits', 'visits', 'delete'),

-- Inventory permissions
('perm-inventory-view', 'inventory:view', 'View inventory', 'inventory', 'view'),
('perm-inventory-manage', 'inventory:manage', 'Manage inventory', 'inventory', 'manage'),
('perm-inventory-adjust', 'inventory:adjust', 'Adjust inventory', 'inventory', 'adjust'),

-- Trade Marketing permissions
('perm-trademarketing-view', 'trade-marketing:view', 'View trade marketing', 'trade-marketing', 'view'),
('perm-trademarketing-create', 'trade-marketing:create', 'Create campaigns', 'trade-marketing', 'create'),
('perm-trademarketing-edit', 'trade-marketing:edit', 'Edit campaigns', 'trade-marketing', 'edit'),
('perm-trademarketing-delete', 'trade-marketing:delete', 'Delete campaigns', 'trade-marketing', 'delete'),

-- Field Marketing permissions
('perm-fieldmarketing-view', 'field-marketing:view', 'View field marketing', 'field-marketing', 'view'),
('perm-fieldmarketing-create', 'field-marketing:create', 'Create field activities', 'field-marketing', 'create'),
('perm-fieldmarketing-edit', 'field-marketing:edit', 'Edit field activities', 'field-marketing', 'edit'),
('perm-fieldmarketing-delete', 'field-marketing:delete', 'Delete field activities', 'field-marketing', 'delete'),

-- Competitor Analysis permissions
('perm-competitors-view', 'competitors:view', 'View competitors', 'competitors', 'view'),
('perm-competitors-create', 'competitors:create', 'Create competitors', 'competitors', 'create'),
('perm-competitors-edit', 'competitors:edit', 'Edit competitors', 'competitors', 'edit'),
('perm-competitors-delete', 'competitors:delete', 'Delete competitors', 'competitors', 'delete'),

-- Analytics permissions
('perm-analytics-view', 'analytics:view', 'View analytics', 'analytics', 'view'),
('perm-analytics-export', 'analytics:export', 'Export analytics', 'analytics', 'export'),

-- Reports permissions
('perm-reports-view', 'reports:view', 'View reports', 'reports', 'view'),
('perm-reports-create', 'reports:create', 'Create reports', 'reports', 'create'),
('perm-reports-export', 'reports:export', 'Export reports', 'reports', 'export'),

-- User Management permissions
('perm-users-view', 'users:view', 'View users', 'users', 'view'),
('perm-users-create', 'users:create', 'Create users', 'users', 'create'),
('perm-users-edit', 'users:edit', 'Edit users', 'users', 'edit'),
('perm-users-delete', 'users:delete', 'Delete users', 'users', 'delete'),

-- Role Management permissions
('perm-roles-view', 'roles:view', 'View roles', 'roles', 'view'),
('perm-roles-create', 'roles:create', 'Create roles', 'roles', 'create'),
('perm-roles-edit', 'roles:edit', 'Edit roles', 'roles', 'edit'),
('perm-roles-delete', 'roles:delete', 'Delete roles', 'roles', 'delete'),
('perm-roles-assign', 'roles:assign', 'Assign roles to users', 'roles', 'assign'),

-- Settings permissions
('perm-settings-view', 'settings:view', 'View settings', 'settings', 'view'),
('perm-settings-edit', 'settings:edit', 'Edit settings', 'settings', 'edit'),

-- Commission permissions
('perm-commissions-view', 'commissions:view', 'View commissions', 'commissions', 'view'),
('perm-commissions-manage', 'commissions:manage', 'Manage commissions', 'commissions', 'manage'),
('perm-commissions-approve', 'commissions:approve', 'Approve commissions', 'commissions', 'approve');

-- Insert standard system roles (will be created per tenant)
-- Note: These are templates - actual roles are created per tenant via the API
