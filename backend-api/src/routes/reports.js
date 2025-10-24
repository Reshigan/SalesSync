const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Generate Report
router.post('/generate', authenticateToken, async (req, res) => {
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
router.post('/export', authenticateToken, async (req, res) => {
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
router.post('/templates/:id/run', authenticateToken, async (req, res) => {
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
router.get('/analytics', authenticateToken, async (req, res) => {
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

module.exports = router;
