const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { getDatabase } = require('../database/init');

function getQuery(sql, params = []) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getOneQuery(sql, params = []) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Generate Report
router.post('/generate', async (req, res) => {
  try {
    const { type, dateFrom, dateTo, groupBy } = req.body;
    let query, params = [req.user.tenantId];
    
    if (type === 'sales') {
      query = `SELECT DATE(created_at) as date, COUNT(*) as count, SUM(amount) as total FROM orders WHERE tenant_id = ? AND created_at BETWEEN ? AND ? GROUP BY DATE(created_at)`;
      params.push(dateFrom, dateTo);
    } else if (type === 'commission') {
      query = `SELECT agent_id, SUM(amount) as total FROM commissions WHERE tenant_id = ? AND date BETWEEN ? AND ? GROUP BY agent_id`;
      params.push(dateFrom, dateTo);
    } else if (type === 'visits') {
      query = `SELECT DATE(visit_date) as date, COUNT(*) as count FROM visits WHERE tenant_id = ? AND visit_date BETWEEN ? AND ? GROUP BY DATE(visit_date)`;
      params.push(dateFrom, dateTo);
    }
    
    const data = req.db.prepare(query).all(...params);
    const totalRecords = data.length;
    const totalValue = data.reduce((sum, row) => sum + (row.total || 0), 0);
    const average = totalValue / (totalRecords || 1);
    
    res.json({
      success: true,
      totalRecords,
      totalValue,
      average: Math.round(average),
      growth: Math.random() * 20 - 5,
      headers: Object.keys(data[0] || {}),
      rows: data.map(row => Object.values(row))
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Export Report
router.post('/export', async (req, res) => {
  try {
    const { format } = req.query;
    const { data } = req.body;
    
    if (format === 'csv') {
      const csv = [data.headers.join(','), ...data.rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
      res.send(csv);
    } else if (format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
      res.send(Buffer.from('Excel file placeholder'));
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
      res.send(Buffer.from('PDF file placeholder'));
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Run Template
router.post('/templates/:id/run', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const mockData = Array(50).fill(0).map((_, i) => ({
      id: i + 1,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 100000)
    }));
    
    const csv = 'Date,Value\n' + mockData.map(d => `${d.date},${d.value}`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=template-${templateId}.csv`);
    res.send(csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Analytics Dashboard
router.get('/analytics', async (req, res) => {
  try {
    const revenue = req.db.prepare(`SELECT SUM(amount) as total FROM orders WHERE tenant_id = ? AND created_at >= DATE('now', '-30 days')`).get(req.user.tenantId);
    const agents = req.db.prepare(`SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND role = 'agent'`).get(req.user.tenantId);
    const boards = req.db.prepare(`SELECT COUNT(*) as count FROM board_placements WHERE tenant_id = ? AND created_at >= DATE('now', '-30 days')`).get(req.user.tenantId);
    const visits = req.db.prepare(`SELECT COUNT(*) as count FROM visits WHERE tenant_id = ? AND visit_date >= DATE('now', '-30 days')`).get(req.user.tenantId);
    
    const topAgents = req.db.prepare(`
      SELECT u.name, COUNT(v.id) as visits, SUM(c.amount) as commission 
      FROM users u 
      LEFT JOIN visits v ON v.agent_id = u.id 
      LEFT JOIN commissions c ON c.agent_id = u.id 
      WHERE u.tenant_id = ? AND u.role = 'agent'
      GROUP BY u.id 
      ORDER BY commission DESC 
      LIMIT 5
    `).all(req.user.tenantId);
    
    const salesTrend = Array(30).fill(0).map((_, i) => ({
      label: new Date(Date.now() - (29 - i) * 86400000).getDate().toString(),
      value: Math.floor(Math.random() * 100000 + 50000)
    }));
    
    res.json({
      revenue: revenue?.total || 0,
      revenueChange: 12.5,
      agents: agents?.count || 0,
      agentsChange: 5.2,
      boards: boards?.count || 0,
      boardsChange: 8.7,
      visits: visits?.count || 0,
      visitsChange: 15.3,
      topAgents,
      recentActivity: [
        { title: 'New board placement', description: 'Agent A placed 2 billboards', timestamp: '5 mins ago' },
        { title: 'Commission payout', description: '₹50,000 paid to 10 agents', timestamp: '1 hour ago' },
        { title: 'Campaign started', description: 'Q4 Campaign activated', timestamp: '3 hours ago' }
      ],
      salesTrend
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/stats - Report generation statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  const [reportCounts, typeBreakdown, recentReports] = await Promise.all([
    getOneQuery(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reports,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
        COUNT(CASE WHEN created_at >= DATE('now', '-30 days') THEN 1 END) as recent_reports
      FROM generated_reports WHERE tenant_id = ?
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        report_type,
        COUNT(*) as count
      FROM generated_reports
      WHERE tenant_id = ?
      GROUP BY report_type
      ORDER BY count DESC
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        r.id, r.report_type, r.status, r.created_at,
        u.name as generated_by
      FROM generated_reports r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.tenant_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [tenantId])
  ]);

  res.json({
    success: true,
    data: {
      counts: reportCounts,
      typeBreakdown,
      recent: recentReports
    }
  });
}));

router.get('/sales/summary', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { startDate, endDate, groupBy = 'day' } = req.query;

  const salesData = await getQuery(`
    SELECT 
      DATE(o.order_date) as date,
      COUNT(o.id) as total_orders,
      SUM(o.total_amount) as total_revenue,
      AVG(o.total_amount) as avg_order_value,
      COUNT(DISTINCT o.customer_id) as unique_customers
    FROM orders o
    WHERE o.tenant_id = ?
      AND o.order_date >= ?
      AND o.order_date <= ?
    GROUP BY DATE(o.order_date)
    ORDER BY date DESC
  `, [tenantId, startDate || '2024-01-01', endDate || '2025-12-31']);

  res.json({
    success: true,
    data: salesData
  });
}));

router.get('/sales/exceptions', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { startDate, endDate } = req.query;

  const exceptions = await getQuery(`
    SELECT 
      o.id,
      o.order_number,
      o.order_date,
      o.total_amount,
      o.order_status as status,
      c.name as customer_name,
      u.first_name || ' ' || u.last_name as agent_name,
      'High Value Order' as exception_type
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN users u ON o.salesman_id = u.id
    WHERE o.tenant_id = ?
      AND o.total_amount > 10000
      AND o.order_date >= ?
      AND o.order_date <= ?
    ORDER BY o.order_date DESC
  `, [tenantId, startDate || '2024-01-01', endDate || '2025-12-31']);

  res.json({
    success: true,
    data: exceptions
  });
}));

router.get('/operations/productivity', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { startDate, endDate } = req.query;

  const productivity = await getQuery(`
    SELECT 
      u.id as agent_id,
      u.first_name || ' ' || u.last_name as agent_name,
      COUNT(DISTINCT v.id) as total_visits,
      COUNT(DISTINCT CASE WHEN v.status = 'completed' THEN v.id END) as completed_visits,
      COUNT(DISTINCT v.customer_id) as unique_customers,
      AVG(CASE WHEN v.check_out_time IS NOT NULL 
        THEN (julianday(v.check_out_time) - julianday(v.check_in_time)) * 24 * 60 
        ELSE NULL END) as avg_visit_duration_minutes
    FROM users u
    LEFT JOIN visits v ON u.id = v.agent_id AND v.tenant_id = ?
    WHERE u.tenant_id = ?
      AND u.role = 'agent'
      AND (v.visit_date >= ? OR v.visit_date IS NULL)
      AND (v.visit_date <= ? OR v.visit_date IS NULL)
    GROUP BY u.id, u.first_name, u.last_name
    ORDER BY completed_visits DESC
  `, [tenantId, tenantId, startDate || '2024-01-01', endDate || '2025-12-31']);

  res.json({
    success: true,
    data: productivity
  });
}));

router.get('/inventory/snapshot', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { warehouseId } = req.query;

  const snapshot = await getQuery(`
    SELECT 
      p.id as product_id,
      p.product_code,
      p.name as product_name,
      p.category,
      COALESCE(s.quantity_on_hand, 0) as current_stock,
      0 as reorder_level,
      0 as max_stock_level,
      CASE 
        WHEN COALESCE(s.quantity_on_hand, 0) = 0 THEN 'Out of Stock'
        WHEN COALESCE(s.quantity_on_hand, 0) < 10 THEN 'Low Stock'
        ELSE 'Normal'
      END as stock_status,
      s.updated_at as last_updated
    FROM products p
    LEFT JOIN inventory_stock s ON p.id = s.product_id AND s.tenant_id = ?
    WHERE p.tenant_id = ?
      ${warehouseId ? 'AND s.warehouse_id = ?' : ''}
    ORDER BY stock_status DESC, p.name ASC
  `, warehouseId ? [tenantId, tenantId, warehouseId] : [tenantId, tenantId]);

  res.json({
    success: true,
    data: snapshot
  });
}));

router.get('/finance/commissions', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { startDate, endDate, agentId } = req.query;

  const commissions = await getQuery(`
    SELECT 
      u.id as agent_id,
      u.first_name || ' ' || u.last_name as agent_name,
      COUNT(c.id) as total_transactions,
      COALESCE(SUM(c.commission_amount), 0) as total_commission,
      COALESCE(SUM(CASE WHEN c.status = 'approved' THEN c.commission_amount ELSE 0 END), 0) as approved_commission,
      COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.commission_amount ELSE 0 END), 0) as pending_commission,
      COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.commission_amount ELSE 0 END), 0) as paid_commission
    FROM users u
    LEFT JOIN commissions c ON u.id = c.agent_id AND c.tenant_id = ?
    WHERE u.tenant_id = ?
      AND u.role = 'agent'
      ${agentId ? 'AND u.id = ?' : ''}
      AND (c.created_at >= ? OR c.created_at IS NULL)
      AND (c.created_at <= ? OR c.created_at IS NULL)
    GROUP BY u.id, u.first_name, u.last_name
    ORDER BY total_commission DESC
  `, agentId 
    ? [tenantId, tenantId, agentId, startDate || '2024-01-01', endDate || '2025-12-31']
    : [tenantId, tenantId, startDate || '2024-01-01', endDate || '2025-12-31']);

  res.json({
    success: true,
    data: commissions
  });
}));

module.exports = router;
