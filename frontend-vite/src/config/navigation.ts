import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  UserCheck,
  DollarSign,
  Building2,
  Truck,
  Target,
  TrendingUp,
  Megaphone,
  FileText,
  Gift,
  CreditCard,
  MessageSquare,
  Route,
  Shield,
  LucideIcon
} from 'lucide-react'
import { PERMISSIONS } from '../types/auth.types'

export interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  permission: string | null
  requiresRole?: string
  children?: NavigationChild[]
  category?: string
}

export interface NavigationChild {
  name: string
  href: string
  permission: string | null
  description?: string
}

export const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: null,
    category: 'Core',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    permission: PERMISSIONS.VIEW_ANALYTICS,
    category: 'Core',
  },
  {
    name: 'Van Sales',
    href: '/van-sales',
    icon: Truck,
    permission: PERMISSIONS.VIEW_VAN_SALES,
    category: 'Operations',
    children: [
      {
        name: 'Sales Workflow',
        href: '/van-sales/workflow',
        permission: PERMISSIONS.VIEW_VAN_SALES,
        description: 'Complete van sales workflow',
      },
      {
        name: 'Dashboard',
        href: '/van-sales/dashboard',
        permission: PERMISSIONS.VIEW_VAN_SALES,
        description: 'Van sales overview',
      },
      {
        name: 'Management',
        href: '/van-sales/management',
        permission: PERMISSIONS.MANAGE_VAN_SALES,
        description: 'Manage van sales operations',
      },
      {
        name: 'Route Management',
        href: '/van-sales/routes',
        permission: PERMISSIONS.MANAGE_ROUTES,
        description: 'Plan and manage routes',
      },
      {
        name: 'Inventory Tracking',
        href: '/van-sales/inventory',
        permission: PERMISSIONS.VIEW_INVENTORY,
        description: 'Track van inventory',
      },
    ],
  },
  {
    name: 'Field Operations',
    href: '/field-operations',
    icon: Route,
    permission: PERMISSIONS.VIEW_FIELD_OPERATIONS,
    category: 'Operations',
    children: [
      {
        name: 'Agent Workflow',
        href: '/field-agents/workflow',
        permission: PERMISSIONS.VIEW_FIELD_OPERATIONS,
        description: 'Field agent workflow',
      },
      {
        name: 'Dashboard',
        href: '/field-operations/dashboard',
        permission: PERMISSIONS.VIEW_FIELD_OPERATIONS,
        description: 'Field operations overview',
      },
      {
        name: 'Agent Management',
        href: '/field-operations/agents',
        permission: PERMISSIONS.MANAGE_FIELD_AGENTS,
        description: 'Manage field agents',
      },
      {
        name: 'Visit Management',
        href: '/field-operations/visits',
        permission: PERMISSIONS.VIEW_FIELD_OPERATIONS,
        description: 'Track customer visits',
      },
      {
        name: 'Live Mapping',
        href: '/field-operations/mapping',
        permission: PERMISSIONS.VIEW_AGENT_LOCATIONS,
        description: 'Real-time agent tracking',
      },
      {
        name: 'Board Placement',
        href: '/field-operations/boards',
        permission: PERMISSIONS.MANAGE_BOARD_PLACEMENTS,
        description: 'Manage board placements with AI',
      },
      {
        name: 'Product Distribution',
        href: '/field-operations/products',
        permission: PERMISSIONS.MANAGE_PRODUCT_DISTRIBUTION,
        description: 'Track product distribution',
      },
      {
        name: 'Commission Tracking',
        href: '/field-operations/commission',
        permission: PERMISSIONS.VIEW_COMMISSIONS,
        description: 'Monitor commissions',
      },
    ],
  },
  {
    name: 'KYC Management',
    href: '/kyc',
    icon: CreditCard,
    permission: PERMISSIONS.VIEW_KYC,
    category: 'Compliance',
    children: [
      {
        name: 'Dashboard',
        href: '/kyc/dashboard',
        permission: PERMISSIONS.VIEW_KYC,
        description: 'KYC overview',
      },
      {
        name: 'Management',
        href: '/kyc/management',
        permission: PERMISSIONS.MANAGE_KYC,
        description: 'Manage KYC cases',
      },
      {
        name: 'Reports',
        href: '/kyc/reports',
        permission: PERMISSIONS.VIEW_KYC_REPORTS,
        description: 'KYC reports',
      },
    ],
  },
  {
    name: 'Surveys',
    href: '/surveys',
    icon: MessageSquare,
    permission: PERMISSIONS.VIEW_SURVEYS,
    category: 'Engagement',
    children: [
      {
        name: 'Dashboard',
        href: '/surveys/dashboard',
        permission: PERMISSIONS.VIEW_SURVEYS,
        description: 'Survey overview',
      },
      {
        name: 'Management',
        href: '/surveys/management',
        permission: PERMISSIONS.MANAGE_SURVEYS,
        description: 'Manage surveys',
      },
    ],
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Package,
    permission: PERMISSIONS.VIEW_INVENTORY,
    category: 'Operations',
    children: [
      {
        name: 'Stock Count Workflow',
        href: '/inventory/stock-count',
        permission: PERMISSIONS.VIEW_INVENTORY,
        description: 'Perform stock counts',
      },
      {
        name: 'Dashboard',
        href: '/inventory/dashboard',
        permission: PERMISSIONS.VIEW_INVENTORY,
        description: 'Inventory overview',
      },
      {
        name: 'Management',
        href: '/inventory/management',
        permission: PERMISSIONS.MANAGE_INVENTORY,
        description: 'Manage inventory',
      },
      {
        name: 'Reports',
        href: '/inventory/reports',
        permission: PERMISSIONS.VIEW_INVENTORY_REPORTS,
        description: 'Inventory reports',
      },
    ],
  },
  {
    name: 'Promotions',
    href: '/promotions',
    icon: Gift,
    permission: PERMISSIONS.VIEW_PROMOTIONS,
    category: 'Marketing',
    children: [
      {
        name: 'Dashboard',
        href: '/promotions/dashboard',
        permission: PERMISSIONS.VIEW_PROMOTIONS,
        description: 'Promotions overview',
      },
      {
        name: 'Management',
        href: '/promotions/management',
        permission: PERMISSIONS.MANAGE_PROMOTIONS,
        description: 'Manage promotions',
      },
    ],
  },
  {
    name: 'Trade Marketing',
    href: '/trade-marketing',
    icon: TrendingUp,
    permission: PERMISSIONS.VIEW_TRADE_MARKETING,
    category: 'Marketing',
    children: [
      {
        name: 'Activation Workflow',
        href: '/trade-marketing/activation',
        permission: PERMISSIONS.VIEW_TRADE_MARKETING,
        description: 'Trade marketing activation',
      },
      {
        name: 'Promotions',
        href: '/trade-marketing/promotions',
        permission: PERMISSIONS.MANAGE_PROMOTIONS,
        description: 'Trade promotions',
      },
      {
        name: 'Retailer Incentives',
        href: '/trade-marketing/incentives',
        permission: PERMISSIONS.MANAGE_INCENTIVES,
        description: 'Manage retailer incentives',
      },
      {
        name: 'Market Analysis',
        href: '/trade-marketing/analysis',
        permission: PERMISSIONS.VIEW_MARKET_ANALYSIS,
        description: 'Market analysis',
      },
      {
        name: 'Trade Spend',
        href: '/trade-marketing/spend',
        permission: PERMISSIONS.MANAGE_TRADE_SPEND,
        description: 'Track trade spend',
      },
    ],
  },
  {
    name: 'Campaigns',
    href: '/campaigns',
    icon: Megaphone,
    permission: PERMISSIONS.VIEW_CAMPAIGNS,
    category: 'Marketing',
    children: [
      {
        name: 'Campaign Management',
        href: '/campaigns/management',
        permission: PERMISSIONS.MANAGE_CAMPAIGNS,
        description: 'Manage campaigns',
      },
      {
        name: 'Target Audiences',
        href: '/campaigns/audiences',
        permission: PERMISSIONS.MANAGE_AUDIENCES,
        description: 'Define target audiences',
      },
      {
        name: 'Performance Tracking',
        href: '/campaigns/performance',
        permission: PERMISSIONS.VIEW_CAMPAIGN_PERFORMANCE,
        description: 'Track campaign performance',
      },
      {
        name: 'A/B Testing',
        href: '/campaigns/testing',
        permission: PERMISSIONS.MANAGE_AB_TESTING,
        description: 'Run A/B tests',
      },
    ],
  },
  {
    name: 'Finance',
    href: '/finance',
    icon: DollarSign,
    permission: PERMISSIONS.VIEW_ANALYTICS,
    category: 'Finance',
    children: [
      {
        name: 'Dashboard',
        href: '/finance/dashboard',
        permission: PERMISSIONS.VIEW_ANALYTICS,
        description: 'Financial overview',
      },
      {
        name: 'Invoices',
        href: '/finance/invoices',
        permission: PERMISSIONS.VIEW_ORDERS,
        description: 'Manage invoices',
      },
      {
        name: 'Payments',
        href: '/finance/payments',
        permission: PERMISSIONS.VIEW_ORDERS,
        description: 'Track payments',
      },
    ],
  },
  {
    name: 'Sales',
    href: '/sales',
    icon: ShoppingCart,
    permission: PERMISSIONS.VIEW_ORDERS,
    category: 'Sales',
    children: [
      {
        name: 'Dashboard',
        href: '/sales/dashboard',
        permission: PERMISSIONS.VIEW_ORDERS,
        description: 'Sales overview',
      },
      {
        name: 'Orders',
        href: '/sales/orders',
        permission: PERMISSIONS.VIEW_ORDERS,
        description: 'Manage orders',
      },
      {
        name: 'Invoices',
        href: '/sales/invoices',
        permission: PERMISSIONS.VIEW_ORDERS,
        description: 'Sales invoices',
      },
      {
        name: 'Payments',
        href: '/sales/payments',
        permission: PERMISSIONS.VIEW_ORDERS,
        description: 'Payment tracking',
      },
      {
        name: 'Credit Notes',
        href: '/sales/credit-notes',
        permission: PERMISSIONS.VIEW_ORDERS,
        description: 'Manage credit notes',
      },
      {
        name: 'Returns',
        href: '/sales/returns',
        permission: PERMISSIONS.VIEW_ORDERS,
        description: 'Handle returns',
      },
    ],
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Building2,
    permission: PERMISSIONS.VIEW_CUSTOMERS,
    category: 'CRM',
    children: [
      {
        name: 'Dashboard',
        href: '/customers/dashboard',
        permission: PERMISSIONS.VIEW_CUSTOMERS,
        description: 'Customer overview',
      },
      {
        name: 'All Customers',
        href: '/customers',
        permission: PERMISSIONS.VIEW_CUSTOMERS,
        description: 'View all customers',
      },
    ],
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
    permission: PERMISSIONS.VIEW_PRODUCTS,
    category: 'Catalog',
  },
  {
    name: 'SuperAdmin',
    href: '/superadmin/tenants',
    icon: Shield,
    permission: null,
    requiresRole: 'superadmin',
    category: 'System',
  },
  {
    name: 'Administration',
    href: '/admin',
    icon: Settings,
    permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    category: 'System',
    children: [
      {
        name: 'Dashboard',
        href: '/admin/dashboard',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Admin overview',
      },
      {
        name: 'User Management',
        href: '/admin/users',
        permission: PERMISSIONS.VIEW_USERS,
        description: 'Manage users',
      },
      {
        name: 'Role & Permissions',
        href: '/admin/roles',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Configure roles',
      },
      {
        name: 'System Settings',
        href: '/admin/settings',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'System configuration',
      },
      {
        name: 'System Health',
        href: '/admin/system-health',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Monitor system health',
      },
      {
        name: 'Backup Management',
        href: '/admin/backup',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Manage backups',
      },
      {
        name: 'Integrations',
        href: '/admin/integrations',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Configure integrations',
      },
      {
        name: 'Audit Logs',
        href: '/admin/audit',
        permission: PERMISSIONS.VIEW_AUDIT_LOGS,
        description: 'View audit logs',
      },
      {
        name: 'Data Import/Export',
        href: '/admin/data-import-export',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Import/export data',
      },
      {
        name: 'Brand Management',
        href: '/admin/brands',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Manage brands',
      },
      {
        name: 'Territory Management',
        href: '/admin/territories',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Define territories',
      },
      {
        name: 'Board Management',
        href: '/admin/boards',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Manage boards',
      },
      {
        name: 'Campaign Management',
        href: '/admin/campaigns',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Configure campaigns',
      },
      {
        name: 'Survey Builder',
        href: '/admin/surveys',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Build surveys',
      },
      {
        name: 'Commission Rules',
        href: '/admin/commissions',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Configure commission rules',
      },
      {
        name: 'Product Types',
        href: '/admin/product-types',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Define product types',
      },
      {
        name: 'POS Library',
        href: '/admin/pos-library',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        description: 'Manage POS materials',
      },
    ],
  },
]

export const navigationByCategory = {
  Core: navigation.filter(item => item.category === 'Core'),
  Operations: navigation.filter(item => item.category === 'Operations'),
  Sales: navigation.filter(item => item.category === 'Sales'),
  Finance: navigation.filter(item => item.category === 'Finance'),
  Marketing: navigation.filter(item => item.category === 'Marketing'),
  CRM: navigation.filter(item => item.category === 'CRM'),
  Catalog: navigation.filter(item => item.category === 'Catalog'),
  Compliance: navigation.filter(item => item.category === 'Compliance'),
  Engagement: navigation.filter(item => item.category === 'Engagement'),
  System: navigation.filter(item => item.category === 'System'),
}
