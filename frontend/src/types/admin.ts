// Admin Module Type Definitions

export interface User {
  id: string
  name: string
  email: string
  phone: string
  roles: Role[] // Support multiple roles per user
  tenant?: string
  location?: string
  warehouse?: string
  status: 'active' | 'inactive' | 'suspended'
  lastLogin?: string
  createdAt: string
  updatedAt: string
  avatar?: string
}

export interface Role {
  id: string
  name: string
  code: string
  description: string
  permissions: Permission[]
  userCount: number
  status: 'active' | 'inactive'
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  module: string
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export'
  resource: string
  description: string
}

export interface Warehouse {
  id: string
  name: string
  code: string
  type: 'main' | 'regional' | 'transit' | 'retail'
  address: string
  city: string
  province: string
  postalCode: string
  country: string
  manager?: User
  capacity: number
  currentStock: number
  status: 'active' | 'inactive' | 'maintenance'
  phone: string
  email: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  createdAt: string
  updatedAt: string
}

// Default System Roles
export const DEFAULT_ROLES: Omit<Role, 'id' | 'userCount' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'System Administrator',
    code: 'SYSTEM_ADMIN',
    description: 'Full system access with ability to manage all modules, users, and settings',
    permissions: [],
    status: 'active',
    isDefault: true
  },
  {
    name: 'Back Office Manager',
    code: 'BACK_OFFICE_MANAGER',
    description: 'Manage invoices, payments, returns, commissions, and KYC',
    permissions: [],
    status: 'active',
    isDefault: true
  },
  {
    name: 'Warehouse Manager',
    code: 'WAREHOUSE_MANAGER',
    description: 'Manage warehouse operations, inventory, stock counts, GRN, and movements',
    permissions: [],
    status: 'active',
    isDefault: true
  },
  {
    name: 'Sales Manager',
    code: 'SALES_MANAGER',
    description: 'Manage sales team, orders, customers, and sales reports',
    permissions: [],
    status: 'active',
    isDefault: true
  },
  {
    name: 'Van Sales Agent',
    code: 'VAN_SALES_AGENT',
    description: 'Mobile sales operations, route management, and cash collection',
    permissions: [],
    status: 'active',
    isDefault: true
  },
  {
    name: 'Promotional Agent',
    code: 'PROMOTIONAL_AGENT',
    description: 'Promotional activities, consumer activation, and brand campaigns',
    permissions: [],
    status: 'active',
    isDefault: true
  },
  {
    name: 'Trade Marketing Agent',
    code: 'TRADE_MARKETING_AGENT',
    description: 'Merchandising, shelf audits, planograms, and competitive intelligence',
    permissions: [],
    status: 'active',
    isDefault: true
  },
  {
    name: 'Field Marketing Agent',
    code: 'FIELD_MARKETING_AGENT',
    description: 'Field surveys, board installations, and customer visits',
    permissions: [],
    status: 'active',
    isDefault: true
  },
  {
    name: 'Finance Manager',
    code: 'FINANCE_MANAGER',
    description: 'Financial reports, payments, commissions, and accounting',
    permissions: [],
    status: 'active',
    isDefault: true
  },
  {
    name: 'Inventory Manager',
    code: 'INVENTORY_MANAGER',
    description: 'Inventory control, stock management, and warehouse coordination',
    permissions: [],
    status: 'active',
    isDefault: true
  }
]

// Permission Modules
export const PERMISSION_MODULES = [
  { module: 'dashboard', label: 'Dashboard', actions: ['read'] },
  { module: 'orders', label: 'Orders', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
  { module: 'customers', label: 'Customers', actions: ['create', 'read', 'update', 'delete', 'export'] },
  { module: 'products', label: 'Products', actions: ['create', 'read', 'update', 'delete', 'export'] },
  { module: 'inventory', label: 'Inventory', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
  { module: 'warehouse', label: 'Warehouse', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
  { module: 'van_sales', label: 'Van Sales', actions: ['create', 'read', 'update', 'delete', 'export'] },
  { module: 'promotions', label: 'Promotions', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
  { module: 'merchandising', label: 'Merchandising', actions: ['create', 'read', 'update', 'delete', 'export'] },
  { module: 'consumer_activation', label: 'Consumer Activation', actions: ['create', 'read', 'update', 'delete', 'export'] },
  { module: 'surveys', label: 'Surveys', actions: ['create', 'read', 'update', 'delete', 'export'] },
  { module: 'boards', label: 'Board Installations', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
  { module: 'visits', label: 'Customer Visits', actions: ['create', 'read', 'update', 'delete', 'export'] },
  { module: 'invoices', label: 'Invoices', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
  { module: 'payments', label: 'Payments', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
  { module: 'commissions', label: 'Commissions', actions: ['create', 'read', 'update', 'approve', 'export'] },
  { module: 'kyc', label: 'KYC Management', actions: ['read', 'approve', 'export'] },
  { module: 'users', label: 'User Management', actions: ['create', 'read', 'update', 'delete'] },
  { module: 'roles', label: 'Roles & Permissions', actions: ['create', 'read', 'update', 'delete'] },
  { module: 'warehouses', label: 'Warehouse Management', actions: ['create', 'read', 'update', 'delete'] },
  { module: 'settings', label: 'System Settings', actions: ['read', 'update'] },
  { module: 'reports', label: 'Reports', actions: ['read', 'export'] }
]
