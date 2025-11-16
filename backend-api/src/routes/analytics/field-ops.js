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
        SUM(board_placements_count) as total_board_placements,
        SUM(product_distributions_count) as total_product_distributions,
        AVG(avg_coverage_percentage) as avg_coverage,
        SUM(gps_compliant_placements) as gps_compliant_placements,
        SUM(photos_attached_count) as photos_attached,
        AVG(unique_agents) as avg_agents_per_day
      FROM analytics.agg_field_ops_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
    `, [tenantId, fromDate, toDate]);

    const gpsComplianceRate = kpis?.total_board_placements > 0
      ? (kpis.gps_compliant_placements / kpis.total_board_placements * 100).toFixed(2)
      : 0;
    
    const photoAttachmentRate = (kpis?.total_board_placements + kpis?.total_product_distributions) > 0
      ? (kpis.photos_attached / (kpis.total_board_placements + kpis.total_product_distributions) * 100).toFixed(2)
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
        SUM(board_placements_count) as board_placements,
        SUM(product_distributions_count) as product_distributions,
        AVG(avg_coverage_percentage) as avg_coverage,
        SUM(gps_compliant_placements) as gps_compliant,
        SUM(photos_attached_count) as photos_attached
      FROM analytics.agg_field_ops_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
      GROUP BY ${dateGrouping}
      ORDER BY date
    `, [tenantId, fromDate, toDate]);

    const topAgents = await getQuery(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as agent_name,
        COUNT(DISTINCT bp.id) as board_placements,
        COUNT(DISTINCT pd.id) as product_distributions,
        COUNT(DISTINCT bp.id) + COUNT(DISTINCT pd.id) as total_activities
      FROM users u
      LEFT JOIN board_placements bp ON bp.created_by = u.id AND bp.tenant_id = $1 
        AND bp.created_at::date BETWEEN $2 AND $3
      LEFT JOIN product_distributions pd ON pd.created_by = u.id AND pd.tenant_id = $1
        AND pd.created_at::date BETWEEN $2 AND $3
      WHERE u.tenant_id = $1 AND u.role = 'agent'
      GROUP BY u.id, u.first_name, u.last_name
      HAVING COUNT(DISTINCT bp.id) + COUNT(DISTINCT pd.id) > 0
      ORDER BY total_activities DESC
      LIMIT 10
    `, [tenantId, fromDate, toDate]);

    res.json({
      success: true,
      data: {
        kpis: {
          total_board_placements: parseInt(kpis?.total_board_placements || 0),
          total_product_distributions: parseInt(kpis?.total_product_distributions || 0),
          avg_coverage_percentage: parseFloat(kpis?.avg_coverage || 0),
          gps_compliance_rate: parseFloat(gpsComplianceRate),
          photo_attachment_rate: parseFloat(photoAttachmentRate),
          avg_agents_per_day: parseFloat(kpis?.avg_agents_per_day || 0)
        },
        time_series: timeSeries,
        top_agents: topAgents,
        period: {
          from: fromDate,
          to: toDate,
          interval
        }
      }
    });
  } catch (error) {
    console.error('Error fetching field ops analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/boards', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { from, to } = req.query;

    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    const byBoardType = await getQuery(`
      SELECT 
        b.name as board_type,
        COUNT(bp.id) as placement_count,
        AVG(bp.coverage_percentage) as avg_coverage
      FROM board_placements bp
      JOIN boards b ON b.id = bp.board_id
      WHERE bp.tenant_id = $1 AND bp.created_at::date BETWEEN $2 AND $3
      GROUP BY b.id, b.name
      ORDER BY placement_count DESC
    `, [tenantId, fromDate, toDate]);

    res.json({
      success: true,
      data: {
        by_board_type: byBoardType,
        period: {
          from: fromDate,
          to: toDate
        }
      }
    });
  } catch (error) {
    console.error('Error fetching board analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
