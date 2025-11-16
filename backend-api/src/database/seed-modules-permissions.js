/**
 * Seed modules and role_permissions for PostgreSQL
 * This script populates the modules table and grants admin role full permissions
 */

const { runQuery, getOneQuery } = require('../utils/database');

async function seedModulesAndPermissions() {
  try {
    console.log('Starting modules and permissions seeding...');
    
    const demoTenant = await getOneQuery(
      "SELECT id FROM tenants WHERE code = $1",
      ['DEMO']
    );
    
    if (!demoTenant) {
      console.error('DEMO tenant not found. Please create it first.');
      return;
    }
    
    const tenantId = demoTenant.id;
    console.log(`Found DEMO tenant: ${tenantId}`);
    
    const modules = [
      { code: 'dashboard', name: 'Dashboard', description: 'Main dashboard and analytics', icon: 'LayoutDashboard', display_order: 1 },
      { code: 'customers', name: 'Customers', description: 'Customer management', icon: 'Users', display_order: 2 },
      { code: 'products', name: 'Products', description: 'Product catalog management', icon: 'Package', display_order: 3 },
      { code: 'orders', name: 'Orders', description: 'Sales orders management', icon: 'ShoppingCart', display_order: 4 },
      { code: 'inventory', name: 'Inventory', description: 'Inventory and stock management', icon: 'Warehouse', display_order: 5 },
      { code: 'vans', name: 'Van Sales', description: 'Van sales operations', icon: 'Truck', display_order: 6 },
      { code: 'van_sales', name: 'Van Sales Transactions', description: 'Van sales transactions', icon: 'Receipt', display_order: 7 },
      { code: 'van_loads', name: 'Van Loads', description: 'Van loading operations', icon: 'PackageCheck', display_order: 8 },
      { code: 'routes', name: 'Routes', description: 'Sales routes management', icon: 'Map', display_order: 9 },
      { code: 'visits', name: 'Visits', description: 'Customer visits tracking', icon: 'MapPin', display_order: 10 },
      { code: 'field_ops', name: 'Field Operations', description: 'Field operations management', icon: 'Compass', display_order: 11 },
      { code: 'agents', name: 'Field Agents', description: 'Field agents management', icon: 'UserCheck', display_order: 12 },
      { code: 'warehouses', name: 'Warehouses', description: 'Warehouse management', icon: 'Building', display_order: 13 },
      { code: 'finance', name: 'Finance', description: 'Financial management', icon: 'DollarSign', display_order: 14 },
      { code: 'reports', name: 'Reports', description: 'Reports and analytics', icon: 'FileText', display_order: 15 },
      { code: 'settings', name: 'Settings', description: 'System settings', icon: 'Settings', display_order: 16 },
      { code: 'users', name: 'Users', description: 'User management', icon: 'UserCog', display_order: 17 },
      { code: 'regions', name: 'Regions', description: 'Regional management', icon: 'Globe', display_order: 18 },
      { code: 'areas', name: 'Areas', description: 'Area management', icon: 'MapPinned', display_order: 19 },
      { code: 'categories', name: 'Categories', description: 'Product categories', icon: 'FolderTree', display_order: 20 },
      { code: 'brands', name: 'Brands', description: 'Brand management', icon: 'Award', display_order: 21 },
      { code: 'crm', name: 'CRM', description: 'Customer relationship management', icon: 'Heart', display_order: 22 },
      { code: 'marketing', name: 'Marketing', description: 'Marketing campaigns', icon: 'Megaphone', display_order: 23 },
      { code: 'audit', name: 'Audit', description: 'Audit logs and compliance', icon: 'Shield', display_order: 24 },
      { code: 'ai_analytics', name: 'AI Analytics', description: 'AI-powered analytics', icon: 'Brain', display_order: 25 }
    ];
    
    console.log(`Seeding ${modules.length} modules...`);
    
    const moduleIds = {};
    for (const module of modules) {
      const result = await runQuery(`
        INSERT INTO modules (tenant_id, code, name, description, icon, display_order, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
        RETURNING id, code
      `, [
        tenantId,
        module.code,
        module.name,
        module.description,
        module.icon,
        module.display_order,
        'active'
      ]);
      
      if (result.rows.length > 0) {
        moduleIds[module.code] = result.rows[0].id;
        console.log(`  ✓ Created module: ${module.name} (${module.code})`);
      } else {
        const existing = await getOneQuery(
          'SELECT id FROM modules WHERE tenant_id = $1 AND code = $2',
          [tenantId, module.code]
        );
        if (existing) {
          moduleIds[module.code] = existing.id;
          console.log(`  - Module already exists: ${module.name} (${module.code})`);
        }
      }
    }
    
    console.log(`\nSeeding role_permissions for admin role...`);
    
    const roles = ['admin', 'manager', 'agent', 'warehouse', 'finance'];
    
    for (const role of roles) {
      for (const [moduleCode, moduleId] of Object.entries(moduleIds)) {
        const permissions = role === 'admin' ? {
          can_view: true,
          can_create: true,
          can_edit: true,
          can_delete: true,
          can_approve: true,
          can_export: true
        } : role === 'manager' ? {
          can_view: true,
          can_create: true,
          can_edit: true,
          can_delete: false,
          can_approve: true,
          can_export: true
        } : role === 'agent' ? {
          can_view: true,
          can_create: true,
          can_edit: false,
          can_delete: false,
          can_approve: false,
          can_export: false
        } : role === 'warehouse' ? {
          can_view: ['inventory', 'warehouses', 'products', 'van_loads'].includes(moduleCode),
          can_create: ['inventory', 'van_loads'].includes(moduleCode),
          can_edit: ['inventory', 'van_loads'].includes(moduleCode),
          can_delete: false,
          can_approve: false,
          can_export: true
        } : role === 'finance' ? {
          can_view: ['finance', 'orders', 'van_sales', 'customers', 'reports'].includes(moduleCode),
          can_create: ['finance'].includes(moduleCode),
          can_edit: ['finance'].includes(moduleCode),
          can_delete: false,
          can_approve: ['finance', 'orders'].includes(moduleCode),
          can_export: true
        } : {
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false,
          can_approve: false,
          can_export: false
        };
        
        if (!permissions.can_view && !permissions.can_create && !permissions.can_edit && 
            !permissions.can_delete && !permissions.can_approve && !permissions.can_export) {
          continue;
        }
        
        await runQuery(`
          INSERT INTO role_permissions (
            tenant_id, role, module_id, 
            can_view, can_create, can_edit, can_delete, can_approve, can_export
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          role,
          moduleId,
          permissions.can_view,
          permissions.can_create,
          permissions.can_edit,
          permissions.can_delete,
          permissions.can_approve,
          permissions.can_export
        ]);
      }
      console.log(`  ✓ Granted permissions for role: ${role}`);
    }
    
    console.log('\n✅ Modules and permissions seeded successfully!');
    
    const moduleCount = await getOneQuery(
      'SELECT COUNT(*) as count FROM modules WHERE tenant_id = $1',
      [tenantId]
    );
    const permissionCount = await getOneQuery(
      'SELECT COUNT(*) as count FROM role_permissions WHERE tenant_id = $1',
      [tenantId]
    );
    
    console.log(`\nVerification:`);
    console.log(`  - Modules: ${moduleCount.count}`);
    console.log(`  - Role permissions: ${permissionCount.count}`);
    
  } catch (error) {
    console.error('Error seeding modules and permissions:', error);
    throw error;
  }
}

if (require.main === module) {
  seedModulesAndPermissions()
    .then(() => {
      console.log('\nSeeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nSeeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedModulesAndPermissions };
