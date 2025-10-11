/**
 * SalesSync Tier-1 Field Marketing API Routes
 * Complete REST API for field marketing operations
 * 
 * Routes:
 * - Agent authentication and management
 * - Customer visit workflows
 * - GPS validation and location services
 * - Board placement with image analytics
 * - Product distribution tracking
 * - Survey management and completion
 * - Commission tracking and reporting
 * - Offline sync capabilities
 */

const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const FieldMarketingService = require('./field-marketing-service');

const router = express.Router();
const fieldService = new FieldMarketingService();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later'
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many API requests, please try again later'
});

// Apply rate limiting to all routes
router.use(apiLimiter);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Authentication middleware
const authenticateAgent = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token required'
            });
        }

        // Validate session token (implement your token validation logic)
        const session = await fieldService.validateSessionToken(token);
        if (!session) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        req.agent = session.agent;
        req.sessionId = session.id;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        });
    }
};

// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

/**
 * POST /api/field-agents/login
 * Agent authentication with device registration
 */
router.post('/login', 
    authLimiter,
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required'),
        body('device_info.device_id').notEmpty().withMessage('Device ID is required'),
        body('device_info.platform').isIn(['ios', 'android']).withMessage('Invalid platform'),
        body('device_info.app_version').notEmpty().withMessage('App version is required')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { username, password, device_info } = req.body;
            
            const result = await fieldService.authenticateAgent(
                { username, password_hash: password }, // In production, hash the password
                device_info
            );

            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * POST /api/field-agents/logout
 * Agent logout and session cleanup
 */
router.post('/logout', authenticateAgent, async (req, res) => {
    try {
        await fieldService.logoutAgent(req.agent.id, req.sessionId);
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/field-agents/profile
 * Get agent profile and statistics
 */
router.get('/profile', authenticateAgent, async (req, res) => {
    try {
        const profile = await fieldService.getAgentProfile(req.agent.id);
        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// =====================================================
// CUSTOMER MANAGEMENT ROUTES
// =====================================================

/**
 * GET /api/field-agents/customers/search
 * Search customers by various criteria
 */
router.get('/customers/search',
    authenticateAgent,
    [
        query('q').optional().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
        query('type').optional().isIn(['name', 'phone', 'code']).withMessage('Invalid search type'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { q, type = 'name', limit = 20 } = req.query;
            
            const customers = await fieldService.searchCustomers(req.agent.id, {
                query: q,
                type,
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: customers
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * GET /api/field-agents/customers/nearby
 * Get customers within specified radius
 */
router.get('/customers/nearby',
    authenticateAgent,
    [
        query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        query('radius').optional().isInt({ min: 100, max: 5000 }).withMessage('Radius must be between 100m and 5km')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { latitude, longitude, radius = 1000 } = req.query;
            
            const customers = await fieldService.getNearbyCustomers(req.agent.id, {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                radius: parseInt(radius)
            });

            res.json({
                success: true,
                data: customers
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * POST /api/field-agents/customers/new
 * Register new customer with GPS location
 */
router.post('/customers/new',
    authenticateAgent,
    [
        body('store_name').notEmpty().withMessage('Store name is required'),
        body('owner_name').notEmpty().withMessage('Owner name is required'),
        body('phone_number').isMobilePhone().withMessage('Valid phone number is required'),
        body('store_type').notEmpty().withMessage('Store type is required'),
        body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        body('address').notEmpty().withMessage('Address is required')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const customerData = req.body;
            customerData.created_by_agent = req.agent.id;
            
            const result = await fieldService.registerNewCustomer(customerData);
            
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// =====================================================
// VISIT MANAGEMENT ROUTES
// =====================================================

/**
 * GET /api/field-agents/visits/active
 * Get agent's active visit
 */
router.get('/visits/active', authenticateAgent, async (req, res) => {
    try {
        const activeVisit = await fieldService.getActiveVisit(req.agent.id);
        res.json({
            success: true,
            data: activeVisit
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/field-agents/visits/start
 * Start customer visit with GPS validation
 */
router.post('/visits/start',
    authenticateAgent,
    [
        body('customer_id').isUUID().withMessage('Valid customer ID is required'),
        body('current_location.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('current_location.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        body('visit_purpose').notEmpty().withMessage('Visit purpose is required'),
        body('brands').optional().isArray().withMessage('Brands must be an array')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const visitData = req.body;
            const result = await fieldService.startVisit(req.agent.id, visitData);
            
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * PUT /api/field-agents/visits/:visitId/complete
 * Complete customer visit
 */
router.put('/visits/:visitId/complete',
    authenticateAgent,
    [
        param('visitId').isUUID().withMessage('Valid visit ID is required'),
        body('visit_rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('customer_feedback').optional().isString(),
        body('agent_notes').optional().isString()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { visitId } = req.params;
            const visitData = req.body;
            
            const result = await fieldService.completeVisit(req.agent.id, visitData);
            
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * GET /api/field-agents/visits/:visitId/activities
 * Get visit activities and progress
 */
router.get('/visits/:visitId/activities',
    authenticateAgent,
    [
        param('visitId').isUUID().withMessage('Valid visit ID is required')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { visitId } = req.params;
            const activities = await fieldService.getVisitActivities(visitId);
            
            res.json({
                success: true,
                data: activities
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// =====================================================
// BOARD MANAGEMENT ROUTES
// =====================================================

/**
 * GET /api/field-agents/boards/available
 * Get available boards for placement
 */
router.get('/boards/available', authenticateAgent, async (req, res) => {
    try {
        const { brand_id } = req.query;
        const boards = await fieldService.getAvailableBoards(req.agent.id, brand_id);
        
        res.json({
            success: true,
            data: boards
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/field-agents/boards/place
 * Place board with image analysis
 */
router.post('/boards/place',
    authenticateAgent,
    upload.fields([
        { name: 'board_photo', maxCount: 1 },
        { name: 'storefront_photo', maxCount: 1 }
    ]),
    [
        body('board_id').isUUID().withMessage('Valid board ID is required'),
        body('customer_id').isUUID().withMessage('Valid customer ID is required'),
        body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        body('placement_address').notEmpty().withMessage('Placement address is required')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            if (!req.files.board_photo || !req.files.storefront_photo) {
                return res.status(400).json({
                    success: false,
                    message: 'Both board photo and storefront photo are required'
                });
            }

            const placementData = {
                ...req.body,
                board_photo: req.files.board_photo[0].buffer.toString('base64'),
                storefront_photo: req.files.storefront_photo[0].buffer.toString('base64'),
                location: {
                    latitude: parseFloat(req.body.location.latitude),
                    longitude: parseFloat(req.body.location.longitude)
                }
            };

            const result = await fieldService.placeBoard(req.agent.id, placementData);
            
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * PUT /api/field-agents/boards/:placementId/update
 * Update board placement status
 */
router.put('/boards/:placementId/update',
    authenticateAgent,
    [
        param('placementId').isUUID().withMessage('Valid placement ID is required'),
        body('status').isIn(['active', 'removed', 'damaged']).withMessage('Invalid status'),
        body('notes').optional().isString()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { placementId } = req.params;
            const updateData = req.body;
            
            const result = await fieldService.updateBoardPlacement(
                req.agent.id, 
                placementId, 
                updateData
            );
            
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * POST /api/field-agents/boards/analyze-coverage
 * Analyze board coverage from images
 */
router.post('/boards/analyze-coverage',
    authenticateAgent,
    upload.fields([
        { name: 'board_photo', maxCount: 1 },
        { name: 'storefront_photo', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            if (!req.files.board_photo || !req.files.storefront_photo) {
                return res.status(400).json({
                    success: false,
                    message: 'Both photos are required for analysis'
                });
            }

            const boardPhoto = req.files.board_photo[0].buffer.toString('base64');
            const storefrontPhoto = req.files.storefront_photo[0].buffer.toString('base64');

            const analysis = await fieldService.analyzeImageCoverage(boardPhoto, storefrontPhoto);
            
            res.json({
                success: true,
                data: analysis
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// =====================================================
// PRODUCT DISTRIBUTION ROUTES
// =====================================================

/**
 * GET /api/field-agents/products/available
 * Get products available for distribution
 */
router.get('/products/available', authenticateAgent, async (req, res) => {
    try {
        const products = await fieldService.getDistributableProducts(req.agent.id);
        
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/field-agents/products/distribute
 * Distribute product to customer
 */
router.post('/products/distribute',
    authenticateAgent,
    upload.fields([
        { name: 'distribution_photo', maxCount: 1 },
        { name: 'recipient_signature', maxCount: 1 }
    ]),
    [
        body('product_id').isUUID().withMessage('Valid product ID is required'),
        body('customer_id').optional().isUUID().withMessage('Valid customer ID required if provided'),
        body('quantity_distributed').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('recipient_details.name').notEmpty().withMessage('Recipient name is required'),
        body('recipient_details.phone_number').isMobilePhone().withMessage('Valid phone number is required'),
        body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const distributionData = {
                ...req.body,
                quantity_distributed: parseInt(req.body.quantity_distributed),
                location: {
                    latitude: parseFloat(req.body.location.latitude),
                    longitude: parseFloat(req.body.location.longitude)
                }
            };

            if (req.files.distribution_photo) {
                distributionData.distribution_photo_url = req.files.distribution_photo[0].buffer.toString('base64');
            }

            if (req.files.recipient_signature) {
                distributionData.recipient_signature_url = req.files.recipient_signature[0].buffer.toString('base64');
            }

            const result = await fieldService.distributeProduct(req.agent.id, distributionData);
            
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * GET /api/field-agents/products/forms/:productId
 * Get product-specific distribution form
 */
router.get('/products/forms/:productId',
    authenticateAgent,
    [
        param('productId').isUUID().withMessage('Valid product ID is required')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { productId } = req.params;
            const form = await fieldService.getProductDistributionForm(productId);
            
            res.json({
                success: true,
                data: form
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// =====================================================
// SURVEY ROUTES
// =====================================================

/**
 * GET /api/field-agents/surveys/available
 * Get available surveys for agent
 */
router.get('/surveys/available', authenticateAgent, async (req, res) => {
    try {
        const { brand_id, survey_type } = req.query;
        const surveys = await fieldService.getAvailableSurveys(req.agent.id, {
            brand_id,
            survey_type
        });
        
        res.json({
            success: true,
            data: surveys
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/field-agents/surveys/:surveyId
 * Get survey details and questions
 */
router.get('/surveys/:surveyId',
    authenticateAgent,
    [
        param('surveyId').isUUID().withMessage('Valid survey ID is required')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { surveyId } = req.params;
            const survey = await fieldService.getSurveyDetails(surveyId);
            
            res.json({
                success: true,
                data: survey
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * POST /api/field-agents/surveys/:surveyId/complete
 * Complete survey with responses
 */
router.post('/surveys/:surveyId/complete',
    authenticateAgent,
    [
        param('surveyId').isUUID().withMessage('Valid survey ID is required'),
        body('responses').isObject().withMessage('Responses must be an object'),
        body('customer_id').optional().isUUID().withMessage('Valid customer ID required if provided'),
        body('completion_time').optional().isInt({ min: 1 }).withMessage('Completion time must be positive'),
        body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { surveyId } = req.params;
            const surveyData = {
                ...req.body,
                survey_id: surveyId,
                location: {
                    latitude: parseFloat(req.body.location.latitude),
                    longitude: parseFloat(req.body.location.longitude)
                }
            };

            const result = await fieldService.completeSurvey(req.agent.id, surveyData);
            
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// =====================================================
// COMMISSION TRACKING ROUTES
// =====================================================

/**
 * GET /api/field-agents/commissions/summary
 * Get commission summary for agent
 */
router.get('/commissions/summary',
    authenticateAgent,
    [
        query('date_from').optional().isISO8601().withMessage('Invalid date format'),
        query('date_to').optional().isISO8601().withMessage('Invalid date format')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { date_from, date_to } = req.query;
            const dateRange = {
                from: date_from || new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
                to: date_to || new Date().toISOString().split('T')[0] // Today
            };

            const summary = await fieldService.getCommissionSummary(req.agent.id, dateRange);
            
            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * GET /api/field-agents/commissions/history
 * Get detailed commission history
 */
router.get('/commissions/history',
    authenticateAgent,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('activity_type').optional().isIn(['board_placement', 'product_distribution', 'survey_completion']).withMessage('Invalid activity type')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { page = 1, limit = 20, activity_type } = req.query;
            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit)
            };

            const history = await fieldService.getCommissionHistory(req.agent.id, {
                activity_type,
                pagination
            });
            
            res.json({
                success: true,
                data: history.commissions,
                pagination: history.pagination
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * GET /api/field-agents/commissions/pending
 * Get pending commission payments
 */
router.get('/commissions/pending', authenticateAgent, async (req, res) => {
    try {
        const pending = await fieldService.getPendingCommissions(req.agent.id);
        
        res.json({
            success: true,
            data: pending
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// =====================================================
// DASHBOARD AND ANALYTICS ROUTES
// =====================================================

/**
 * GET /api/field-agents/dashboard
 * Get agent dashboard data
 */
router.get('/dashboard',
    authenticateAgent,
    [
        query('date_from').optional().isISO8601().withMessage('Invalid date format'),
        query('date_to').optional().isISO8601().withMessage('Invalid date format')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { date_from, date_to } = req.query;
            const dateRange = {
                from: date_from || new Date(new Date().setDate(1)).toISOString().split('T')[0],
                to: date_to || new Date().toISOString().split('T')[0]
            };

            const dashboard = await fieldService.getAgentDashboard(req.agent.id, dateRange);
            
            res.json({
                success: true,
                data: dashboard
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * GET /api/field-agents/performance
 * Get agent performance metrics
 */
router.get('/performance', authenticateAgent, async (req, res) => {
    try {
        const performance = await fieldService.getAgentPerformance(req.agent.id);
        
        res.json({
            success: true,
            data: performance
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// =====================================================
// OFFLINE SYNC ROUTES
// =====================================================

/**
 * POST /api/field-agents/sync/upload
 * Upload offline data for synchronization
 */
router.post('/sync/upload', authenticateAgent, async (req, res) => {
    try {
        const { offline_data } = req.body;
        const result = await fieldService.syncOfflineData(req.agent.id, offline_data);
        
        res.json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/field-agents/sync/download
 * Download data for offline use
 */
router.get('/sync/download', authenticateAgent, async (req, res) => {
    try {
        const { last_sync } = req.query;
        const data = await fieldService.getOfflineData(req.agent.id, last_sync);
        
        res.json({
            success: true,
            data,
            sync_timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Error handling middleware
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 10MB.'
            });
        }
    }

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

module.exports = router;