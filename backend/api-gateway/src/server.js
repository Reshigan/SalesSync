// Enterprise API Gateway Server - Production Ready
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const { createProxyMiddleware } = require('http-proxy-middleware')
const jwt = require('jsonwebtoken')
const Redis = require('ioredis')
const { Pool } = require('pg')
const winston = require('winston')
const prometheus = require('prom-client')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json')

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 3001

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Initialize PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/salessync'
})

// Initialize Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

// Prometheus metrics
const register = new prometheus.Registry()
prometheus.collectDefaultMetrics({ register })

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
})

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
})

register.registerMetric(httpRequestDuration)
register.registerMetric(httpRequestsTotal)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://app.salessync.com', 'https://admin.salessync.com']
    : ['http://localhost:3000', 'http://localhost:12000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
}))

// Compression
app.use(compression())

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: new (require('rate-limit-redis'))({
    client: redis,
    prefix: 'rl:'
  })
})

app.use('/api/', limiter)

// Request logging and metrics
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const route = req.route ? req.route.path : req.path
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration)
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc()
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    })
  })
  
  next()
})

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    // Check if token is blacklisted
    const blacklisted = await redis.get(`blacklist:${token}`)
    if (blacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user from database
    const userResult = await pool.query(
      'SELECT id, email, role, status FROM users WHERE id = $1',
      [decoded.userId]
    )
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' })
    }
    
    const user = userResult.rows[0]
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'User account is not active' })
    }
    
    req.user = user
    next()
  } catch (error) {
    logger.error('Authentication error:', error)
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

// Role-based authorization middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    next()
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1')
    
    // Check Redis connection
    await redis.ping()
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'connected',
        redis: 'connected'
      }
    })
  } catch (error) {
    logger.error('Health check failed:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    
    // Get user from database
    const userResult = await pool.query(
      'SELECT id, email, password_hash, role, status, first_name, last_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    )
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const user = userResult.rows[0]
    
    // Verify password (you would use bcrypt in production)
    const bcrypt = require('bcrypt')
    const validPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' })
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    // Store refresh token in Redis
    await redis.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, refreshToken)
    
    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    )
    
    logger.info('User logged in', { userId: user.id, email: user.email })
    
    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      }
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }
    
    // Check if refresh token exists in Redis
    const storedToken = await redis.get(`refresh:${decoded.userId}`)
    if (storedToken !== refreshToken) {
      return res.status(401).json({ error: 'Refresh token not found or expired' })
    }
    
    // Get user from database
    const userResult = await pool.query(
      'SELECT id, email, role, status FROM users WHERE id = $1',
      [decoded.userId]
    )
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' })
    }
    
    const user = userResult.rows[0]
    
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' })
    }
    
    // Generate new access token
    const newToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    res.json({ token: newToken })
  } catch (error) {
    logger.error('Token refresh error:', error)
    res.status(401).json({ error: 'Invalid or expired refresh token' })
  }
})

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers['authorization'].split(' ')[1]
    
    // Add token to blacklist
    const decoded = jwt.decode(token)
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000)
    
    if (expiresIn > 0) {
      await redis.setex(`blacklist:${token}`, expiresIn, 'true')
    }
    
    // Remove refresh token
    await redis.del(`refresh:${req.user.id}`)
    
    logger.info('User logged out', { userId: req.user.id })
    
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Service proxy configurations
const serviceProxies = {
  '/api/customers': {
    target: process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: { '^/api/customers': '/api/customers' }
  },
  '/api/visits': {
    target: process.env.VISIT_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: { '^/api/visits': '/api/visits' }
  },
  '/api/boards': {
    target: process.env.BOARD_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    pathRewrite: { '^/api/boards': '/api/boards' }
  },
  '/api/products': {
    target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true,
    pathRewrite: { '^/api/products': '/api/products' }
  },
  '/api/commissions': {
    target: process.env.COMMISSION_SERVICE_URL || 'http://localhost:3006',
    changeOrigin: true,
    pathRewrite: { '^/api/commissions': '/api/commissions' }
  },
  '/api/notifications': {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
    changeOrigin: true,
    pathRewrite: { '^/api/notifications': '/api/notifications' }
  },
  '/api/analytics': {
    target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3008',
    changeOrigin: true,
    pathRewrite: { '^/api/analytics': '/api/analytics' }
  }
}

// Apply authentication to protected routes
const protectedRoutes = [
  '/api/customers',
  '/api/visits',
  '/api/boards',
  '/api/products',
  '/api/commissions',
  '/api/notifications',
  '/api/analytics'
]

protectedRoutes.forEach(route => {
  app.use(route, authenticateToken)
})

// Setup service proxies
Object.entries(serviceProxies).forEach(([path, config]) => {
  app.use(path, createProxyMiddleware({
    ...config,
    onProxyReq: (proxyReq, req, res) => {
      // Add user context to proxied requests
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id)
        proxyReq.setHeader('X-User-Role', req.user.role)
        proxyReq.setHeader('X-User-Email', req.user.email)
      }
    },
    onError: (err, req, res) => {
      logger.error('Proxy error:', { error: err.message, path: req.path })
      res.status(503).json({ error: 'Service temporarily unavailable' })
    }
  }))
})

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error)
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' })
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    requestId: req.id
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  
  // Close database connections
  await pool.end()
  
  // Close Redis connection
  redis.disconnect()
  
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  
  // Close database connections
  await pool.end()
  
  // Close Redis connection
  redis.disconnect()
  
  process.exit(0)
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`API Gateway started on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`API Documentation: http://localhost:${PORT}/api-docs`)
})

module.exports = app