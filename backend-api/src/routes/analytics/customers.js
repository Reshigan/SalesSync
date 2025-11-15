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
        SUM(new_customers) as new_customers,
        AVG(active_customers) as avg_active_customers,
        MAX(total_customers) as total_customers,
        SUM(customers_with_orders) as customers_with_orders
      FROM analytics.agg_customers_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
    `, [tenantId, fromDate, toDate]);

    const repeatCustomerRate = kpis?.customers_with_orders > 0 && kpis?.total_customers > 0
      ? (kpis.customers_with_orders / kpis.total_customers * 100).toFixed(2)
      : 0;

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
        SUM(new_customers) as new_customers,
        AVG(active_customers) as active_customers,
        MAX(total_customers) as total_customers
      FROM analytics.agg_customers_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
      GROUP BY ${dateGrouping}
      ORDER BY date
    `, [tenantId, fromDate, toDate]);

    const topCustomers = await getQuery(`
      SELECT 
        c.id,
        c.name,
        COUNT(DISTINCT o.id) as order_count,
        SUM(o.total_amount) as total_revenue,
        MAX(o.created_at) as last_order_date
      FROM customers c
      JOIN orders o ON o.customer_id = c.id
      WHERE c.tenant_id = $1 AND o.created_at::date BETWEEN $2 AND $3
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `, [tenantId, fromDate, toDate]);

    res.json({
      success: true,
      data: {
        kpis: {
          new_customers: parseInt(kpis?.new_customers || 0),
          avg_active_customers: parseFloat(kpis?.avg_active_customers || 0),
          total_customers: parseInt(kpis?.total_customers || 0),
          customers_with_orders: parseInt(kpis?.customers_with_orders || 0),
          repeat_customer_rate: parseFloat(repeatCustomerRate)
        },
        time_series: timeSeries,
        top_customers: topCustomers,
        period: {
          from: fromDate,
          to: toDate,
          interval
        }
      }
    });
  } catch (error) {
    console.error('Error fetching customers analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
