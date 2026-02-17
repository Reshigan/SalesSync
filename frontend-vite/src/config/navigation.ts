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
  group?: string
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
    name: 'Sales',
    href: '/sales',
    icon: ShoppingCart,
    permission: PERMISSIONS.VIEW_ORDERS,
    category: 'Sales',
    children: [
      { name: 'Orders', href: '/sales/orders', permission: PERMISSIONS.VIEW_ORDERS },
      { name: 'Invoices', href: '/sales/invoices', permission: PERMISSIONS.VIEW_ORDERS },
      { name: 'Payments', href: '/sales/payments', permission: PERMISSIONS.VIEW_ORDERS },
      { name: 'Credit Notes', href: '/sales/credit-notes', permission: PERMISSIONS.VIEW_ORDERS },
      { name: 'Returns', href: '/sales/returns', permission: PERMISSIONS.VIEW_ORDERS },
    ],
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Building2,
    permission: PERMISSIONS.VIEW_CUSTOMERS,
    category: 'Sales',
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
    permission: PERMISSIONS.VIEW_PRODUCTS,
    category: 'Sales',
  },
  {
    name: 'Van Sales',
    href: '/van-sales',
    icon: Truck,
    permission: PERMISSIONS.VIEW_VAN_SALES,
    category: 'Operations',
    children: [
      { name: 'Dashboard', href: '/van-sales/dashboard', permission: PERMISSIONS.VIEW_VAN_SALES },
      { name: 'Workflow', href: '/van-sales/workflow', permission: PERMISSIONS.VIEW_VAN_SALES },
      { name: 'Routes', href: '/van-sales/routes', permission: PERMISSIONS.MANAGE_ROUTES },
      { name: 'Inventory', href: '/van-sales/inventory', permission: PERMISSIONS.VIEW_INVENTORY },
    ],
  },
  {
    name: 'Field Ops',
    href: '/field-operations',
    icon: Route,
    permission: PERMISSIONS.VIEW_FIELD_OPERATIONS,
    category: 'Operations',
    children: [
      { name: 'Dashboard', href: '/field-operations/dashboard', permission: PERMISSIONS.VIEW_FIELD_OPERATIONS },
      { name: 'Agents', href: '/field-operations/agents', permission: PERMISSIONS.MANAGE_FIELD_AGENTS },
      { name: 'Visits', href: '/field-operations/visits', permission: PERMISSIONS.VIEW_FIELD_OPERATIONS },
      { name: 'Live Map', href: '/field-operations/mapping', permission: PERMISSIONS.VIEW_AGENT_LOCATIONS },
      { name: 'Boards', href: '/field-operations/boards', permission: PERMISSIONS.MANAGE_BOARD_PLACEMENTS },
      { name: 'Distribution', href: '/field-operations/products', permission: PERMISSIONS.MANAGE_PRODUCT_DISTRIBUTION },
      { name: 'Commissions', href: '/field-operations/commission', permission: PERMISSIONS.VIEW_COMMISSIONS },
    ],
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Package,
    permission: PERMISSIONS.VIEW_INVENTORY,
    category: 'Operations',
    children: [
      { name: 'Dashboard', href: '/inventory/dashboard', permission: PERMISSIONS.VIEW_INVENTORY },
      { name: 'Stock Count', href: '/inventory/stock-count', permission: PERMISSIONS.VIEW_INVENTORY },
      { name: 'Management', href: '/inventory/management', permission: PERMISSIONS.MANAGE_INVENTORY },
      { name: 'Reports', href: '/inventory/reports', permission: PERMISSIONS.VIEW_INVENTORY_REPORTS },
    ],
  },
  {
    name: 'Finance',
    href: '/finance',
    icon: DollarSign,
    permission: PERMISSIONS.VIEW_ANALYTICS,
    category: 'Finance',
    children: [
      { name: 'Dashboard', href: '/finance/dashboard', permission: PERMISSIONS.VIEW_ANALYTICS },
      { name: 'Invoices', href: '/finance/invoices', permission: PERMISSIONS.VIEW_ORDERS },
      { name: 'Payments', href: '/finance/payments', permission: PERMISSIONS.VIEW_ORDERS },
    ],
  },
  {
    name: 'Marketing',
    href: '/trade-marketing',
    icon: TrendingUp,
    permission: PERMISSIONS.VIEW_TRADE_MARKETING,
    category: 'Marketing',
    children: [
      { name: 'Campaigns', href: '/campaigns/management', permission: PERMISSIONS.VIEW_TRADE_MARKETING },
      { name: 'Promotions', href: '/promotions/management', permission: PERMISSIONS.VIEW_TRADE_MARKETING },
      { name: 'Trade Marketing', href: '/trade-marketing/activation', permission: PERMISSIONS.VIEW_TRADE_MARKETING },
      { name: 'Events', href: '/events', permission: PERMISSIONS.VIEW_TRADE_MARKETING },
    ],
  },
  {
    name: 'KYC',
    href: '/kyc',
    icon: CreditCard,
    permission: PERMISSIONS.VIEW_KYC,
    category: 'Compliance',
    children: [
      { name: 'Dashboard', href: '/kyc/dashboard', permission: PERMISSIONS.VIEW_KYC },
      { name: 'Management', href: '/kyc/management', permission: PERMISSIONS.MANAGE_KYC },
      { name: 'Reports', href: '/kyc/reports', permission: PERMISSIONS.VIEW_KYC_REPORTS },
    ],
  },
  {
    name: 'Surveys',
    href: '/surveys',
    icon: MessageSquare,
    permission: PERMISSIONS.VIEW_SURVEYS,
    category: 'Compliance',
    children: [
      { name: 'Dashboard', href: '/surveys/dashboard', permission: PERMISSIONS.VIEW_SURVEYS },
      { name: 'Management', href: '/surveys/management', permission: PERMISSIONS.MANAGE_SURVEYS },
    ],
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
    name: 'Admin',
    href: '/admin',
    icon: Settings,
    permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    category: 'System',
    children: [
      { name: 'Dashboard', href: '/admin/dashboard', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'General' },
      { name: 'Users', href: '/admin/users', permission: PERMISSIONS.VIEW_USERS, group: 'General' },
      { name: 'Roles', href: '/admin/roles', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'General' },
      { name: 'Settings', href: '/admin/settings', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'General' },
      { name: 'Brands', href: '/admin/brands', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Catalog' },
      { name: 'Product Types', href: '/admin/product-types', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Catalog' },
      { name: 'Territories', href: '/admin/territories', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Catalog' },
      { name: 'Boards', href: '/admin/boards', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Catalog' },
      { name: 'Price Lists', href: '/admin/price-lists', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Catalog' },
      { name: 'Commissions', href: '/admin/commissions', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Rules' },
      { name: 'Surveys', href: '/admin/surveys', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Rules' },
      { name: 'Campaigns', href: '/admin/campaigns', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Rules' },
      { name: 'Targets', href: '/admin/targets', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Rules' },
      { name: 'Data Import', href: '/admin/data-import-export', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Tools' },
      { name: 'Audit Logs', href: '/admin/audit', permission: PERMISSIONS.VIEW_AUDIT_LOGS, group: 'Tools' },
      { name: 'System Health', href: '/admin/system-health', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Tools' },
      { name: 'Backups', href: '/admin/backup', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Tools' },
      { name: 'Integrations', href: '/admin/integrations', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Tools' },
      { name: 'POS Library', href: '/admin/pos-library', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS, group: 'Tools' },
    ],
  },
]

export const navigationByCategory = {
  Core: navigation.filter(item => item.category === 'Core'),
  Sales: navigation.filter(item => item.category === 'Sales'),
  Operations: navigation.filter(item => item.category === 'Operations'),
  Finance: navigation.filter(item => item.category === 'Finance'),
  Marketing: navigation.filter(item => item.category === 'Marketing'),
  Compliance: navigation.filter(item => item.category === 'Compliance'),
  System: navigation.filter(item => item.category === 'System'),
}
