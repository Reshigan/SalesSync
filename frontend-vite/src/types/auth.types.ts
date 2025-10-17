export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'manager' | 'field_agent' | 'sales_rep'
  department?: string
  phone?: string
  avatar?: string
  status: 'active' | 'inactive' | 'suspended'
  permissions: string[]
  last_login?: string
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  email: string
  password: string
  remember_me?: boolean
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: 'Bearer'
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

export interface RefreshTokenResponse {
  access_token: string
  expires_in: number
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  password_confirmation: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

export interface AuthError {
  code: string
  message: string
  details?: Record<string, string[]>
}

// Role-based permissions
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  FIELD_AGENT: 'field_agent',
  SALES_REP: 'sales_rep',
} as const

export const PERMISSIONS = {
  // User management
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  
  // Customer management
  VIEW_CUSTOMERS: 'view_customers',
  CREATE_CUSTOMERS: 'create_customers',
  EDIT_CUSTOMERS: 'edit_customers',
  DELETE_CUSTOMERS: 'delete_customers',
  
  // Order management
  VIEW_ORDERS: 'view_orders',
  CREATE_ORDERS: 'create_orders',
  EDIT_ORDERS: 'edit_orders',
  DELETE_ORDERS: 'delete_orders',
  PROCESS_ORDERS: 'process_orders',
  
  // Product management
  VIEW_PRODUCTS: 'view_products',
  CREATE_PRODUCTS: 'create_products',
  EDIT_PRODUCTS: 'edit_products',
  DELETE_PRODUCTS: 'delete_products',
  MANAGE_INVENTORY: 'manage_inventory',
  
  // Field operations
  VIEW_FIELD_OPERATIONS: 'view_field_operations',
  MANAGE_BOARD_PLACEMENTS: 'manage_board_placements',
  MANAGE_PRODUCT_DISTRIBUTION: 'manage_product_distribution',
  VIEW_AGENT_LOCATIONS: 'view_agent_locations',
  
  // Analytics and reporting
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  
  // System administration
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_INTEGRATIONS: 'manage_integrations',
  
  // Commission management
  VIEW_COMMISSIONS: 'view_commissions',
  MANAGE_COMMISSIONS: 'manage_commissions',
  PROCESS_PAYMENTS: 'process_payments',
} as const

// Default permissions by role
export const DEFAULT_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMERS,
    PERMISSIONS.EDIT_CUSTOMERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.CREATE_ORDERS,
    PERMISSIONS.EDIT_ORDERS,
    PERMISSIONS.PROCESS_ORDERS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_FIELD_OPERATIONS,
    PERMISSIONS.VIEW_AGENT_LOCATIONS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.VIEW_COMMISSIONS,
    PERMISSIONS.MANAGE_COMMISSIONS,
  ],
  [ROLES.FIELD_AGENT]: [
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.MANAGE_BOARD_PLACEMENTS,
    PERMISSIONS.MANAGE_PRODUCT_DISTRIBUTION,
    PERMISSIONS.VIEW_COMMISSIONS,
  ],
  [ROLES.SALES_REP]: [
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMERS,
    PERMISSIONS.EDIT_CUSTOMERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.CREATE_ORDERS,
    PERMISSIONS.EDIT_ORDERS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_COMMISSIONS,
  ],
} as const