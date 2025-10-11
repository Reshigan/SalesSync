const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireFunction, requireRole } = require('../middleware/authMiddleware');

// Get AI dashboard overview
router.get('/dashboard', requireFunction('analytics', 'view'), async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    
    // Active AI models
    const activeModels = await db.all(`
      SELECT model_type, COUNT(*) as count, AVG(
        CASE 
          WHEN json_extract(performance_metrics, '$.accuracy') IS NOT NULL 
          THEN CAST(json_extract(performance_metrics, '$.accuracy') AS REAL)
          ELSE 0 
        END
      ) as avg_accuracy
      FROM ai_models 
      WHERE tenant_id = ? AND status = 'active'
      GROUP BY model_type
    `, [req.user.tenantId]);
    
    // Recent alerts
    const recentAlerts = await db.all(`
      SELECT alert_type, severity, COUNT(*) as count
      FROM ai_alerts 
      WHERE tenant_id = ? AND alert_date >= date('now', '-${period} days')
      AND resolved_at IS NULL
      GROUP BY alert_type, severity
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          ELSE 4 
        END
    `, [req.user.tenantId]);
    
    // Forecast accuracy
    const forecastAccuracy = await db.get(`
      SELECT 
        AVG(accuracy_score) as avg_accuracy,
        COUNT(*) as total_forecasts,
        COUNT(CASE WHEN accuracy_score >= 0.8 THEN 1 END) as high_accuracy_count
      FROM sales_forecasts 
      WHERE tenant_id = ? AND actual_value IS NOT NULL
      AND forecast_date >= date('now', '-${period} days')
    `, [req.user.tenantId]);
    
    // Top insights
    const topInsights = await db.all(`
      SELECT 
        ci.insight_type,
        COUNT(*) as count,
        AVG(ci.confidence_score) as avg_confidence,
        c.name as customer_name
      FROM customer_insights ci
      LEFT JOIN customers c ON ci.customer_id = c.id
      WHERE ci.tenant_id = ? AND ci.generated_at >= date('now', '-${period} days')
      GROUP BY ci.insight_type
      ORDER BY count DESC
      LIMIT 5
    `, [req.user.tenantId]);
    
    res.json({
      success: true,
      data: {
        active_models: activeModels,
        recent_alerts: recentAlerts,
        forecast_accuracy: forecastAccuracy,
        top_insights: topInsights
      }
    });
  } catch (error) {
    console.error('Error fetching AI dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sales forecasts
router.get('/forecasts', requireFunction('analytics', 'view'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      forecast_type, 
      target_id, 
      period,
      start_date,
      end_date 
    } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        sf.*,
        am.model_name,
        am.algorithm,
        CASE sf.forecast_type
          WHEN 'product' THEN p.name
          WHEN 'customer' THEN c.name
          WHEN 'agent' THEN a.name
          ELSE sf.target_id
        END as target_name
      FROM sales_forecasts sf
      LEFT JOIN ai_models am ON sf.model_id = am.id
      LEFT JOIN products p ON sf.forecast_type = 'product' AND sf.target_id = p.id
      LEFT JOIN customers c ON sf.forecast_type = 'customer' AND sf.target_id = c.id
      LEFT JOIN agents a ON sf.forecast_type = 'agent' AND sf.target_id = a.id
      WHERE sf.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (forecast_type) {
      query += ' AND sf.forecast_type = ?';
      params.push(forecast_type);
    }
    
    if (target_id) {
      query += ' AND sf.target_id = ?';
      params.push(target_id);
    }
    
    if (period) {
      query += ' AND sf.forecast_period = ?';
      params.push(period);
    }
    
    if (start_date && end_date) {
      query += ' AND sf.forecast_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    query += ' ORDER BY sf.forecast_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const forecasts = await db.all(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM sales_forecasts WHERE tenant_id = ?';
    const countParams = [req.user.tenantId];
    
    if (forecast_type) {
      countQuery += ' AND forecast_type = ?';
      countParams.push(forecast_type);
    }
    
    if (target_id) {
      countQuery += ' AND target_id = ?';
      countParams.push(target_id);
    }
    
    if (period) {
      countQuery += ' AND forecast_period = ?';
      countParams.push(period);
    }
    
    if (start_date && end_date) {
      countQuery += ' AND forecast_date BETWEEN ? AND ?';
      countParams.push(start_date, end_date);
    }
    
    const { total } = await db.get(countQuery, countParams);
    
    res.json({
      success: true,
      data: forecasts.map(f => ({
        ...f,
        factors_influencing: f.factors_influencing ? JSON.parse(f.factors_influencing) : []
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sales forecasts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate sales forecast
router.post('/forecasts/generate', requireFunction('analytics', 'create'), async (req, res) => {
  try {
    const { forecast_type, target_id, forecast_period, periods_ahead = 12 } = req.body;
    
    if (!forecast_type || !target_id || !forecast_period) {
      return res.status(400).json({ 
        success: false, 
        error: 'Forecast type, target ID, and forecast period are required' 
      });
    }
    
    // Get or create AI model for this forecast type
    let model = await db.get(`
      SELECT * FROM ai_models 
      WHERE tenant_id = ? AND model_type = 'sales_forecast' AND status = 'active'
      ORDER BY last_trained_at DESC LIMIT 1
    `, [req.user.tenantId]);
    
    if (!model) {
      // Create a basic model
      const modelId = require('crypto').randomBytes(16).toString('hex');
      await db.run(`
        INSERT INTO ai_models (
          id, tenant_id, model_name, model_type, model_version, algorithm,
          performance_metrics, last_trained_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        modelId,
        req.user.tenantId,
        `Sales Forecast Model - ${forecast_type}`,
        'sales_forecast',
        '1.0',
        'linear_regression',
        JSON.stringify({ accuracy: 0.75, mae: 0.15 }),
        new Date().toISOString()
      ]);
      
      model = await db.get('SELECT * FROM ai_models WHERE id = ?', [modelId]);
    }
    
    // Get historical data for forecasting
    const historicalData = await getHistoricalSalesData(req.user.tenantId, forecast_type, target_id, forecast_period);
    
    // Generate forecasts using simple trend analysis
    const forecasts = generateSimpleForecasts(historicalData, periods_ahead, forecast_period);
    
    // Save forecasts to database
    const savedForecasts = [];
    for (const forecast of forecasts) {
      const forecastId = require('crypto').randomBytes(16).toString('hex');
      
      await db.run(`
        INSERT INTO sales_forecasts (
          id, tenant_id, model_id, forecast_type, target_id, forecast_period,
          forecast_date, predicted_value, confidence_interval_lower, 
          confidence_interval_upper, confidence_score, factors_influencing
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        forecastId,
        req.user.tenantId,
        model.id,
        forecast_type,
        target_id,
        forecast_period,
        forecast.date,
        forecast.predicted_value,
        forecast.confidence_interval_lower,
        forecast.confidence_interval_upper,
        forecast.confidence_score,
        JSON.stringify(forecast.factors_influencing)
      ]);
      
      savedForecasts.push({ id: forecastId, ...forecast });
    }
    
    res.status(201).json({
      success: true,
      data: savedForecasts,
      message: `Generated ${savedForecasts.length} forecast periods`
    });
  } catch (error) {
    console.error('Error generating sales forecast:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get customer insights
router.get('/insights/customers', requireFunction('analytics', 'view'), async (req, res) => {
  try {
    const { customer_id, insight_type, risk_level } = req.query;
    
    let query = `
      SELECT 
        ci.*,
        c.name as customer_name,
        c.email as customer_email
      FROM customer_insights ci
      LEFT JOIN customers c ON ci.customer_id = c.id
      WHERE ci.tenant_id = ? AND (ci.expires_at IS NULL OR ci.expires_at > datetime('now'))
    `;
    
    const params = [req.user.tenantId];
    
    if (customer_id) {
      query += ' AND ci.customer_id = ?';
      params.push(customer_id);
    }
    
    if (insight_type) {
      query += ' AND ci.insight_type = ?';
      params.push(insight_type);
    }
    
    if (risk_level) {
      query += ' AND ci.risk_level = ?';
      params.push(risk_level);
    }
    
    query += ' ORDER BY ci.generated_at DESC LIMIT 50';
    
    const insights = await db.all(query, params);
    
    res.json({
      success: true,
      data: insights.map(insight => ({
        ...insight,
        recommended_actions: insight.recommended_actions ? JSON.parse(insight.recommended_actions) : [],
        key_indicators: insight.key_indicators ? JSON.parse(insight.key_indicators) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching customer insights:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate customer insights
router.post('/insights/customers/generate', requireFunction('analytics', 'create'), async (req, res) => {
  try {
    const { customer_id, insight_types } = req.body;
    
    if (!customer_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer ID is required' 
      });
    }
    
    const typesToGenerate = insight_types || ['churn_risk', 'lifetime_value', 'purchase_behavior'];
    const generatedInsights = [];
    
    for (const insightType of typesToGenerate) {
      const insight = await generateCustomerInsight(req.user.tenantId, customer_id, insightType);
      
      if (insight) {
        const insightId = require('crypto').randomBytes(16).toString('hex');
        
        await db.run(`
          INSERT INTO customer_insights (
            id, tenant_id, customer_id, insight_type, insight_value,
            insight_category, risk_level, recommended_actions, key_indicators,
            confidence_score, expires_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          insightId,
          req.user.tenantId,
          customer_id,
          insightType,
          insight.value,
          insight.category,
          insight.risk_level,
          JSON.stringify(insight.recommended_actions),
          JSON.stringify(insight.key_indicators),
          insight.confidence_score,
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        ]);
        
        generatedInsights.push({ id: insightId, ...insight });
      }
    }
    
    res.status(201).json({
      success: true,
      data: generatedInsights,
      message: `Generated ${generatedInsights.length} customer insights`
    });
  } catch (error) {
    console.error('Error generating customer insights:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get product recommendations
router.get('/recommendations/products', requireFunction('analytics', 'view'), async (req, res) => {
  try {
    const { customer_id, recommendation_type, min_score } = req.query;
    
    let query = `
      SELECT 
        pr.*,
        c.name as customer_name,
        p.name as product_name,
        p.sku as product_sku
      FROM product_recommendations pr
      LEFT JOIN customers c ON pr.customer_id = c.id
      LEFT JOIN products p ON pr.product_id = p.id
      WHERE pr.tenant_id = ? AND pr.is_active = 1 
      AND (pr.expires_at IS NULL OR pr.expires_at > datetime('now'))
    `;
    
    const params = [req.user.tenantId];
    
    if (customer_id) {
      query += ' AND pr.customer_id = ?';
      params.push(customer_id);
    }
    
    if (recommendation_type) {
      query += ' AND pr.recommendation_type = ?';
      params.push(recommendation_type);
    }
    
    if (min_score) {
      query += ' AND pr.recommendation_score >= ?';
      params.push(parseFloat(min_score));
    }
    
    query += ' ORDER BY pr.recommendation_score DESC LIMIT 50';
    
    const recommendations = await db.all(query, params);
    
    res.json({
      success: true,
      data: recommendations.map(rec => ({
        ...rec,
        reasoning: rec.reasoning ? JSON.parse(rec.reasoning) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching product recommendations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AI alerts
router.get('/alerts', requireFunction('analytics', 'view'), async (req, res) => {
  try {
    const { severity, alert_type, unresolved_only = 'true' } = req.query;
    
    let query = `
      SELECT 
        aa.*,
        u.name as acknowledged_by_name
      FROM ai_alerts aa
      LEFT JOIN users u ON aa.acknowledged_by = u.id
      WHERE aa.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (severity) {
      query += ' AND aa.severity = ?';
      params.push(severity);
    }
    
    if (alert_type) {
      query += ' AND aa.alert_type = ?';
      params.push(alert_type);
    }
    
    if (unresolved_only === 'true') {
      query += ' AND aa.resolved_at IS NULL';
    }
    
    query += ' ORDER BY aa.alert_date DESC LIMIT 100';
    
    const alerts = await db.all(query, params);
    
    res.json({
      success: true,
      data: alerts.map(alert => ({
        ...alert,
        metrics: alert.metrics ? JSON.parse(alert.metrics) : {},
        recommended_actions: alert.recommended_actions ? JSON.parse(alert.recommended_actions) : []
      }))
    });
  } catch (error) {
    console.error('Error fetching AI alerts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Acknowledge alert
router.put('/alerts/:id/acknowledge', requireFunction('analytics', 'edit'), async (req, res) => {
  try {
    await db.run(`
      UPDATE ai_alerts 
      SET acknowledged_at = CURRENT_TIMESTAMP, acknowledged_by = ?
      WHERE id = ? AND tenant_id = ?
    `, [req.user.userId, req.params.id, req.user.tenantId]);
    
    res.json({ success: true, message: 'Alert acknowledged successfully' });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get market trends
router.get('/trends', requireFunction('analytics', 'view'), async (req, res) => {
  try {
    const { trend_type, trend_direction, category_id } = req.query;
    
    let query = `
      SELECT 
        mt.*,
        c.name as category_name,
        p.name as product_name
      FROM market_trends mt
      LEFT JOIN categories c ON mt.category_id = c.id
      LEFT JOIN products p ON mt.product_id = p.id
      WHERE mt.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (trend_type) {
      query += ' AND mt.trend_type = ?';
      params.push(trend_type);
    }
    
    if (trend_direction) {
      query += ' AND mt.trend_direction = ?';
      params.push(trend_direction);
    }
    
    if (category_id) {
      query += ' AND mt.category_id = ?';
      params.push(category_id);
    }
    
    query += ' ORDER BY mt.detected_at DESC LIMIT 50';
    
    const trends = await db.all(query, params);
    
    res.json({
      success: true,
      data: trends.map(trend => ({
        ...trend,
        trend_data: trend.trend_data ? JSON.parse(trend.trend_data) : [],
        key_drivers: trend.key_drivers ? JSON.parse(trend.key_drivers) : [],
        business_impact: trend.business_impact ? JSON.parse(trend.business_impact) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching market trends:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get performance benchmarks
router.get('/benchmarks', requireFunction('analytics', 'view'), async (req, res) => {
  try {
    const { entity_type, entity_id, benchmark_type } = req.query;
    
    let query = `
      SELECT 
        pb.*,
        CASE pb.entity_type
          WHEN 'agent' THEN a.name
          WHEN 'product' THEN p.name
          WHEN 'customer' THEN c.name
          ELSE pb.entity_id
        END as entity_name
      FROM performance_benchmarks pb
      LEFT JOIN agents a ON pb.entity_type = 'agent' AND pb.entity_id = a.id
      LEFT JOIN products p ON pb.entity_type = 'product' AND pb.entity_id = p.id
      LEFT JOIN customers c ON pb.entity_type = 'customer' AND pb.entity_id = c.id
      WHERE pb.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (entity_type) {
      query += ' AND pb.entity_type = ?';
      params.push(entity_type);
    }
    
    if (entity_id) {
      query += ' AND pb.entity_id = ?';
      params.push(entity_id);
    }
    
    if (benchmark_type) {
      query += ' AND pb.benchmark_type = ?';
      params.push(benchmark_type);
    }
    
    query += ' ORDER BY pb.calculated_at DESC LIMIT 100';
    
    const benchmarks = await db.all(query, params);
    
    res.json({
      success: true,
      data: benchmarks
    });
  } catch (error) {
    console.error('Error fetching performance benchmarks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions
async function getHistoricalSalesData(tenantId, forecastType, targetId, period) {
  // This would typically fetch actual sales data from transactions
  // For now, return mock data
  const mockData = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    
    mockData.push({
      date: date.toISOString().split('T')[0],
      value: Math.random() * 1000 + 500 + (i * 50) // Trending upward with noise
    });
  }
  
  return mockData;
}

function generateSimpleForecasts(historicalData, periodsAhead, forecastPeriod) {
  const forecasts = [];
  
  if (historicalData.length === 0) {
    return forecasts;
  }
  
  // Simple linear trend calculation
  const values = historicalData.map(d => d.value);
  const n = values.length;
  const sumX = (n * (n + 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  
  for (let i = 1; i <= periodsAhead; i++) {
    const forecastDate = new Date(lastDate);
    
    if (forecastPeriod === 'monthly') {
      forecastDate.setMonth(forecastDate.getMonth() + i);
    } else if (forecastPeriod === 'weekly') {
      forecastDate.setDate(forecastDate.getDate() + (i * 7));
    } else {
      forecastDate.setDate(forecastDate.getDate() + i);
    }
    
    const predictedValue = intercept + slope * (n + i);
    const confidence = Math.max(0.5, 1 - (i * 0.05)); // Decreasing confidence over time
    
    forecasts.push({
      date: forecastDate.toISOString().split('T')[0],
      predicted_value: Math.max(0, predictedValue),
      confidence_interval_lower: Math.max(0, predictedValue * 0.8),
      confidence_interval_upper: predictedValue * 1.2,
      confidence_score: confidence,
      factors_influencing: ['historical_trend', 'seasonal_pattern']
    });
  }
  
  return forecasts;
}

async function generateCustomerInsight(tenantId, customerId, insightType) {
  // Mock insight generation - in production this would use ML models
  const insights = {
    churn_risk: {
      value: Math.random() * 100,
      category: Math.random() > 0.7 ? 'high_risk' : Math.random() > 0.4 ? 'medium_risk' : 'low_risk',
      risk_level: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
      recommended_actions: ['increase_engagement', 'offer_discount', 'personal_outreach'],
      key_indicators: { last_purchase_days: 45, engagement_score: 0.3, support_tickets: 2 },
      confidence_score: 0.85
    },
    lifetime_value: {
      value: Math.random() * 5000 + 1000,
      category: 'high_value',
      risk_level: 'low',
      recommended_actions: ['upsell_premium', 'loyalty_program', 'referral_incentive'],
      key_indicators: { avg_order_value: 250, purchase_frequency: 0.8, tenure_months: 18 },
      confidence_score: 0.92
    },
    purchase_behavior: {
      value: Math.random() * 10,
      category: 'frequent_buyer',
      risk_level: 'low',
      recommended_actions: ['cross_sell', 'bulk_discount', 'early_access'],
      key_indicators: { seasonal_pattern: 'summer_peak', preferred_categories: ['electronics', 'home'] },
      confidence_score: 0.78
    }
  };
  
  return insights[insightType] || null;
}

module.exports = router;