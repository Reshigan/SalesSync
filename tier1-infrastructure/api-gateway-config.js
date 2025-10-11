/**
 * SalesSync Tier-1 API Gateway Configuration
 * Kong/Express Gateway setup with rate limiting, authentication, and load balancing
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const Redis = require('redis');
const winston = require('winston');

class APIGateway {
    constructor() {
        this.app = express();
        this.redis = Redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
        });

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'api-gateway.log' }),
                new winston.transports.Console()
            ]
        });

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Compression
        this.app.use(compression());

        // Request parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Rate limiting
        this.setupRateLimiting();

        // Request logging
        this.app.use(this.requestLogger.bind(this));

        // Authentication middleware
        this.app.use(this.authenticationMiddleware.bind(this));
    }

    setupRateLimiting() {
        // General rate limiting
        const generalLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // limit each IP to 1000 requests per windowMs
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        });

        // API rate limiting
        const apiLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 500,
            message: 'API rate limit exceeded',
        });

        // Authentication rate limiting
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 10,
            message: 'Too many authentication attempts',
        });

        this.app.use('/', generalLimiter);
        this.app.use('/api/', apiLimiter);
        this.app.use('/auth/', authLimiter);
    }

    requestLogger(req, res, next) {
        const start = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            this.logger.info('API Request', {
                method: req.method,
                url: req.url,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        });

        next();
    }

    async authenticationMiddleware(req, res, next) {
        // Skip authentication for public routes
        const publicRoutes = ['/health', '/api/auth/login', '/api/auth/register'];
        if (publicRoutes.some(route => req.path.startsWith(route))) {
            return next();
        }

        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication token required' });
        }

        try {
            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'salessync_secret_key');
            
            // Check if token is blacklisted
            const isBlacklisted = await this.redis.get(`blacklist:${token}`);
            if (isBlacklisted) {
                return res.status(401).json({ error: 'Token has been revoked' });
            }

            // Check session validity
            const sessionData = await this.redis.get(`session:${decoded.sessionId}`);
            if (!sessionData) {
                return res.status(401).json({ error: 'Session expired' });
            }

            req.user = decoded;
            next();
        } catch (error) {
            this.logger.error('Authentication failed', { error: error.message, token });
            return res.status(401).json({ error: 'Invalid authentication token' });
        }
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: process.env.API_VERSION || '1.0.0'
            });
        });

        // Service discovery and load balancing
        const services = {
            'field-marketing': {
                target: process.env.FIELD_MARKETING_SERVICE_URL || 'http://localhost:3001',
                changeOrigin: true,
                pathRewrite: { '^/api/field-marketing': '' }
            },
            'order-management': {
                target: process.env.ORDER_MANAGEMENT_SERVICE_URL || 'http://localhost:3002',
                changeOrigin: true,
                pathRewrite: { '^/api/orders': '' }
            },
            'inventory-management': {
                target: process.env.INVENTORY_MANAGEMENT_SERVICE_URL || 'http://localhost:3003',
                changeOrigin: true,
                pathRewrite: { '^/api/inventory': '' }
            },
            'customer-management': {
                target: process.env.CUSTOMER_MANAGEMENT_SERVICE_URL || 'http://localhost:3004',
                changeOrigin: true,
                pathRewrite: { '^/api/customers': '' }
            },
            'user-management': {
                target: process.env.USER_MANAGEMENT_SERVICE_URL || 'http://localhost:3005',
                changeOrigin: true,
                pathRewrite: { '^/api/users': '' }
            },
            'trade-marketing': {
                target: process.env.TRADE_MARKETING_SERVICE_URL || 'http://localhost:3006',
                changeOrigin: true,
                pathRewrite: { '^/api/trade-marketing': '' }
            },
            'event-management': {
                target: process.env.EVENT_MANAGEMENT_SERVICE_URL || 'http://localhost:3007',
                changeOrigin: true,
                pathRewrite: { '^/api/events': '' }
            },
            'promotion-engine': {
                target: process.env.PROMOTION_ENGINE_SERVICE_URL || 'http://localhost:3008',
                changeOrigin: true,
                pathRewrite: { '^/api/promotions': '' }
            }
        };

        // Setup proxy routes for each service
        Object.entries(services).forEach(([serviceName, config]) => {
            const routePath = `/api/${serviceName.replace('-', '-')}`;
            
            this.app.use(routePath, createProxyMiddleware({
                ...config,
                onProxyReq: (proxyReq, req, res) => {
                    // Add user context to proxied requests
                    if (req.user) {
                        proxyReq.setHeader('X-User-ID', req.user.userId);
                        proxyReq.setHeader('X-User-Roles', JSON.stringify(req.user.roles));
                        proxyReq.setHeader('X-User-Permissions', JSON.stringify(req.user.permissions));
                    }
                },
                onError: (err, req, res) => {
                    this.logger.error('Proxy error', {
                        service: serviceName,
                        error: err.message,
                        url: req.url
                    });
                    res.status(503).json({
                        error: 'Service temporarily unavailable',
                        service: serviceName
                    });
                }
            }));
        });

        // API documentation endpoint
        this.app.get('/api/docs', (req, res) => {
            res.json({
                title: 'SalesSync Tier-1 API Gateway',
                version: '1.0.0',
                services: Object.keys(services),
                endpoints: {
                    'field-marketing': '/api/field-marketing/*',
                    'order-management': '/api/orders/*',
                    'inventory-management': '/api/inventory/*',
                    'customer-management': '/api/customers/*',
                    'user-management': '/api/users/*',
                    'trade-marketing': '/api/trade-marketing/*',
                    'event-management': '/api/events/*',
                    'promotion-engine': '/api/promotions/*'
                }
            });
        });
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method
            });
        });

        // Global error handler
        this.app.use((err, req, res, next) => {
            this.logger.error('Unhandled error', {
                error: err.message,
                stack: err.stack,
                url: req.url,
                method: req.method
            });

            res.status(err.status || 500).json({
                error: process.env.NODE_ENV === 'production' 
                    ? 'Internal server error' 
                    : err.message
            });
        });
    }

    start(port = process.env.PORT || 3000) {
        this.app.listen(port, '0.0.0.0', () => {
            this.logger.info(`SalesSync API Gateway started on port ${port}`);
            console.log(`🚀 SalesSync API Gateway running on http://0.0.0.0:${port}`);
        });
    }
}

// Start the API Gateway
if (require.main === module) {
    const gateway = new APIGateway();
    gateway.start();
}

module.exports = APIGateway;