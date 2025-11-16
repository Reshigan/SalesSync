const express = require('express');
const router = express.Router();
const { getQuery, getOneQuery } = require('../../utils/database');

router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { from, to, interval = 'daily', group_by } = req.query;

    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    const kpis = await getOneQuery(`
      SELECT 
        SUM(order_count) as total_orders,
        SUM(total_amount) as gross_revenue,
        SUM(total_units) as total_units,
        AVG(avg_order_value) as avg_order_value,
        SUM(unique_customers) as unique_customers,
        SUM(new_customers) as new_customers,
        SUM(repeat_customers) as repeat_customers
      FROM analytics.agg_orders_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
    `, [tenantId, fromDate, toDate]);

    const daysDiff = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24));
    const priorFromDate = new Date(new Date(fromDate) - daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const priorToDate = fromDate;

    const priorKpis = await getOneQuery(`
      SELECT 
        SUM(order_count) as total_orders,
        SUM(total_amount) as gross_revenue
      FROM analytics.agg_orders_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
    `, [tenantId, priorFromDate, priorToDate]);

    const orderGrowth = priorKpis?.total_orders > 0 
      ? ((kpis.total_orders - priorKpis.total_orders) / priorKpis.total_orders * 100).toFixed(2)
      : 0;
    const revenueGrowth = priorKpis?.gross_revenue > 0
      ? ((kpis.gross_revenue - priorKpis.gross_revenue) / priorKpis.gross_revenue * 100).toFixed(2)
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
        SUM(order_count) as orders,
        SUM(total_amount) as revenue,
        SUM(total_units) as units,
        AVG(avg_order_value) as aov
      FROM analytics.agg_orders_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
      GROUP BY ${dateGrouping}
      ORDER BY date
    `, [tenantId, fromDate, toDate]);

    const filledTimeSeries = [];
    const currentDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existing = timeSeries.find(t => new Date(t.date).toISOString().split('T')[0] === dateStr);
      
      filledTimeSeries.push({
        date: dateStr,
        orders: parseInt(existing?.orders || 0),
        revenue: parseFloat(existing?.revenue || 0),
        units: parseInt(existing?.units || 0),
        aov: parseFloat(existing?.aov || 0)
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      data: {
        kpis: {
          total_orders: parseInt(kpis?.total_orders || 0),
          gross_revenue: parseFloat(kpis?.gross_revenue || 0),
          total_units: parseInt(kpis?.total_units || 0),
          avg_order_value: parseFloat(kpis?.avg_order_value || 0),
          unique_customers: parseInt(kpis?.unique_customers || 0),
          new_customers: parseInt(kpis?.new_customers || 0),
          repeat_customers: parseInt(kpis?.repeat_customers || 0),
          order_growth_pct: parseFloat(orderGrowth),
          revenue_growth_pct: parseFloat(revenueGrowth)
        },
        time_series: filledTimeSeries,
        period: {
          from: fromDate,
          to: toDate,
          interval
        }
      }
    });
  } catch (error) {
    console.error('Error fetching orders analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
