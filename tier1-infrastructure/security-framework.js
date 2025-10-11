/**
 * SalesSync Tier-1 Security & Compliance Framework
 * Comprehensive security implementation with OAuth2, RBAC, and audit logging
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');
const { Pool } = require('pg');
const Redis = require('redis');
const winston = require('winston');

class SecurityFramework {
    constructor() {
        this.app = express();
        this.db = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        this.redis = Redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'security-audit.log' }),
                new winston.transports.Console()
            ]
        });

        this.setupSecurityMiddleware();
        this.setupAuthRoutes();
        this.setupRBAC();
        this.setupAuditLogging();
    }

    setupSecurityMiddleware() {
        // Security headers
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "wss:", "https:"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        }));

        // Rate limiting
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // limit each IP to 5 requests per windowMs
            message: 'Too many authentication attempts, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        });

        const apiLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 1000,
            message: 'API rate limit exceeded',
        });

        this.app.use('/auth', authLimiter);
        this.app.use('/api', apiLimiter);

        // Request parsing with size limits
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Security audit logging
        this.app.use(this.auditMiddleware.bind(this));
    }

    setupAuthRoutes() {
        // OAuth2 Authorization Server Implementation
        this.app.post('/auth/login', async (req, res) => {
            try {
                const { username, password, client_id, grant_type } = req.body;

                // Validate required fields
                if (!username || !password) {
                    this.logSecurityEvent('LOGIN_ATTEMPT_MISSING_CREDENTIALS', req);
                    return res.status(400).json({ error: 'Username and password required' });
                }

                // Check for brute force attempts
                const attempts = await this.redis.get(`login_attempts:${req.ip}`);
                if (attempts && parseInt(attempts) >= 5) {
                    this.logSecurityEvent('LOGIN_BLOCKED_BRUTE_FORCE', req);
                    return res.status(429).json({ error: 'Account temporarily locked due to too many failed attempts' });
                }

                // Authenticate user
                const user = await this.authenticateUser(username, password);
                if (!user) {
                    await this.redis.incr(`login_attempts:${req.ip}`);
                    await this.redis.expire(`login_attempts:${req.ip}`, 900); // 15 minutes
                    
                    this.logSecurityEvent('LOGIN_FAILED', req, { username });
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                // Clear failed attempts
                await this.redis.del(`login_attempts:${req.ip}`);

                // Generate tokens
                const sessionId = crypto.randomUUID();
                const accessToken = this.generateAccessToken(user, sessionId);
                const refreshToken = this.generateRefreshToken(user, sessionId);

                // Store session
                await this.redis.setex(`session:${sessionId}`, 3600, JSON.stringify({
                    userId: user.id,
                    username: user.username,
                    roles: user.roles,
                    permissions: user.permissions,
                    loginTime: new Date().toISOString()
                }));

                // Store refresh token
                await this.redis.setex(`refresh:${refreshToken}`, 86400 * 7, sessionId); // 7 days

                this.logSecurityEvent('LOGIN_SUCCESS', req, { userId: user.id, username: user.username });

                res.json({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    token_type: 'Bearer',
                    expires_in: 3600,
                    user: {
                        id: user.id,
                        username: user.username,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        roles: user.roles,
                        permissions: user.permissions
                    }
                });

            } catch (error) {
                this.logger.error('Login error', { error: error.message, stack: error.stack });
                res.status(500).json({ error: 'Authentication service unavailable' });
            }
        });

        // Token refresh endpoint
        this.app.post('/auth/refresh', async (req, res) => {
            try {
                const { refresh_token } = req.body;

                if (!refresh_token) {
                    return res.status(400).json({ error: 'Refresh token required' });
                }

                // Validate refresh token
                const sessionId = await this.redis.get(`refresh:${refresh_token}`);
                if (!sessionId) {
                    this.logSecurityEvent('REFRESH_TOKEN_INVALID', req);
                    return res.status(401).json({ error: 'Invalid refresh token' });
                }

                // Get session data
                const sessionData = await this.redis.get(`session:${sessionId}`);
                if (!sessionData) {
                    this.logSecurityEvent('SESSION_EXPIRED', req);
                    return res.status(401).json({ error: 'Session expired' });
                }

                const session = JSON.parse(sessionData);
                const user = await this.getUserById(session.userId);

                if (!user) {
                    return res.status(401).json({ error: 'User not found' });
                }

                // Generate new access token
                const newAccessToken = this.generateAccessToken(user, sessionId);

                this.logSecurityEvent('TOKEN_REFRESHED', req, { userId: user.id });

                res.json({
                    access_token: newAccessToken,
                    token_type: 'Bearer',
                    expires_in: 3600
                });

            } catch (error) {
                this.logger.error('Token refresh error', { error: error.message });
                res.status(500).json({ error: 'Token refresh failed' });
            }
        });

        // Logout endpoint
        this.app.post('/auth/logout', this.authenticateToken.bind(this), async (req, res) => {
            try {
                const sessionId = req.user.sessionId;
                const token = req.headers.authorization?.replace('Bearer ', '');

                // Blacklist the token
                await this.redis.setex(`blacklist:${token}`, 3600, 'true');

                // Remove session
                await this.redis.del(`session:${sessionId}`);

                // Remove refresh token if provided
                const { refresh_token } = req.body;
                if (refresh_token) {
                    await this.redis.del(`refresh:${refresh_token}`);
                }

                this.logSecurityEvent('LOGOUT_SUCCESS', req, { userId: req.user.userId });

                res.json({ message: 'Logged out successfully' });

            } catch (error) {
                this.logger.error('Logout error', { error: error.message });
                res.status(500).json({ error: 'Logout failed' });
            }
        });

        // Password change endpoint
        this.app.post('/auth/change-password', this.authenticateToken.bind(this), async (req, res) => {
            try {
                const { current_password, new_password } = req.body;
                const userId = req.user.userId;

                // Validate current password
                const user = await this.getUserById(userId);
                const isValidPassword = await bcrypt.compare(current_password, user.password_hash);

                if (!isValidPassword) {
                    this.logSecurityEvent('PASSWORD_CHANGE_FAILED_INVALID_CURRENT', req, { userId });
                    return res.status(400).json({ error: 'Current password is incorrect' });
                }

                // Validate new password strength
                if (!this.validatePasswordStrength(new_password)) {
                    return res.status(400).json({ 
                        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
                    });
                }

                // Hash new password
                const saltRounds = 12;
                const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

                // Update password
                await this.db.query(
                    'UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2',
                    [newPasswordHash, userId]
                );

                this.logSecurityEvent('PASSWORD_CHANGED', req, { userId });

                res.json({ message: 'Password changed successfully' });

            } catch (error) {
                this.logger.error('Password change error', { error: error.message });
                res.status(500).json({ error: 'Password change failed' });
            }
        });
    }

    setupRBAC() {
        // Role-Based Access Control middleware
        this.checkPermission = (requiredPermission) => {
            return (req, res, next) => {
                if (!req.user) {
                    return res.status(401).json({ error: 'Authentication required' });
                }

                const userPermissions = req.user.permissions || [];
                
                // Super admin has all permissions
                if (userPermissions.includes('*')) {
                    return next();
                }

                // Check specific permission
                if (!userPermissions.includes(requiredPermission)) {
                    this.logSecurityEvent('ACCESS_DENIED', req, { 
                        userId: req.user.userId,
                        requiredPermission,
                        userPermissions
                    });
                    return res.status(403).json({ error: 'Insufficient permissions' });
                }

                next();
            };
        };

        // Role checking middleware
        this.checkRole = (requiredRoles) => {
            return (req, res, next) => {
                if (!req.user) {
                    return res.status(401).json({ error: 'Authentication required' });
                }

                const userRoles = req.user.roles || [];
                const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

                if (!hasRequiredRole) {
                    this.logSecurityEvent('ROLE_ACCESS_DENIED', req, { 
                        userId: req.user.userId,
                        requiredRoles,
                        userRoles
                    });
                    return res.status(403).json({ error: 'Insufficient role privileges' });
                }

                next();
            };
        };
    }

    setupAuditLogging() {
        // Comprehensive audit logging
        this.auditMiddleware = (req, res, next) => {
            const startTime = Date.now();

            res.on('finish', () => {
                const duration = Date.now() - startTime;
                
                this.logAuditEvent({
                    event_type: 'API_REQUEST',
                    method: req.method,
                    url: req.url,
                    status_code: res.statusCode,
                    duration: duration,
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent'),
                    user_id: req.user?.userId,
                    session_id: req.user?.sessionId,
                    timestamp: new Date().toISOString()
                });
            });

            next();
        };
    }

    // Authentication methods
    async authenticateUser(username, password) {
        try {
            const result = await this.db.query(`
                SELECT u.*, 
                       array_agg(DISTINCT r.name) as roles,
                       array_agg(DISTINCT p.name) as permissions
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                LEFT JOIN role_permissions rp ON r.id = rp.role_id
                LEFT JOIN permissions p ON rp.permission_id = p.id
                WHERE u.username = $1 AND u.is_active = true
                GROUP BY u.id
            `, [username]);

            if (result.rows.length === 0) {
                return null;
            }

            const user = result.rows[0];
            const isValidPassword = await bcrypt.compare(password, user.password_hash);

            if (!isValidPassword) {
                return null;
            }

            return {
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                roles: user.roles.filter(r => r !== null),
                permissions: user.permissions.filter(p => p !== null)
            };

        } catch (error) {
            this.logger.error('User authentication error', { error: error.message });
            return null;
        }
    }

    async getUserById(userId) {
        try {
            const result = await this.db.query(`
                SELECT u.*, 
                       array_agg(DISTINCT r.name) as roles,
                       array_agg(DISTINCT p.name) as permissions
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                LEFT JOIN role_permissions rp ON r.id = rp.role_id
                LEFT JOIN permissions p ON rp.permission_id = p.id
                WHERE u.id = $1 AND u.is_active = true
                GROUP BY u.id
            `, [userId]);

            if (result.rows.length === 0) {
                return null;
            }

            const user = result.rows[0];
            return {
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                password_hash: user.password_hash,
                roles: user.roles.filter(r => r !== null),
                permissions: user.permissions.filter(p => p !== null)
            };

        } catch (error) {
            this.logger.error('Get user error', { error: error.message });
            return null;
        }
    }

    generateAccessToken(user, sessionId) {
        return jwt.sign({
            userId: user.id,
            username: user.username,
            roles: user.roles,
            permissions: user.permissions,
            sessionId: sessionId,
            type: 'access'
        }, process.env.JWT_SECRET || 'salessync_secret_key', {
            expiresIn: '1h',
            issuer: 'salessync-auth',
            audience: 'salessync-api'
        });
    }

    generateRefreshToken(user, sessionId) {
        return jwt.sign({
            userId: user.id,
            sessionId: sessionId,
            type: 'refresh'
        }, process.env.JWT_REFRESH_SECRET || 'salessync_refresh_secret', {
            expiresIn: '7d',
            issuer: 'salessync-auth',
            audience: 'salessync-api'
        });
    }

    async authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        try {
            // Check if token is blacklisted
            const isBlacklisted = await this.redis.get(`blacklist:${token}`);
            if (isBlacklisted) {
                return res.status(401).json({ error: 'Token has been revoked' });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'salessync_secret_key');

            // Check session validity
            const sessionData = await this.redis.get(`session:${decoded.sessionId}`);
            if (!sessionData) {
                return res.status(401).json({ error: 'Session expired' });
            }

            req.user = decoded;
            next();

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid token' });
            } else {
                this.logger.error('Token authentication error', { error: error.message });
                return res.status(500).json({ error: 'Authentication service error' });
            }
        }
    }

    validatePasswordStrength(password) {
        // Password must be at least 8 characters with uppercase, lowercase, number, and special character
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    }

    logSecurityEvent(eventType, req, additionalData = {}) {
        const securityEvent = {
            event_type: eventType,
            timestamp: new Date().toISOString(),
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            url: req.url,
            method: req.method,
            ...additionalData
        };

        this.logger.warn('Security Event', securityEvent);

        // Store in database for compliance
        this.db.query(`
            INSERT INTO security_audit_log (event_type, event_data, ip_address, user_agent, created_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [eventType, JSON.stringify(securityEvent), req.ip, req.get('User-Agent')])
        .catch(error => {
            this.logger.error('Failed to store security audit log', { error: error.message });
        });
    }

    logAuditEvent(auditData) {
        this.logger.info('Audit Event', auditData);

        // Store in database
        this.db.query(`
            INSERT INTO audit_log (event_type, event_data, user_id, ip_address, created_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [auditData.event_type, JSON.stringify(auditData), auditData.user_id, auditData.ip_address])
        .catch(error => {
            this.logger.error('Failed to store audit log', { error: error.message });
        });
    }

    // Compliance reporting
    async generateComplianceReport(startDate, endDate) {
        try {
            const result = await this.db.query(`
                SELECT 
                    event_type,
                    COUNT(*) as event_count,
                    DATE_TRUNC('day', created_at) as event_date
                FROM security_audit_log 
                WHERE created_at BETWEEN $1 AND $2
                GROUP BY event_type, DATE_TRUNC('day', created_at)
                ORDER BY event_date DESC, event_count DESC
            `, [startDate, endDate]);

            return {
                period: { start: startDate, end: endDate },
                events: result.rows,
                generated_at: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('Compliance report generation error', { error: error.message });
            throw error;
        }
    }

    start(port = process.env.SECURITY_PORT || 3010) {
        this.app.listen(port, '0.0.0.0', () => {
            this.logger.info(`Security service started on port ${port}`);
            console.log(`🔐 SalesSync Security Framework running on http://0.0.0.0:${port}`);
        });
    }
}

// Start the security service
if (require.main === module) {
    const security = new SecurityFramework();
    security.start();
}

module.exports = SecurityFramework;