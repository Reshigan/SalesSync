/**
 * RouteRegistry - Single source of truth for all application routes
 * This prevents menu/route drift and provides a live coverage matrix
 */

export interface RouteDefinition {
  path: string
  title: string
  module: string
  depth: 'list' | 'detail' | 'create' | 'edit' | 'subpage' | 'dashboard' | 'workflow'
  permission?: string
  mounted: boolean
}

export const ROUTE_REGISTRY: RouteDefinition[] = [
  // Dashboard
  { path: '/dashboard', title: 'Dashboard', module: 'core', depth: 'dashboard', mounted: true },
  { path: '/analytics', title: 'Analytics', module: 'core', depth: 'dashboard', mounted: true },
  
  // Customers
  { path: '/customers', title: 'Customers List', module: 'customers', depth: 'list', mounted: true },
  { path: '/customers/:id', title: 'Customer Detail', module: 'customers', depth: 'detail', mounted: true },
  { path: '/customers/:id/edit', title: 'Edit Customer', module: 'customers', depth: 'edit', mounted: true },
  { path: '/customers/create', title: 'Create Customer', module: 'customers', depth: 'create', mounted: true },
  { path: '/customers/:id/orders', title: 'Customer Orders', module: 'customers', depth: 'subpage', mounted: false },
  { path: '/customers/:id/visits', title: 'Customer Visits', module: 'customers', depth: 'subpage', mounted: false },
  { path: '/customers/:id/payments', title: 'Customer Payments', module: 'customers', depth: 'subpage', mounted: false },
  { path: '/customers/:id/surveys', title: 'Customer Surveys', module: 'customers', depth: 'subpage', mounted: false },
  { path: '/customers/:id/kyc', title: 'Customer KYC', module: 'customers', depth: 'subpage', mounted: false },
  
  // Products
  { path: '/products', title: 'Products List', module: 'products', depth: 'list', mounted: true },
  { path: '/products/:id', title: 'Product Detail', module: 'products', depth: 'detail', mounted: true },
  { path: '/products/:id/edit', title: 'Edit Product', module: 'products', depth: 'edit', mounted: true },
  { path: '/products/create', title: 'Create Product', module: 'products', depth: 'create', mounted: true },
  { path: '/products/:id/inventory', title: 'Product Inventory', module: 'products', depth: 'subpage', mounted: false },
  { path: '/products/:id/pricing', title: 'Product Pricing', module: 'products', depth: 'subpage', mounted: false },
  { path: '/products/:id/promotions', title: 'Product Promotions', module: 'products', depth: 'subpage', mounted: false },
  { path: '/products/:id/sales', title: 'Product Sales History', module: 'products', depth: 'subpage', mounted: false },
  
  // Brands
  { path: '/brands', title: 'Brands List', module: 'brands', depth: 'list', mounted: false },
  { path: '/brands/:id', title: 'Brand Detail', module: 'brands', depth: 'detail', mounted: false },
  { path: '/brands/:id/edit', title: 'Edit Brand', module: 'brands', depth: 'edit', mounted: false },
  { path: '/brands/create', title: 'Create Brand', module: 'brands', depth: 'create', mounted: false },
  { path: '/brands/:id/surveys', title: 'Brand Surveys', module: 'brands', depth: 'subpage', mounted: false },
  { path: '/brands/:id/activations', title: 'Brand Activations', module: 'brands', depth: 'subpage', mounted: false },
  { path: '/brands/:id/boards', title: 'Brand Board Placements', module: 'brands', depth: 'subpage', mounted: false },
  { path: '/brands/:id/products', title: 'Brand Products', module: 'brands', depth: 'subpage', mounted: false },
  
  // Orders
  { path: '/orders', title: 'Orders List', module: 'orders', depth: 'list', mounted: true },
  { path: '/orders/:id', title: 'Order Detail', module: 'orders', depth: 'detail', mounted: true },
  { path: '/orders/:id/edit', title: 'Edit Order', module: 'orders', depth: 'edit', mounted: true },
  { path: '/orders/create', title: 'Create Order', module: 'orders', depth: 'create', mounted: true },
  { path: '/orders/:id/items', title: 'Order Items', module: 'orders', depth: 'subpage', mounted: false },
  { path: '/orders/:id/payments', title: 'Order Payments', module: 'orders', depth: 'subpage', mounted: false },
  { path: '/orders/:id/delivery', title: 'Order Delivery Tracking', module: 'orders', depth: 'subpage', mounted: false },
  { path: '/orders/:id/returns', title: 'Order Returns', module: 'orders', depth: 'subpage', mounted: false },
  
  // Van Sales
  { path: '/van-sales', title: 'Van Sales Dashboard', module: 'van-sales', depth: 'dashboard', mounted: true },
  { path: '/van-sales/workflow', title: 'Van Sales Workflow', module: 'van-sales', depth: 'workflow', mounted: true },
  
  // Field Operations
  { path: '/field-operations', title: 'Field Operations Dashboard', module: 'field-operations', depth: 'dashboard', mounted: true },
  { path: '/field-agents/workflow', title: 'Field Agent Workflow', module: 'field-operations', depth: 'workflow', mounted: true },
  
  // Admin
  { path: '/admin', title: 'Admin Dashboard', module: 'admin', depth: 'dashboard', mounted: true },
  { path: '/admin/users', title: 'User Management', module: 'admin', depth: 'list', mounted: true },
  { path: '/admin/roles', title: 'Role Permissions', module: 'admin', depth: 'list', mounted: true },
  { path: '/admin/settings', title: 'System Settings', module: 'admin', depth: 'dashboard', mounted: true },
]

export function getUnmountedRoutes(): RouteDefinition[] {
  return ROUTE_REGISTRY.filter(r => !r.mounted)
}

export function getRoutesByModule(module: string): RouteDefinition[] {
  return ROUTE_REGISTRY.filter(r => r.module === module)
}

export function getCoverageStats() {
  const total = ROUTE_REGISTRY.length
  const mounted = ROUTE_REGISTRY.filter(r => r.mounted).length
  return {
    total,
    mounted,
    unmounted: total - mounted,
    percentage: Math.round((mounted / total) * 100)
  }
}
