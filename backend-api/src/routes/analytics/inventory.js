const express = require('express');
const router = express.Router();
const { getQuery, getOneQuery } = require('../../utils/database');

router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { from, to, interval = 'daily' } = req.query;

    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    const kpis = await getOneQuery(`
      SELECT 
        AVG(total_stock_value) as avg_stock_value,
        SUM(stock_adjustments_count) as total_adjustments,
        SUM(stock_adjustments_value) as total_adjustment_value,
        AVG(out_of_stock_products) as avg_out_of_stock,
        AVG(low_stock_products) as avg_low_stock
      FROM analytics.agg_inventory_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
    `, [tenantId, fromDate, toDate]);

    let dateGrouping;
    if (interval === 'weekly') {
      dateGrouping = "DATE_TRUNC('week', date_id)";
    } else if (interval === 'monthly') {
      dateGrouping = "DATE_TRUNC('month', date_id)";
    } else {
      dateGrouping = 'date_id';
    }

    const timeSeries = await getQuery(`
      SELECT 
        ${dateGrouping} as date,
        AVG(total_stock_value) as stock_value,
        SUM(stock_adjustments_count) as adjustments,
        AVG(out_of_stock_products) as out_of_stock,
        AVG(low_stock_products) as low_stock
      FROM analytics.agg_inventory_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
      GROUP BY ${dateGrouping}
      ORDER BY date
    `, [tenantId, fromDate, toDate]);

    // Get current stock levels by warehouse
    const stockByWarehouse = await getQuery(`
      SELECT 
        w.name as warehouse_name,
        COUNT(DISTINCT i.product_id) as product_count,
        SUM(i.quantity) as total_quantity,
        SUM(i.quantity * p.price) as total_value
      FROM inventory i
      JOIN warehouses w ON w.id = i.warehouse_id
      JOIN products p ON p.id = i.product_id
      WHERE i.tenant_id = $1
      GROUP BY w.id, w.name
      ORDER BY total_value DESC
    `, [tenantId]);

    const lowStockProducts = await getQuery(`
      SELECT 
        p.name as product_name,
        p.sku,
        SUM(i.quantity) as total_quantity,
        p.min_stock_level,
        p.price
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      WHERE i.tenant_id = $1 AND i.quantity < p.min_stock_level
      GROUP BY p.id, p.name, p.sku, p.min_stock_level, p.price
      ORDER BY total_quantity ASC
      LIMIT 10
    `, [tenantId]);

    res.json({
      success: true,
      data: {
        kpis: {
          avg_stock_value: parseFloat(kpis?.avg_stock_value || 0),
          total_adjustments: parseInt(kpis?.total_adjustments || 0),
          total_adjustment_value: parseFloat(kpis?.total_adjustment_value || 0),
          avg_out_of_stock: parseFloat(kpis?.avg_out_of_stock || 0),
          avg_low_stock: parseFloat(kpis?.avg_low_stock || 0)
        },
        time_series: timeSeries,
        stock_by_warehouse: stockByWarehouse,
        low_stock_products: lowStockProducts,
        period: {
          from: fromDate,
          to: toDate,
          interval
        }
      }
    });
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
