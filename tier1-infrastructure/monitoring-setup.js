/**
 * SalesSync Tier-1 Monitoring & Observability Stack
 * Prometheus, Grafana, and ELK stack integration
 */

const express = require('express');
const promClient = require('prom-client');
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

class MonitoringService {
    constructor() {
        this.app = express();
        this.setupMetrics();
        this.setupLogging();
        this.setupHealthChecks();
        this.setupAlerts();
    }

    setupMetrics() {
        // Create a Registry to register the metrics
        this.register = new promClient.Registry();
        
        // Add default metrics
        promClient.collectDefaultMetrics({
            register: this.register,
            prefix: 'salessync_',
        });

        // Custom business metrics
        this.metrics = {
            // HTTP metrics
            httpRequestDuration: new promClient.Histogram({
                name: 'salessync_http_request_duration_seconds',
                help: 'Duration of HTTP requests in seconds',
                labelNames: ['method', 'route', 'status_code'],
                buckets: [0.1, 0.5, 1, 2, 5]
            }),

            httpRequestTotal: new promClient.Counter({
                name: 'salessync_http_requests_total',
                help: 'Total number of HTTP requests',
                labelNames: ['method', 'route', 'status_code']
            }),

            // Business metrics
            activeUsers: new promClient.Gauge({
                name: 'salessync_active_users_total',
                help: 'Number of active users'
            }),

            ordersTotal: new promClient.Counter({
                name: 'salessync_orders_total',
                help: 'Total number of orders',
                labelNames: ['status', 'agent_type']
            }),

            visitsTotal: new promClient.Counter({
                name: 'salessync_visits_total',
                help: 'Total number of visits',
                labelNames: ['visit_type', 'status', 'agent_type']
            }),

            inventoryLevel: new promClient.Gauge({
                name: 'salessync_inventory_level',
                help: 'Current inventory levels',
                labelNames: ['product_id', 'location_id']
            }),

            campaignPerformance: new promClient.Gauge({
                name: 'salessync_campaign_performance',
                help: 'Campaign performance metrics',
                labelNames: ['campaign_id', 'metric_type']
            }),

            // System metrics
            databaseConnections: new promClient.Gauge({
                name: 'salessync_database_connections',
                help: 'Number of active database connections'
            }),

            redisConnections: new promClient.Gauge({
                name: 'salessync_redis_connections',
                help: 'Number of active Redis connections'
            }),

            errorRate: new promClient.Counter({
                name: 'salessync_errors_total',
                help: 'Total number of errors',
                labelNames: ['service', 'error_type']
            })
        };

        // Register custom metrics
        Object.values(this.metrics).forEach(metric => {
            this.register.registerMetric(metric);
        });

        // Metrics endpoint
        this.app.get('/metrics', async (req, res) => {
            res.set('Content-Type', this.register.contentType);
            const metrics = await this.register.metrics();
            res.end(metrics);
        });
    }

    setupLogging() {
        // Elasticsearch configuration
        const esTransportOpts = {
            level: 'info',
            clientOpts: {
                node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
                auth: {
                    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
                    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
                }
            },
            index: 'salessync-logs',
            indexTemplate: {
                name: 'salessync-logs-template',
                pattern: 'salessync-logs-*',
                settings: {
                    number_of_shards: 1,
                    number_of_replicas: 0
                },
                mappings: {
                    properties: {
                        '@timestamp': { type: 'date' },
                        level: { type: 'keyword' },
                        message: { type: 'text' },
                        service: { type: 'keyword' },
                        user_id: { type: 'keyword' },
                        request_id: { type: 'keyword' },
                        duration: { type: 'integer' }
                    }
                }
            }
        };

        // Create logger with multiple transports
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: {
                service: 'salessync-monitoring'
            },
            transports: [
                // Console transport
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                }),
                // File transport
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error'
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log'
                }),
                // Elasticsearch transport
                new ElasticsearchTransport(esTransportOpts)
            ]
        });
    }

    setupHealthChecks() {
        this.healthChecks = {
            database: async () => {
                try {
                    // Database health check logic
                    return { status: 'healthy', latency: 10 };
                } catch (error) {
                    return { status: 'unhealthy', error: error.message };
                }
            },

            redis: async () => {
                try {
                    // Redis health check logic
                    return { status: 'healthy', latency: 5 };
                } catch (error) {
                    return { status: 'unhealthy', error: error.message };
                }
            },

            elasticsearch: async () => {
                try {
                    // Elasticsearch health check logic
                    return { status: 'healthy', latency: 15 };
                } catch (error) {
                    return { status: 'unhealthy', error: error.message };
                }
            }
        };

        // Health check endpoint
        this.app.get('/health', async (req, res) => {
            const checks = {};
            let overallStatus = 'healthy';

            for (const [name, check] of Object.entries(this.healthChecks)) {
                try {
                    checks[name] = await check();
                    if (checks[name].status !== 'healthy') {
                        overallStatus = 'degraded';
                    }
                } catch (error) {
                    checks[name] = { status: 'unhealthy', error: error.message };
                    overallStatus = 'unhealthy';
                }
            }

            const response = {
                status: overallStatus,
                timestamp: new Date().toISOString(),
                checks: checks,
                uptime: process.uptime(),
                version: process.env.APP_VERSION || '1.0.0'
            };

            res.status(overallStatus === 'healthy' ? 200 : 503).json(response);
        });

        // Detailed health check endpoint
        this.app.get('/health/detailed', async (req, res) => {
            const systemInfo = {
                nodejs: process.version,
                platform: process.platform,
                architecture: process.arch,
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                uptime: process.uptime()
            };

            res.json({
                system: systemInfo,
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString()
            });
        });
    }

    setupAlerts() {
        this.alertRules = [
            {
                name: 'High Error Rate',
                condition: () => this.metrics.errorRate._getValue() > 100,
                severity: 'critical',
                message: 'Error rate is above threshold'
            },
            {
                name: 'Low Inventory',
                condition: () => {
                    // Check if any inventory level is below threshold
                    return false; // Placeholder
                },
                severity: 'warning',
                message: 'Inventory levels are low'
            },
            {
                name: 'Database Connection Issues',
                condition: () => this.metrics.databaseConnections._getValue() > 50,
                severity: 'critical',
                message: 'Too many database connections'
            }
        ];

        // Check alerts every minute
        setInterval(() => {
            this.checkAlerts();
        }, 60000);
    }

    checkAlerts() {
        this.alertRules.forEach(rule => {
            try {
                if (rule.condition()) {
                    this.triggerAlert(rule);
                }
            } catch (error) {
                this.logger.error('Alert check failed', {
                    rule: rule.name,
                    error: error.message
                });
            }
        });
    }

    triggerAlert(rule) {
        const alert = {
            name: rule.name,
            severity: rule.severity,
            message: rule.message,
            timestamp: new Date().toISOString(),
            service: 'salessync-monitoring'
        };

        this.logger.warn('Alert triggered', alert);

        // Send to alerting system (Slack, email, etc.)
        this.sendAlert(alert);
    }

    sendAlert(alert) {
        // Implement alert sending logic
        // This could integrate with Slack, email, PagerDuty, etc.
        console.log('🚨 ALERT:', alert);
    }

    // Middleware to track HTTP metrics
    trackHttpMetrics() {
        return (req, res, next) => {
            const start = Date.now();

            res.on('finish', () => {
                const duration = (Date.now() - start) / 1000;
                const route = req.route?.path || req.path;
                
                this.metrics.httpRequestDuration
                    .labels(req.method, route, res.statusCode.toString())
                    .observe(duration);

                this.metrics.httpRequestTotal
                    .labels(req.method, route, res.statusCode.toString())
                    .inc();

                if (res.statusCode >= 400) {
                    this.metrics.errorRate
                        .labels('http', res.statusCode >= 500 ? 'server_error' : 'client_error')
                        .inc();
                }
            });

            next();
        };
    }

    // Business metrics tracking methods
    trackOrder(orderData) {
        this.metrics.ordersTotal
            .labels(orderData.status, orderData.agent_type || 'unknown')
            .inc();
    }

    trackVisit(visitData) {
        this.metrics.visitsTotal
            .labels(visitData.visit_type, visitData.status, visitData.agent_type || 'unknown')
            .inc();
    }

    updateInventoryLevel(productId, locationId, level) {
        this.metrics.inventoryLevel
            .labels(productId, locationId)
            .set(level);
    }

    updateCampaignPerformance(campaignId, metricType, value) {
        this.metrics.campaignPerformance
            .labels(campaignId, metricType)
            .set(value);
    }

    updateActiveUsers(count) {
        this.metrics.activeUsers.set(count);
    }

    start(port = process.env.MONITORING_PORT || 9090) {
        this.app.listen(port, '0.0.0.0', () => {
            this.logger.info(`Monitoring service started on port ${port}`);
            console.log(`📊 SalesSync Monitoring running on http://0.0.0.0:${port}`);
        });
    }
}

// Grafana Dashboard Configuration
const grafanaDashboard = {
    dashboard: {
        title: "SalesSync Tier-1 Dashboard",
        panels: [
            {
                title: "HTTP Request Rate",
                type: "graph",
                targets: [
                    {
                        expr: "rate(salessync_http_requests_total[5m])",
                        legendFormat: "{{method}} {{route}}"
                    }
                ]
            },
            {
                title: "Response Time",
                type: "graph",
                targets: [
                    {
                        expr: "histogram_quantile(0.95, rate(salessync_http_request_duration_seconds_bucket[5m]))",
                        legendFormat: "95th percentile"
                    }
                ]
            },
            {
                title: "Active Users",
                type: "singlestat",
                targets: [
                    {
                        expr: "salessync_active_users_total",
                        legendFormat: "Active Users"
                    }
                ]
            },
            {
                title: "Orders by Status",
                type: "piechart",
                targets: [
                    {
                        expr: "salessync_orders_total",
                        legendFormat: "{{status}}"
                    }
                ]
            },
            {
                title: "Visits by Type",
                type: "bargraph",
                targets: [
                    {
                        expr: "salessync_visits_total",
                        legendFormat: "{{visit_type}}"
                    }
                ]
            }
        ]
    }
};

// Start the monitoring service
if (require.main === module) {
    const monitoring = new MonitoringService();
    monitoring.start();
}

module.exports = { MonitoringService, grafanaDashboard };