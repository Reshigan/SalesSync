export interface SystemSettings {
  id: string
  currency: {
    code: string
    symbol: string
    name: string
    decimal_places: number
  }
  timezone: string
  date_format: string
  time_format: string
  language: string
  company: {
    name: string
    logo: string
    address: string
    phone: string
    email: string
    website: string
  }
  features: {
    gps_tracking: boolean
    commission_tracking: boolean
    mobile_app: boolean
    notifications: boolean
    reporting: boolean
    analytics: boolean
  }
  security: {
    password_policy: {
      min_length: number
      require_uppercase: boolean
      require_lowercase: boolean
      require_numbers: boolean
      require_symbols: boolean
    }
    session_timeout: number
    max_login_attempts: number
    two_factor_auth: boolean
  }
  created_at: string
  updated_at: string
}

export interface ModulePermission {
  module: string
  features: {
    [key: string]: {
      view: boolean
      create: boolean
      edit: boolean
      delete: boolean
      export: boolean
    }
  }
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: ModulePermission[]
  is_system_role: boolean
  created_at: string
  updated_at: string
}

export const MODULES = {
  DASHBOARD: 'dashboard',
  FIELD_AGENTS: 'field_agents',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  PRODUCTS: 'products',
  ANALYTICS: 'analytics',
  ADMIN: 'admin',
  SETTINGS: 'settings',
} as const

export const FEATURES = {
  DASHBOARD: {
    VIEW_OVERVIEW: 'view_overview',
    VIEW_ANALYTICS: 'view_analytics',
    EXPORT_DATA: 'export_data',
  },
  FIELD_AGENTS: {
    VIEW_AGENTS: 'view_agents',
    CREATE_AGENT: 'create_agent',
    EDIT_AGENT: 'edit_agent',
    DELETE_AGENT: 'delete_agent',
    VIEW_LOCATIONS: 'view_locations',
    VIEW_PERFORMANCE: 'view_performance',
    MANAGE_COMMISSIONS: 'manage_commissions',
    EXPORT_REPORTS: 'export_reports',
  },
  CUSTOMERS: {
    VIEW_CUSTOMERS: 'view_customers',
    CREATE_CUSTOMER: 'create_customer',
    EDIT_CUSTOMER: 'edit_customer',
    DELETE_CUSTOMER: 'delete_customer',
    VIEW_ORDERS: 'view_orders',
    EXPORT_DATA: 'export_data',
  },
  ORDERS: {
    VIEW_ORDERS: 'view_orders',
    CREATE_ORDER: 'create_order',
    EDIT_ORDER: 'edit_order',
    DELETE_ORDER: 'delete_order',
    PROCESS_PAYMENTS: 'process_payments',
    EXPORT_DATA: 'export_data',
  },
  PRODUCTS: {
    VIEW_PRODUCTS: 'view_products',
    CREATE_PRODUCT: 'create_product',
    EDIT_PRODUCT: 'edit_product',
    DELETE_PRODUCT: 'delete_product',
    MANAGE_INVENTORY: 'manage_inventory',
    EXPORT_DATA: 'export_data',
  },
  ANALYTICS: {
    VIEW_REPORTS: 'view_reports',
    CREATE_REPORTS: 'create_reports',
    EXPORT_REPORTS: 'export_reports',
    VIEW_REAL_TIME: 'view_real_time',
  },
  ADMIN: {
    VIEW_USERS: 'view_users',
    CREATE_USER: 'create_user',
    EDIT_USER: 'edit_user',
    DELETE_USER: 'delete_user',
    MANAGE_ROLES: 'manage_roles',
    VIEW_AUDIT_LOGS: 'view_audit_logs',
    SYSTEM_SETTINGS: 'system_settings',
  },
} as const

export const CURRENCIES = [
  { code: 'GBP', symbol: '£', name: 'British Pound', decimal_places: 2 },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimal_places: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimal_places: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimal_places: 0 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimal_places: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimal_places: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimal_places: 2 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimal_places: 2 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimal_places: 2 },
]