import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'salessync-api',
  version: process.env.npm_package_version || '1.0.0',
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

const databaseOperations = new promClient.Counter({
  name: 'database_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'table', 'status'],
});

const databaseOperationDuration = new promClient.Histogram({
  name: 'database_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
});

const authenticationAttempts = new promClient.Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status', 'method'],
});

const businessMetrics = {
  ordersTotal: new promClient.Counter({
    name: 'orders_total',
    help: 'Total number of orders created',
    labelNames: ['tenant', 'status'],
  }),
  
  usersActive: new promClient.Gauge({
    name: 'users_active',
    help: 'Number of active users',
    labelNames: ['tenant', 'role'],
  }),
  
  revenueTotal: new promClient.Counter({
    name: 'revenue_total',
    help: 'Total revenue generated',
    labelNames: ['tenant', 'currency'],
  }),
};

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseOperations);
register.registerMetric(databaseOperationDuration);
register.registerMetric(authenticationAttempts);
register.registerMetric(businessMetrics.ordersTotal);
register.registerMetric(businessMetrics.usersActive);
register.registerMetric(businessMetrics.revenueTotal);

// Middleware to collect HTTP metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Increment active connections
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode.toString();
    
    // Record metrics
    httpRequestDuration
      .labels(method, route, statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(method, route, statusCode)
      .inc();
    
    // Decrement active connections
    activeConnections.dec();
  });
  
  next();
};

// Metrics endpoint handler
export const metricsHandler = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
};

// Helper functions to record custom metrics
export const recordDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  success: boolean = true
) => {
  const status = success ? 'success' : 'error';
  
  databaseOperations
    .labels(operation, table, status)
    .inc();
  
  if (success) {
    databaseOperationDuration
      .labels(operation, table)
      .observe(duration / 1000);
  }
};

export const recordAuthenticationAttempt = (status: 'success' | 'failure', method: string) => {
  authenticationAttempts
    .labels(status, method)
    .inc();
};

export const recordOrder = (tenantId: string, status: string) => {
  businessMetrics.ordersTotal
    .labels(tenantId, status)
    .inc();
};

export const updateActiveUsers = (tenantId: string, role: string, count: number) => {
  businessMetrics.usersActive
    .labels(tenantId, role)
    .set(count);
};

export const recordRevenue = (tenantId: string, currency: string, amount: number) => {
  businessMetrics.revenueTotal
    .labels(tenantId, currency)
    .inc(amount);
};

export { register };