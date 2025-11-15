const express = require('express');
const router = express.Router();
const { getQuery, getOneQuery } = require('../../utils/database');

router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { from, to, interval = 'daily' } = req.query;

    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    const ordersSummary = await getOneQuery(`
      SELECT 
        SUM(order_count) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(avg_order_value) as avg_order_value
      FROM analytics.agg_orders_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
    `, [tenantId, fromDate, toDate]);

    const customersSummary = await getOneQuery(`
      SELECT 
        SUM(new_customers) as new_customers,
        AVG(active_customers) as avg_active_customers
      FROM analytics.agg_customers_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
    `, [tenantId, fromDate, toDate]);

    const fieldOpsSummary = await getOneQuery(`
      SELECT 
        SUM(board_placements_count) as total_board_placements,
        SUM(product_distributions_count) as total_product_distributions,
        AVG(avg_coverage_percentage) as avg_coverage
      FROM analytics.agg_field_ops_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
    `, [tenantId, fromDate, toDate]);

    const commissionsSummary = await getOneQuery(`
      SELECT 
        SUM(total_commissions) as total_commissions,
        SUM(pending_commissions) as pending_commissions,
        SUM(paid_commissions) as paid_commissions
      FROM analytics.agg_commissions_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
    `, [tenantId, fromDate, toDate]);

    const visitsSummary = await getOneQuery(`
      SELECT 
        SUM(visit_count) as total_visits,
        SUM(completed_visits) as completed_visits,
        AVG(avg_visits_per_agent) as avg_visits_per_agent
      FROM analytics.agg_visits_daily
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

    const ordersTrend = await getQuery(`
      SELECT 
        ${dateGrouping} as date,
        SUM(order_count) as orders,
        SUM(total_amount) as revenue
      FROM analytics.agg_orders_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
      GROUP BY ${dateGrouping}
      ORDER BY date
    `, [tenantId, fromDate, toDate]);

    const commissionsTrend = await getQuery(`
      SELECT 
        ${dateGrouping} as date,
        SUM(total_commissions) as total_commissions,
        SUM(pending_commissions) as pending,
        SUM(approved_commissions) as approved,
        SUM(paid_commissions) as paid
      FROM analytics.agg_commissions_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
      GROUP BY ${dateGrouping}
      ORDER BY date
    `, [tenantId, fromDate, toDate]);

    res.json({
      success: true,
      data: {
        summary: {
          orders: {
            total_orders: parseInt(ordersSummary?.total_orders || 0),
            total_revenue: parseFloat(ordersSummary?.total_revenue || 0),
            avg_order_value: parseFloat(ordersSummary?.avg_order_value || 0)
          },
          customers: {
            new_customers: parseInt(customersSummary?.new_customers || 0),
            avg_active_customers: parseFloat(customersSummary?.avg_active_customers || 0)
          },
          field_operations: {
            total_board_placements: parseInt(fieldOpsSummary?.total_board_placements || 0),
            total_product_distributions: parseInt(fieldOpsSummary?.total_product_distributions || 0),
            avg_coverage: parseFloat(fieldOpsSummary?.avg_coverage || 0)
          },
          commissions: {
            total_commissions: parseFloat(commissionsSummary?.total_commissions || 0),
            pending_commissions: parseFloat(commissionsSummary?.pending_commissions || 0),
            paid_commissions: parseFloat(commissionsSummary?.paid_commissions || 0)
          },
          visits: {
            total_visits: parseInt(visitsSummary?.total_visits || 0),
            completed_visits: parseInt(visitsSummary?.completed_visits || 0),
            avg_visits_per_agent: parseFloat(visitsSummary?.avg_visits_per_agent || 0)
          }
        },
        trends: {
          orders: ordersTrend,
          commissions: commissionsTrend
        },
        period: {
          from: fromDate,
          to: toDate,
          interval
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
