/**
 * Hierarchy Service
 * Provides drill-down analytics for customers, vans, and products
 */

const { getQuery, getOneQuery, runQuery } = require('../utils/database');

class HierarchyService {
  /**
   * Get customer hierarchy with drill-down data
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Hierarchy data
   */
  async getCustomerHierarchy(tenantId, filters = {}) {
    const { level = 'region', parentId = null } = filters;

    let query, params;

    if (level === 'region') {
      query = `
        SELECT 
          r.id,
          r.name,
          r.code,
          'region' as level,
          COUNT(DISTINCT a.id) as area_count,
          COUNT(DISTINCT rt.id) as route_count,
          COUNT(DISTINCT c.id) as customer_count,
          COALESCE(SUM(o.total_amount), 0) as total_sales,
          COUNT(DISTINCT o.id) as order_count
        FROM regions r
        LEFT JOIN areas a ON r.id = a.region_id AND a.tenant_id = ?
        LEFT JOIN routes rt ON a.id = rt.area_id AND rt.tenant_id = ?
        LEFT JOIN customers c ON rt.id = c.route_id AND c.tenant_id = ?
        LEFT JOIN orders o ON c.id = o.customer_id AND o.tenant_id = ?
        WHERE r.tenant_id = ? AND r.status = 'active'
        GROUP BY r.id
        ORDER BY r.name
      `;
      params = [tenantId, tenantId, tenantId, tenantId, tenantId];
    } else if (level === 'area') {
      query = `
        SELECT 
          a.id,
          a.name,
          a.code,
          a.region_id as parent_id,
          r.name as parent_name,
          'area' as level,
          COUNT(DISTINCT rt.id) as route_count,
          COUNT(DISTINCT c.id) as customer_count,
          COALESCE(SUM(o.total_amount), 0) as total_sales,
          COUNT(DISTINCT o.id) as order_count
        FROM areas a
        JOIN regions r ON a.region_id = r.id
        LEFT JOIN routes rt ON a.id = rt.area_id AND rt.tenant_id = ?
        LEFT JOIN customers c ON rt.id = c.route_id AND c.tenant_id = ?
        LEFT JOIN orders o ON c.id = o.customer_id AND o.tenant_id = ?
        WHERE a.tenant_id = ? ${parentId ? 'AND a.region_id = ?' : ''} AND a.status = 'active'
        GROUP BY a.id
        ORDER BY a.name
      `;
      params = parentId 
        ? [tenantId, tenantId, tenantId, tenantId, parentId]
        : [tenantId, tenantId, tenantId, tenantId];
    } else if (level === 'route') {
      query = `
        SELECT 
          rt.id,
          rt.name,
          rt.code,
          rt.area_id as parent_id,
          a.name as parent_name,
          'route' as level,
          COUNT(DISTINCT c.id) as customer_count,
          COALESCE(SUM(o.total_amount), 0) as total_sales,
          COUNT(DISTINCT o.id) as order_count,
          u.first_name || ' ' || u.last_name as salesman_name
        FROM routes rt
        JOIN areas a ON rt.area_id = a.id
        LEFT JOIN users u ON rt.salesman_id = u.id
        LEFT JOIN customers c ON rt.id = c.route_id AND c.tenant_id = ?
        LEFT JOIN orders o ON c.id = o.customer_id AND o.tenant_id = ?
        WHERE rt.tenant_id = ? ${parentId ? 'AND rt.area_id = ?' : ''} AND rt.status = 'active'
        GROUP BY rt.id
        ORDER BY rt.name
      `;
      params = parentId 
        ? [tenantId, tenantId, tenantId, parentId]
        : [tenantId, tenantId, tenantId];
    } else if (level === 'customer') {
      query = `
        SELECT 
          c.id,
          c.name,
          c.code,
          c.route_id as parent_id,
          rt.name as parent_name,
          'customer' as level,
          c.type,
          c.address,
          c.latitude,
          c.longitude,
          COALESCE(SUM(o.total_amount), 0) as total_sales,
          COUNT(DISTINCT o.id) as order_count,
          MAX(o.order_date) as last_order_date
        FROM customers c
        LEFT JOIN routes rt ON c.route_id = rt.id
        LEFT JOIN orders o ON c.id = o.customer_id AND o.tenant_id = ?
        WHERE c.tenant_id = ? ${parentId ? 'AND c.route_id = ?' : ''} AND c.status = 'active'
        GROUP BY c.id
        ORDER BY c.name
      `;
      params = parentId 
        ? [tenantId, tenantId, parentId]
        : [tenantId, tenantId];
    }

    const data = await getQuery(query, params);
    return data;
  }

  /**
   * Get product hierarchy with drill-down data
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Hierarchy data
   */
  async getProductHierarchy(tenantId, filters = {}) {
    const { level = 'category', parentId = null } = filters;

    if (level === 'category') {
      const query = `
        SELECT 
          cat.id,
          cat.name,
          cat.code,
          cat.parent_id,
          parent.name as parent_name,
          cat.level,
          'category' as type,
          COUNT(DISTINCT subcat.id) as subcategory_count,
          COUNT(DISTINCT p.id) as product_count,
          COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_sales,
          COUNT(DISTINCT o.id) as order_count
        FROM categories cat
        LEFT JOIN categories parent ON cat.parent_id = parent.id
        LEFT JOIN categories subcat ON cat.id = subcat.parent_id AND subcat.tenant_id = ?
        LEFT JOIN products p ON cat.id = p.category_id AND p.tenant_id = ?
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.tenant_id = ?
        WHERE cat.tenant_id = ? ${parentId ? 'AND cat.parent_id = ?' : 'AND cat.parent_id IS NULL'} AND cat.status = 'active'
        GROUP BY cat.id
        ORDER BY cat.sort_order, cat.name
      `;
      const params = parentId 
        ? [tenantId, tenantId, tenantId, tenantId, parentId]
        : [tenantId, tenantId, tenantId, tenantId];
      
      return await getQuery(query, params);
    } else if (level === 'brand') {
      const query = `
        SELECT 
          b.id,
          b.name,
          b.code,
          'brand' as type,
          COUNT(DISTINCT p.id) as product_count,
          COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_sales,
          COUNT(DISTINCT o.id) as order_count
        FROM brands b
        LEFT JOIN products p ON b.id = p.brand_id AND p.tenant_id = ?
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.tenant_id = ?
        WHERE b.tenant_id = ? AND b.status = 'active'
        GROUP BY b.id
        ORDER BY b.name
      `;
      return await getQuery(query, [tenantId, tenantId, tenantId]);
    } else if (level === 'product') {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.code,
          p.barcode,
          p.category_id as parent_id,
          cat.name as category_name,
          b.name as brand_name,
          'product' as type,
          p.selling_price,
          p.cost_price,
          COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
          COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_sales,
          COUNT(DISTINCT o.id) as order_count,
          MAX(o.order_date) as last_order_date
        FROM products p
        LEFT JOIN categories cat ON p.category_id = cat.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.tenant_id = ?
        WHERE p.tenant_id = ? ${parentId ? 'AND p.category_id = ?' : ''} AND p.status = 'active'
        GROUP BY p.id
        ORDER BY p.name
      `;
      const params = parentId 
        ? [tenantId, tenantId, parentId]
        : [tenantId, tenantId];
      
      return await getQuery(query, params);
    }
  }

  /**
   * Get van hierarchy with drill-down data
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Hierarchy data
   */
  async getVanHierarchy(tenantId, filters = {}) {
    const { level = 'fleet', parentId = null } = filters;

    if (level === 'fleet') {
      const query = `
        SELECT 
          vf.id,
          vf.name,
          vf.code,
          vf.region_id,
          r.name as region_name,
          'fleet' as level,
          COUNT(DISTINCT v.id) as van_count,
          COUNT(DISTINCT vl.id) as load_count,
          COALESCE(SUM(vs.total_amount), 0) as total_sales,
          COUNT(DISTINCT vs.id) as sale_count,
          u.first_name || ' ' || u.last_name as manager_name
        FROM van_fleets vf
        LEFT JOIN regions r ON vf.region_id = r.id
        LEFT JOIN users u ON vf.manager_id = u.id
        LEFT JOIN vans v ON vf.id = v.fleet_id AND v.tenant_id = ?
        LEFT JOIN van_loads vl ON v.id = vl.van_id AND vl.tenant_id = ?
        LEFT JOIN van_sales vs ON v.id = vs.van_id AND vs.tenant_id = ?
        WHERE vf.tenant_id = ? AND vf.status = 'active'
        GROUP BY vf.id
        ORDER BY vf.name
      `;
      return await getQuery(query, [tenantId, tenantId, tenantId, tenantId]);
    } else if (level === 'van') {
      const query = `
        SELECT 
          v.id,
          v.registration_number,
          v.model,
          v.capacity_units,
          v.fleet_id as parent_id,
          vf.name as fleet_name,
          'van' as level,
          COUNT(DISTINCT vl.id) as load_count,
          COALESCE(SUM(vs.total_amount), 0) as total_sales,
          COUNT(DISTINCT vs.id) as sale_count,
          MAX(vl.load_date) as last_load_date,
          u.first_name || ' ' || u.last_name as salesman_name
        FROM vans v
        LEFT JOIN van_fleets vf ON v.fleet_id = vf.id
        LEFT JOIN agents a ON v.assigned_salesman_id = a.id
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN van_loads vl ON v.id = vl.van_id AND vl.tenant_id = ?
        LEFT JOIN van_sales vs ON v.id = vs.van_id AND vs.tenant_id = ?
        WHERE v.tenant_id = ? ${parentId ? 'AND v.fleet_id = ?' : ''} AND v.status = 'active'
        GROUP BY v.id
        ORDER BY v.registration_number
      `;
      const params = parentId 
        ? [tenantId, tenantId, tenantId, parentId]
        : [tenantId, tenantId, tenantId];
      
      return await getQuery(query, params);
    } else if (level === 'route') {
      const query = `
        SELECT 
          vr.id,
          vr.route_date,
          vr.van_id as parent_id,
          v.registration_number as van_number,
          'route' as level,
          vr.status,
          vr.start_time,
          vr.end_time,
          vr.total_distance,
          json_array_length(vr.planned_customers) as planned_customer_count,
          json_array_length(COALESCE(vr.actual_customers, '[]')) as actual_customer_count,
          COALESCE(SUM(vs.total_amount), 0) as total_sales,
          COUNT(DISTINCT vs.id) as sale_count,
          u.first_name || ' ' || u.last_name as salesman_name
        FROM van_routes vr
        JOIN vans v ON vr.van_id = v.id
        LEFT JOIN agents a ON vr.agent_id = a.id
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN van_sales vs ON vr.id = vs.route_id AND vs.tenant_id = ?
        WHERE vr.tenant_id = ? ${parentId ? 'AND vr.van_id = ?' : ''}
        GROUP BY vr.id
        ORDER BY vr.route_date DESC
      `;
      const params = parentId 
        ? [tenantId, tenantId, parentId]
        : [tenantId, tenantId];
      
      return await getQuery(query, params);
    }
  }

  /**
   * Get breadcrumb trail for navigation
   * @param {string} tenantId - Tenant ID
   * @param {string} type - 'customer', 'product', 'van'
   * @param {string} id - Current item ID
   * @returns {Promise<Array>} Breadcrumb trail
   */
  async getBreadcrumbs(tenantId, type, id) {
    const breadcrumbs = [];

    if (type === 'customer') {
      const customer = await getOneQuery(
        'SELECT c.*, rt.name as route_name, rt.area_id FROM customers c LEFT JOIN routes rt ON c.route_id = rt.id WHERE c.id = ?',
        [id]
      );
      
      if (customer) {
        breadcrumbs.push({ level: 'customer', id: customer.id, name: customer.name });
        
        if (customer.route_id) {
          const route = await getOneQuery(
            'SELECT rt.*, a.name as area_name, a.region_id FROM routes rt LEFT JOIN areas a ON rt.area_id = a.id WHERE rt.id = ?',
            [customer.route_id]
          );
          
          if (route) {
            breadcrumbs.unshift({ level: 'route', id: route.id, name: route.name });
            
            if (route.area_id) {
              const area = await getOneQuery(
                'SELECT a.*, r.name as region_name FROM areas a LEFT JOIN regions r ON a.region_id = r.id WHERE a.id = ?',
                [route.area_id]
              );
              
              if (area) {
                breadcrumbs.unshift({ level: 'area', id: area.id, name: area.name });
                
                if (area.region_id) {
                  const region = await getOneQuery('SELECT * FROM regions WHERE id = ?', [area.region_id]);
                  if (region) {
                    breadcrumbs.unshift({ level: 'region', id: region.id, name: region.name });
                  }
                }
              }
            }
          }
        }
      }
    } else if (type === 'product') {
      const product = await getOneQuery(
        'SELECT p.*, cat.name as category_name, cat.parent_id FROM products p LEFT JOIN categories cat ON p.category_id = cat.id WHERE p.id = ?',
        [id]
      );
      
      if (product) {
        breadcrumbs.push({ level: 'product', id: product.id, name: product.name });
        
        if (product.category_id) {
          let currentCategoryId = product.category_id;
          
          while (currentCategoryId) {
            const category = await getOneQuery(
              'SELECT * FROM categories WHERE id = ?',
              [currentCategoryId]
            );
            
            if (category) {
              breadcrumbs.unshift({ level: 'category', id: category.id, name: category.name });
              currentCategoryId = category.parent_id;
            } else {
              break;
            }
          }
        }
      }
    } else if (type === 'van') {
      const van = await getOneQuery(
        'SELECT v.*, vf.name as fleet_name FROM vans v LEFT JOIN van_fleets vf ON v.fleet_id = vf.id WHERE v.id = ?',
        [id]
      );
      
      if (van) {
        breadcrumbs.push({ level: 'van', id: van.id, name: van.registration_number });
        
        if (van.fleet_id) {
          const fleet = await getOneQuery('SELECT * FROM van_fleets WHERE id = ?', [van.fleet_id]);
          if (fleet) {
            breadcrumbs.unshift({ level: 'fleet', id: fleet.id, name: fleet.name });
          }
        }
      }
    }

    return breadcrumbs;
  }
}

module.exports = new HierarchyService();
