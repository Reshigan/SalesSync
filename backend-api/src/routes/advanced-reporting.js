const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireFunction, requireRole } = require('../middleware/authMiddleware');

// Get report templates
router.get('/templates', requireFunction('reports', 'view'), async (req, res) => {
  try {
    const { template_type, category, is_public } = req.query;
    
    let query = `
      SELECT 
        rt.*,
        u.name as created_by_name
      FROM report_templates rt
      LEFT JOIN users u ON rt.created_by = u.id
      WHERE rt.tenant_id = ? AND rt.is_active = 1
    `;
    
    const params = [req.user.tenantId];
    
    if (template_type) {
      query += ' AND rt.template_type = ?';
      params.push(template_type);
    }
    
    if (category) {
      query += ' AND rt.category = ?';
      params.push(category);
    }
    
    if (is_public !== undefined) {
      query += ' AND rt.is_public = ?';
      params.push(is_public === 'true' ? 1 : 0);
    }
    
    query += ' ORDER BY rt.created_at DESC';
    
    const templates = await db.all(query, params);
    
    res.json({
      success: true,
      data: templates.map(template => ({
        ...template,
        data_sources: template.data_sources ? JSON.parse(template.data_sources) : [],
        fields_config: template.fields_config ? JSON.parse(template.fields_config) : {},
        filters_config: template.filters_config ? JSON.parse(template.filters_config) : {},
        grouping_config: template.grouping_config ? JSON.parse(template.grouping_config) : {},
        sorting_config: template.sorting_config ? JSON.parse(template.sorting_config) : {},
        chart_config: template.chart_config ? JSON.parse(template.chart_config) : {},
        layout_config: template.layout_config ? JSON.parse(template.layout_config) : {},
        permissions: template.permissions ? JSON.parse(template.permissions) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create report template
router.post('/templates', requireFunction('reports', 'create'), async (req, res) => {
  try {
    const {
      template_name,
      template_type,
      category,
      description,
      data_sources,
      fields_config,
      filters_config,
      grouping_config,
      sorting_config,
      chart_config,
      layout_config,
      permissions,
      is_public = false
    } = req.body;
    
    if (!template_name || !template_type || !category || !data_sources || !fields_config) {
      return res.status(400).json({ 
        success: false, 
        error: 'Template name, type, category, data sources, and fields config are required' 
      });
    }
    
    const templateId = require('crypto').randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO report_templates (
        id, tenant_id, template_name, template_type, category, description,
        data_sources, fields_config, filters_config, grouping_config,
        sorting_config, chart_config, layout_config, permissions,
        is_public, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      templateId,
      req.user.tenantId,
      template_name,
      template_type,
      category,
      description,
      JSON.stringify(data_sources),
      JSON.stringify(fields_config),
      JSON.stringify(filters_config || {}),
      JSON.stringify(grouping_config || {}),
      JSON.stringify(sorting_config || {}),
      JSON.stringify(chart_config || {}),
      JSON.stringify(layout_config || {}),
      JSON.stringify(permissions || {}),
      is_public ? 1 : 0,
      req.user.userId
    ]);
    
    const template = await db.get(`
      SELECT rt.*, u.name as created_by_name
      FROM report_templates rt
      LEFT JOIN users u ON rt.created_by = u.id
      WHERE rt.id = ?
    `, [templateId]);
    
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error creating report template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate report from template
router.post('/templates/:id/generate', requireFunction('reports', 'create'), async (req, res) => {
  try {
    const { parameters, filters, export_format = 'json' } = req.body;
    
    const template = await db.get(`
      SELECT * FROM report_templates 
      WHERE id = ? AND tenant_id = ? AND is_active = 1
    `, [req.params.id, req.user.tenantId]);
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    const reportId = require('crypto').randomBytes(16).toString('hex');
    
    // Generate report data based on template configuration
    const reportData = await generateReportData(template, parameters, filters, req.user.tenantId);
    
    await db.run(`
      INSERT INTO generated_reports (
        id, tenant_id, template_id, report_name, parameters,
        filters_applied, data_snapshot, file_format, status, generated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reportId,
      req.user.tenantId,
      req.params.id,
      `${template.template_name} - ${new Date().toISOString().split('T')[0]}`,
      JSON.stringify(parameters || {}),
      JSON.stringify(filters || {}),
      JSON.stringify(reportData),
      export_format,
      'completed',
      req.user.userId
    ]);
    
    // Log analytics
    await db.run(`
      INSERT INTO report_analytics (
        tenant_id, template_id, action_type, user_id, parameters
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      req.user.tenantId,
      req.params.id,
      'generate',
      req.user.userId,
      JSON.stringify({ export_format, filters, parameters })
    ]);
    
    const report = await db.get(`
      SELECT gr.*, rt.template_name
      FROM generated_reports gr
      LEFT JOIN report_templates rt ON gr.template_id = rt.id
      WHERE gr.id = ?
    `, [reportId]);
    
    res.status(201).json({
      success: true,
      data: {
        ...report,
        data_snapshot: JSON.parse(report.data_snapshot),
        parameters: JSON.parse(report.parameters),
        filters_applied: JSON.parse(report.filters_applied)
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get generated reports
router.get('/generated', requireFunction('reports', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 20, template_id, status } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        gr.*,
        rt.template_name,
        u.name as generated_by_name
      FROM generated_reports gr
      LEFT JOIN report_templates rt ON gr.template_id = rt.id
      LEFT JOIN users u ON gr.generated_by = u.id
      WHERE gr.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (template_id) {
      query += ' AND gr.template_id = ?';
      params.push(template_id);
    }
    
    if (status) {
      query += ' AND gr.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY gr.generated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const reports = await db.all(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM generated_reports WHERE tenant_id = ?';
    const countParams = [req.user.tenantId];
    
    if (template_id) {
      countQuery += ' AND template_id = ?';
      countParams.push(template_id);
    }
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const { total } = await db.get(countQuery, countParams);
    
    res.json({
      success: true,
      data: reports.map(report => ({
        ...report,
        parameters: report.parameters ? JSON.parse(report.parameters) : {},
        filters_applied: report.filters_applied ? JSON.parse(report.filters_applied) : {}
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching generated reports:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get custom dashboards
router.get('/dashboards', requireFunction('reports', 'view'), async (req, res) => {
  try {
    const { dashboard_type, is_public } = req.query;
    
    let query = `
      SELECT 
        cd.*,
        u.name as created_by_name,
        COUNT(dw.id) as widget_count
      FROM custom_dashboards cd
      LEFT JOIN users u ON cd.created_by = u.id
      LEFT JOIN dashboard_widgets dw ON cd.id = dw.dashboard_id AND dw.is_active = 1
      WHERE cd.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (dashboard_type) {
      query += ' AND cd.dashboard_type = ?';
      params.push(dashboard_type);
    }
    
    if (is_public !== undefined) {
      query += ' AND cd.is_public = ?';
      params.push(is_public === 'true' ? 1 : 0);
    }
    
    query += ' GROUP BY cd.id ORDER BY cd.created_at DESC';
    
    const dashboards = await db.all(query, params);
    
    res.json({
      success: true,
      data: dashboards.map(dashboard => ({
        ...dashboard,
        layout_config: dashboard.layout_config ? JSON.parse(dashboard.layout_config) : {},
        widgets_config: dashboard.widgets_config ? JSON.parse(dashboard.widgets_config) : [],
        filters_config: dashboard.filters_config ? JSON.parse(dashboard.filters_config) : {},
        permissions: dashboard.permissions ? JSON.parse(dashboard.permissions) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching custom dashboards:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create custom dashboard
router.post('/dashboards', requireFunction('reports', 'create'), async (req, res) => {
  try {
    const {
      dashboard_name,
      dashboard_type,
      description,
      layout_config,
      widgets_config,
      filters_config,
      refresh_interval = 300,
      is_default = false,
      is_public = false,
      permissions
    } = req.body;
    
    if (!dashboard_name || !dashboard_type || !layout_config) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dashboard name, type, and layout config are required' 
      });
    }
    
    const dashboardId = require('crypto').randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO custom_dashboards (
        id, tenant_id, dashboard_name, dashboard_type, description,
        layout_config, widgets_config, filters_config, refresh_interval,
        is_default, is_public, permissions, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dashboardId,
      req.user.tenantId,
      dashboard_name,
      dashboard_type,
      description,
      JSON.stringify(layout_config),
      JSON.stringify(widgets_config || []),
      JSON.stringify(filters_config || {}),
      refresh_interval,
      is_default ? 1 : 0,
      is_public ? 1 : 0,
      JSON.stringify(permissions || {}),
      req.user.userId
    ]);
    
    const dashboard = await db.get(`
      SELECT cd.*, u.name as created_by_name
      FROM custom_dashboards cd
      LEFT JOIN users u ON cd.created_by = u.id
      WHERE cd.id = ?
    `, [dashboardId]);
    
    res.status(201).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error creating custom dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get dashboard widgets
router.get('/dashboards/:id/widgets', requireFunction('reports', 'view'), async (req, res) => {
  try {
    const widgets = await db.all(`
      SELECT * FROM dashboard_widgets 
      WHERE dashboard_id = ? AND tenant_id = ? AND is_active = 1
      ORDER BY json_extract(position_config, '$.row'), json_extract(position_config, '$.col')
    `, [req.params.id, req.user.tenantId]);
    
    res.json({
      success: true,
      data: widgets.map(widget => ({
        ...widget,
        data_source: widget.data_source ? JSON.parse(widget.data_source) : {},
        query_config: widget.query_config ? JSON.parse(widget.query_config) : {},
        display_config: widget.display_config ? JSON.parse(widget.display_config) : {},
        position_config: widget.position_config ? JSON.parse(widget.position_config) : {},
        size_config: widget.size_config ? JSON.parse(widget.size_config) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard widgets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add widget to dashboard
router.post('/dashboards/:id/widgets', requireFunction('reports', 'create'), async (req, res) => {
  try {
    const {
      widget_name,
      widget_type,
      chart_type,
      data_source,
      query_config,
      display_config,
      position_config,
      size_config,
      refresh_interval = 300
    } = req.body;
    
    if (!widget_name || !widget_type || !data_source || !query_config) {
      return res.status(400).json({ 
        success: false, 
        error: 'Widget name, type, data source, and query config are required' 
      });
    }
    
    const widgetId = require('crypto').randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO dashboard_widgets (
        id, tenant_id, dashboard_id, widget_name, widget_type, chart_type,
        data_source, query_config, display_config, position_config,
        size_config, refresh_interval
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      widgetId,
      req.user.tenantId,
      req.params.id,
      widget_name,
      widget_type,
      chart_type,
      JSON.stringify(data_source),
      JSON.stringify(query_config),
      JSON.stringify(display_config || {}),
      JSON.stringify(position_config || {}),
      JSON.stringify(size_config || {}),
      refresh_interval
    ]);
    
    const widget = await db.get('SELECT * FROM dashboard_widgets WHERE id = ?', [widgetId]);
    
    res.status(201).json({
      success: true,
      data: widget
    });
  } catch (error) {
    console.error('Error adding dashboard widget:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get performance metrics
router.get('/metrics', requireFunction('reports', 'view'), async (req, res) => {
  try {
    const { metric_category, is_active } = req.query;
    
    let query = `
      SELECT 
        pm.*,
        u.name as created_by_name,
        COUNT(mv.id) as value_count,
        MAX(mv.period_date) as last_calculated_date
      FROM performance_metrics pm
      LEFT JOIN users u ON pm.created_by = u.id
      LEFT JOIN metric_values mv ON pm.id = mv.metric_id
      WHERE pm.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (metric_category) {
      query += ' AND pm.metric_category = ?';
      params.push(metric_category);
    }
    
    if (is_active !== undefined) {
      query += ' AND pm.is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }
    
    query += ' GROUP BY pm.id ORDER BY pm.created_at DESC';
    
    const metrics = await db.all(query, params);
    
    res.json({
      success: true,
      data: metrics.map(metric => ({
        ...metric,
        data_source: metric.data_source ? JSON.parse(metric.data_source) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get metric values
router.get('/metrics/:id/values', requireFunction('reports', 'view'), async (req, res) => {
  try {
    const { start_date, end_date, limit = 100 } = req.query;
    
    let query = `
      SELECT * FROM metric_values 
      WHERE metric_id = ? AND tenant_id = ?
    `;
    
    const params = [req.params.id, req.user.tenantId];
    
    if (start_date && end_date) {
      query += ' AND period_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    query += ' ORDER BY period_date DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const values = await db.all(query, params);
    
    res.json({
      success: true,
      data: values.map(value => ({
        ...value,
        calculation_details: value.calculation_details ? JSON.parse(value.calculation_details) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching metric values:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get benchmark comparisons
router.get('/benchmarks', requireFunction('reports', 'view'), async (req, res) => {
  try {
    const { entity_type, entity_id, comparison_type } = req.query;
    
    let query = `
      SELECT 
        bc.*,
        CASE bc.entity_type
          WHEN 'agent' THEN a.name
          WHEN 'product' THEN p.name
          WHEN 'customer' THEN c.name
          ELSE bc.entity_id
        END as entity_name
      FROM benchmark_comparisons bc
      LEFT JOIN users a ON bc.entity_type = 'agent' AND bc.entity_id = a.id
      LEFT JOIN products p ON bc.entity_type = 'product' AND bc.entity_id = p.id
      LEFT JOIN customers c ON bc.entity_type = 'customer' AND bc.entity_id = c.id
      WHERE bc.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (entity_type) {
      query += ' AND bc.entity_type = ?';
      params.push(entity_type);
    }
    
    if (entity_id) {
      query += ' AND bc.entity_id = ?';
      params.push(entity_id);
    }
    
    if (comparison_type) {
      query += ' AND bc.comparison_type = ?';
      params.push(comparison_type);
    }
    
    query += ' ORDER BY bc.created_at DESC LIMIT 100';
    
    const benchmarks = await db.all(query, params);
    
    res.json({
      success: true,
      data: benchmarks.map(benchmark => ({
        ...benchmark,
        baseline_period: benchmark.baseline_period ? JSON.parse(benchmark.baseline_period) : {},
        comparison_period: benchmark.comparison_period ? JSON.parse(benchmark.comparison_period) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching benchmark comparisons:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get reporting analytics
router.get('/analytics', requireFunction('reports', 'view'), async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    
    // Most used templates
    const popularTemplates = await db.all(`
      SELECT 
        rt.template_name,
        rt.template_type,
        COUNT(ra.id) as usage_count,
        AVG(ra.execution_time_ms) as avg_execution_time
      FROM report_analytics ra
      LEFT JOIN report_templates rt ON ra.template_id = rt.id
      WHERE ra.tenant_id = ? AND ra.timestamp >= date('now', '-${period} days')
      AND ra.template_id IS NOT NULL
      GROUP BY ra.template_id
      ORDER BY usage_count DESC
      LIMIT 10
    `, [req.user.tenantId]);
    
    // Most viewed dashboards
    const popularDashboards = await db.all(`
      SELECT 
        cd.dashboard_name,
        cd.dashboard_type,
        COUNT(ra.id) as view_count
      FROM report_analytics ra
      LEFT JOIN custom_dashboards cd ON ra.dashboard_id = cd.id
      WHERE ra.tenant_id = ? AND ra.timestamp >= date('now', '-${period} days')
      AND ra.dashboard_id IS NOT NULL
      GROUP BY ra.dashboard_id
      ORDER BY view_count DESC
      LIMIT 10
    `, [req.user.tenantId]);
    
    // Usage by action type
    const actionStats = await db.all(`
      SELECT 
        action_type,
        COUNT(*) as count,
        AVG(execution_time_ms) as avg_execution_time
      FROM report_analytics 
      WHERE tenant_id = ? AND timestamp >= date('now', '-${period} days')
      GROUP BY action_type
      ORDER BY count DESC
    `, [req.user.tenantId]);
    
    // Daily usage trend
    const usageTrend = await db.all(`
      SELECT 
        timestamp::date as date,
        COUNT(*) as total_actions,
        COUNT(DISTINCT user_id) as unique_users
      FROM report_analytics 
      WHERE tenant_id = ? AND timestamp >= date('now', '-${period} days')
      GROUP BY timestamp::date
      ORDER BY date DESC
    `, [req.user.tenantId]);
    
    res.json({
      success: true,
      data: {
        popular_templates: popularTemplates,
        popular_dashboards: popularDashboards,
        action_stats: actionStats,
        usage_trend: usageTrend
      }
    });
  } catch (error) {
    console.error('Error fetching reporting analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to generate report data
async function generateReportData(template, parameters, filters, tenantId) {
  try {
    const dataSources = JSON.parse(template.data_sources);
    const fieldsConfig = JSON.parse(template.fields_config);
    
    // This is a simplified report generation - in production you'd have more sophisticated query building
    let baseQuery = '';
    let queryParams = [tenantId];
    
    if (template.template_type === 'sales') {
      baseQuery = `
        SELECT 
          o.id,
          o.order_date,
          o.total_amount,
          c.name as customer_name,
          a.name as agent_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN users a ON o.agent_id = a.id
        WHERE o.tenant_id = ?
      `;
      
      if (filters && filters.start_date && filters.end_date) {
        baseQuery += ' AND o.order_date BETWEEN ? AND ?';
        queryParams.push(filters.start_date, filters.end_date);
      }
      
      if (filters && filters.customer_id) {
        baseQuery += ' AND o.customer_id = ?';
        queryParams.push(filters.customer_id);
      }
      
    } else if (template.template_type === 'inventory') {
      baseQuery = `
        SELECT 
          p.id,
          p.name as product_name,
          p.sku,
          i.quantity_available,
          i.reorder_level
        FROM products p
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.tenant_id = ?
      `;
      
    } else if (template.template_type === 'customer') {
      baseQuery = `
        SELECT 
          c.id,
          c.name,
          c.email,
          c.phone,
          COUNT(o.id) as total_orders,
          SUM(o.total_amount) as total_spent
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        WHERE c.tenant_id = ?
        GROUP BY c.id
      `;
    }
    
    baseQuery += ' ORDER BY 1 DESC LIMIT 1000';
    
    const data = await db.all(baseQuery, queryParams);
    
    return {
      template_info: {
        name: template.template_name,
        type: template.template_type,
        generated_at: new Date().toISOString()
      },
      parameters: parameters || {},
      filters: filters || {},
      data: data,
      summary: {
        total_records: data.length,
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error generating report data:', error);
    throw error;
  }
}

module.exports = router;