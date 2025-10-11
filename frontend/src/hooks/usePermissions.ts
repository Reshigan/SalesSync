'use client'

import { useAuthStore } from '@/store/auth.store'

export function usePermissions() {
  const { user, hasPermission, hasRole } = useAuthStore()

  return {
    user,
    userRole: user?.role,
    hasPermission,
    hasRole,
    
    // Convenience methods for common checks
    canViewModule: (module: string) => hasPermission(`${module}:view`),
    canCreateIn: (module: string) => hasPermission(`${module}:create`),
    canEditIn: (module: string) => hasPermission(`${module}:edit`),
    canDeleteIn: (module: string) => hasPermission(`${module}:delete`),
    canApproveIn: (module: string) => hasPermission(`${module}:approve`),
    canExportFrom: (module: string) => hasPermission(`${module}:export`),
    
    // Role-based checks
    isAdmin: () => hasRole(['admin', 'super_admin']),
    isManager: () => hasRole(['manager', 'admin', 'super_admin']),
    isFieldAgent: () => hasRole(['van_sales', 'promoter', 'merchandiser', 'field_agent']),
    
    // Module access checks
    canAccessVanSales: () => hasPermission('van_sales:view'),
    canAccessPromotions: () => hasPermission('promotions:view'),
    canAccessMerchandising: () => hasPermission('merchandising:view'),
    canAccessFieldAgents: () => hasPermission('field_agents:view'),
    canAccessWarehouse: () => hasPermission('warehouse:view'),
    canAccessBackOffice: () => hasPermission('back_office:view'),
    canAccessAnalytics: () => hasPermission('analytics:view'),
    canAccessAdmin: () => hasRole(['admin', 'super_admin']),
  }
}