class APMService {
  constructor() {
    this.metrics = {
      requests: [],
      errors: [],
      dbQueries: []
    };
    this.maxMetrics = 1000;
  }

  trackRequest(req, res, duration) {
    this.metrics.requests.push({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date(),
      tenantId: req.tenantId
    });

    if (this.metrics.requests.length > this.maxMetrics) {
      this.metrics.requests.shift();
    }
  }

  trackError(error, req) {
    this.metrics.errors.push({
      message: error.message,
      stack: error.stack,
      path: req?.path,
      method: req?.method,
      timestamp: new Date(),
      tenantId: req?.tenantId
    });

    if (this.metrics.errors.length > this.maxMetrics) {
      this.metrics.errors.shift();
    }
  }

  trackDbQuery(query, duration) {
    this.metrics.dbQueries.push({
      query: query.substring(0, 200),
      duration,
      timestamp: new Date()
    });

    if (this.metrics.dbQueries.length > this.maxMetrics) {
      this.metrics.dbQueries.shift();
    }
  }

  getMetrics() {
    const now = Date.now();
    const last5Min = now - 5 * 60 * 1000;

    const recentRequests = this.metrics.requests.filter(r => r.timestamp.getTime() > last5Min);
    const recentErrors = this.metrics.errors.filter(e => e.timestamp.getTime() > last5Min);
    const recentQueries = this.metrics.dbQueries.filter(q => q.timestamp.getTime() > last5Min);

    return {
      requests: {
        total: recentRequests.length,
        avgDuration: recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length || 0,
        p95Duration: this.calculatePercentile(recentRequests.map(r => r.duration), 95),
        p99Duration: this.calculatePercentile(recentRequests.map(r => r.duration), 99),
        byStatus: this.groupBy(recentRequests, 'statusCode')
      },
      errors: {
        total: recentErrors.length,
        byType: this.groupBy(recentErrors, 'message')
      },
      dbQueries: {
        total: recentQueries.length,
        avgDuration: recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length || 0,
        slowQueries: recentQueries.filter(q => q.duration > 100).length
      }
    };
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  groupBy(array, key) {
    return array.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  middleware() {
    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        this.trackRequest(req, res, duration);
      });

      next();
    };
  }
}

module.exports = new APMService();
