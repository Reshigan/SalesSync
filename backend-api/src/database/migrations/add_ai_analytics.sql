-- AI Analytics and Insights Tables

-- Predictive Models
CREATE TABLE IF NOT EXISTS ai_models (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'sales_forecast', 'demand_prediction', 'churn_prediction', 'price_optimization'
  model_version TEXT NOT NULL,
  algorithm TEXT NOT NULL, -- 'linear_regression', 'random_forest', 'neural_network', 'arima'
  training_data_period TEXT, -- JSON with start/end dates
  model_parameters TEXT, -- JSON with model configuration
  performance_metrics TEXT, -- JSON with accuracy, precision, recall, etc.
  status TEXT DEFAULT 'active', -- 'active', 'training', 'deprecated'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_trained_at DATETIME,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Sales Forecasts
CREATE TABLE IF NOT EXISTS sales_forecasts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  forecast_type TEXT NOT NULL, -- 'product', 'category', 'customer', 'region', 'agent'
  target_id TEXT NOT NULL, -- ID of the forecasted entity
  forecast_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
  forecast_date DATE NOT NULL,
  predicted_value REAL NOT NULL,
  confidence_interval_lower REAL,
  confidence_interval_upper REAL,
  confidence_score REAL, -- 0-1 scale
  actual_value REAL, -- filled when actual data becomes available
  accuracy_score REAL, -- calculated when actual vs predicted
  factors_influencing TEXT, -- JSON array of key factors
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (model_id) REFERENCES ai_models(id)
);

-- Demand Predictions
CREATE TABLE IF NOT EXISTS demand_predictions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  customer_id TEXT,
  region_id TEXT,
  prediction_date DATE NOT NULL,
  predicted_demand INTEGER NOT NULL,
  demand_category TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN predicted_demand <= 10 THEN 'low'
      WHEN predicted_demand <= 50 THEN 'medium'
      WHEN predicted_demand <= 100 THEN 'high'
      ELSE 'very_high'
    END
  ) STORED,
  seasonality_factor REAL,
  trend_factor REAL,
  promotional_impact REAL,
  external_factors TEXT, -- JSON with weather, events, etc.
  confidence_score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (model_id) REFERENCES ai_models(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Customer Insights
CREATE TABLE IF NOT EXISTS customer_insights (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  insight_type TEXT NOT NULL, -- 'churn_risk', 'lifetime_value', 'purchase_behavior', 'preference_analysis'
  insight_value REAL NOT NULL,
  insight_category TEXT,
  risk_level TEXT, -- 'low', 'medium', 'high' for churn risk
  recommended_actions TEXT, -- JSON array of suggested actions
  key_indicators TEXT, -- JSON with supporting metrics
  confidence_score REAL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Product Recommendations
CREATE TABLE IF NOT EXISTS product_recommendations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  recommendation_type TEXT NOT NULL, -- 'cross_sell', 'up_sell', 'reorder', 'new_product'
  recommendation_score REAL NOT NULL, -- 0-1 scale
  reasoning TEXT, -- JSON with explanation
  expected_revenue REAL,
  success_probability REAL,
  seasonal_relevance REAL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  is_active BOOLEAN DEFAULT 1,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Price Optimization
CREATE TABLE IF NOT EXISTS price_optimizations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  customer_segment TEXT, -- 'premium', 'standard', 'budget'
  current_price REAL NOT NULL,
  optimized_price REAL NOT NULL,
  price_change_percentage REAL GENERATED ALWAYS AS (
    CASE 
      WHEN current_price > 0 
      THEN ((optimized_price - current_price) * 100.0 / current_price)
      ELSE 0 
    END
  ) STORED,
  expected_demand_change REAL,
  expected_revenue_impact REAL,
  competitor_price_factor REAL,
  elasticity_coefficient REAL,
  optimization_reason TEXT, -- JSON with factors
  confidence_score REAL,
  effective_date DATE,
  expires_at DATETIME,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'implemented', 'rejected'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Business Intelligence Alerts
CREATE TABLE IF NOT EXISTS ai_alerts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'anomaly', 'opportunity', 'risk', 'trend'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT, -- 'product', 'customer', 'agent', 'region'
  entity_id TEXT,
  metrics TEXT, -- JSON with relevant metrics
  recommended_actions TEXT, -- JSON array
  alert_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at DATETIME,
  acknowledged_by TEXT,
  resolved_at DATETIME,
  resolution_notes TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (acknowledged_by) REFERENCES users(id)
);

-- Market Trends Analysis
CREATE TABLE IF NOT EXISTS market_trends (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  trend_type TEXT NOT NULL, -- 'sales_growth', 'market_share', 'customer_behavior', 'seasonal_pattern'
  category_id TEXT,
  product_id TEXT,
  region_id TEXT,
  trend_direction TEXT NOT NULL, -- 'increasing', 'decreasing', 'stable', 'volatile'
  trend_strength REAL, -- 0-1 scale
  trend_duration_days INTEGER,
  trend_data TEXT, -- JSON with historical data points
  statistical_significance REAL,
  key_drivers TEXT, -- JSON array of contributing factors
  business_impact TEXT, -- JSON with impact analysis
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Performance Benchmarks
CREATE TABLE IF NOT EXISTS performance_benchmarks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  benchmark_type TEXT NOT NULL, -- 'sales_performance', 'customer_satisfaction', 'operational_efficiency'
  entity_type TEXT NOT NULL, -- 'agent', 'region', 'product', 'customer'
  entity_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  current_value REAL NOT NULL,
  benchmark_value REAL NOT NULL,
  percentile_rank REAL, -- 0-100 percentile
  performance_rating TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN current_value >= benchmark_value * 1.2 THEN 'excellent'
      WHEN current_value >= benchmark_value * 1.1 THEN 'above_average'
      WHEN current_value >= benchmark_value * 0.9 THEN 'average'
      WHEN current_value >= benchmark_value * 0.8 THEN 'below_average'
      ELSE 'poor'
    END
  ) STORED,
  improvement_potential REAL,
  benchmark_period TEXT, -- 'monthly', 'quarterly', 'yearly'
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_date ON sales_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_target ON sales_forecasts(target_id);
CREATE INDEX IF NOT EXISTS idx_demand_predictions_product ON demand_predictions(product_id);
CREATE INDEX IF NOT EXISTS idx_demand_predictions_date ON demand_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_customer_insights_customer ON customer_insights(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_insights_type ON customer_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_customer ON product_recommendations(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_product ON product_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_price_optimizations_product ON price_optimizations(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_date ON ai_alerts(alert_date);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_severity ON ai_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_market_trends_type ON market_trends(trend_type);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_entity ON performance_benchmarks(entity_type, entity_id);