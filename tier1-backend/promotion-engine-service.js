/**
 * SalesSync Tier-1 Promotion Engine Service
 * Advanced pricing and promotional campaign management
 * 
 * Features:
 * - Dynamic pricing rules engine
 * - Promotional campaign management
 * - Discount and coupon systems
 * - Loyalty program integration
 * - A/B testing for promotions
 * - Performance tracking and analytics
 * - Automated promotion triggers
 * - Multi-tier pricing strategies
 */

const express = require('express');
const { Pool } = require('pg');
const Redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const winston = require('winston');

class PromotionEngineService {
    constructor() {
        this.db = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'salessync_tier1',
            user: process.env.DB_USER || 'salessync_admin',
            password: process.env.DB_PASSWORD || 'SalesSync2024!',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

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
                new winston.transports.File({ filename: 'promotion-engine.log' }),
                new winston.transports.Console()
            ]
        });

        this.initializePromotionTypes();
    }

    /**
     * Initialize Promotion Types and Rules
     */
    initializePromotionTypes() {
        this.promotionTypes = {
            percentage_discount: {
                name: 'Percentage Discount',
                description: 'Percentage-based discount on products',
                parameters: ['discount_percentage', 'max_discount_amount'],
                calculation: (price, params) => price * (params.discount_percentage / 100)
            },
            fixed_discount: {
                name: 'Fixed Amount Discount',
                description: 'Fixed amount discount on products',
                parameters: ['discount_amount'],
                calculation: (price, params) => Math.min(price, params.discount_amount)
            },
            buy_x_get_y: {
                name: 'Buy X Get Y',
                description: 'Buy X quantity, get Y quantity free',
                parameters: ['buy_quantity', 'get_quantity', 'max_free_items'],
                calculation: (quantity, params) => Math.floor(quantity / params.buy_quantity) * params.get_quantity
            },
            tiered_discount: {
                name: 'Tiered Discount',
                description: 'Different discounts based on quantity tiers',
                parameters: ['tier_rules'],
                calculation: (quantity, params) => this.calculateTieredDiscount(quantity, params.tier_rules)
            },
            bundle_discount: {
                name: 'Bundle Discount',
                description: 'Discount when buying specific product combinations',
                parameters: ['bundle_products', 'bundle_discount'],
                calculation: (items, params) => this.calculateBundleDiscount(items, params)
            }
        };

        this.triggerTypes = {
            manual: 'Manual activation',
            date_range: 'Date range based',
            inventory_level: 'Inventory level trigger',
            customer_segment: 'Customer segment based',
            order_value: 'Order value threshold',
            product_performance: 'Product performance based'
        };
    }

    /**
     * Create Promotion Campaign
     */
    async createPromotion(promotionData, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate promotion data
            const validationResult = await this.validatePromotionData(promotionData);
            if (!validationResult.isValid) {
                throw new Error(`Promotion validation failed: ${validationResult.errors.join(', ')}`);
            }

            // Generate promotion code
            const promotionCode = await this.generatePromotionCode(promotionData.promotion_type);

            // Create promotion record
            const promotionId = uuidv4();
            const promotionQuery = `
                INSERT INTO promotions (
                    id, promotion_code, promotion_name, promotion_type, description,
                    start_date, end_date, status, priority, budget_allocated,
                    usage_limit, usage_count, discount_rules, eligibility_criteria,
                    target_products, target_customers, created_by, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18
                ) RETURNING id, promotion_code
            `;

            const promotionResult = await client.query(promotionQuery, [
                promotionId, promotionCode, promotionData.promotion_name,
                promotionData.promotion_type, promotionData.description,
                promotionData.start_date, promotionData.end_date, 'draft',
                promotionData.priority || 1, promotionData.budget_allocated || 0,
                promotionData.usage_limit, 0, JSON.stringify(promotionData.discount_rules),
                JSON.stringify(promotionData.eligibility_criteria),
                JSON.stringify(promotionData.target_products || []),
                JSON.stringify(promotionData.target_customers || []),
                userId, new Date()
            ]);

            // Create promotion rules
            if (promotionData.rules && promotionData.rules.length > 0) {
                for (const rule of promotionData.rules) {
                    await this.createPromotionRule(client, promotionId, rule, userId);
                }
            }

            // Create A/B test variants if specified
            if (promotionData.ab_test_variants) {
                await this.createABTestVariants(client, promotionId, promotionData.ab_test_variants, userId);
            }

            // Set up automated triggers
            if (promotionData.triggers) {
                await this.setupPromotionTriggers(client, promotionId, promotionData.triggers, userId);
            }

            await client.query('COMMIT');

            // Cache promotion rules for fast access
            await this.cachePromotionRules(promotionId);

            this.logger.info('Promotion created successfully', {
                promotionId,
                promotionCode,
                promotionType: promotionData.promotion_type,
                budget: promotionData.budget_allocated
            });

            return {
                success: true,
                promotion_id: promotionId,
                promotion_code: promotionCode,
                message: 'Promotion created successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Promotion creation failed', {
                error: error.message,
                promotionData,
                userId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Create Promotion Rule
     */
    async createPromotionRule(client, promotionId, ruleData, userId) {
        const ruleQuery = `
            INSERT INTO promotion_rules (
                id, promotion_id, rule_name, rule_type, conditions,
                actions, priority, is_active, created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        await client.query(ruleQuery, [
            uuidv4(), promotionId, ruleData.rule_name, ruleData.rule_type,
            JSON.stringify(ruleData.conditions), JSON.stringify(ruleData.actions),
            ruleData.priority || 1, true, userId, new Date()
        ]);
    }

    /**
     * Apply Promotion to Order
     */
    async applyPromotion(orderData, promotionCode) {
        const client = await this.db.connect();
        
        try {
            // Get promotion details
            const promotionQuery = `
                SELECT * FROM promotions 
                WHERE promotion_code = $1 
                AND status = 'active'
                AND start_date <= CURRENT_DATE 
                AND end_date >= CURRENT_DATE
                AND (usage_limit IS NULL OR usage_count < usage_limit)
            `;
            const promotionResult = await client.query(promotionQuery, [promotionCode]);
            
            if (promotionResult.rows.length === 0) {
                throw new Error('Invalid or expired promotion code');
            }

            const promotion = promotionResult.rows[0];

            // Check eligibility
            const eligibilityCheck = await this.checkPromotionEligibility(
                promotion, 
                orderData.customer_id, 
                orderData.items
            );

            if (!eligibilityCheck.eligible) {
                throw new Error(`Promotion not applicable: ${eligibilityCheck.reason}`);
            }

            // Calculate discount
            const discountCalculation = await this.calculatePromotionDiscount(
                promotion, 
                orderData.items, 
                orderData.subtotal
            );

            // Apply discount to order
            const appliedPromotion = {
                promotion_id: promotion.id,
                promotion_code: promotionCode,
                promotion_name: promotion.promotion_name,
                discount_amount: discountCalculation.total_discount,
                discount_breakdown: discountCalculation.breakdown,
                applied_at: new Date()
            };

            // Update promotion usage count
            await client.query(
                'UPDATE promotions SET usage_count = usage_count + 1 WHERE id = $1',
                [promotion.id]
            );

            // Log promotion usage
            await this.logPromotionUsage(client, promotion.id, orderData.customer_id, discountCalculation);

            this.logger.info('Promotion applied successfully', {
                promotionId: promotion.id,
                promotionCode,
                customerId: orderData.customer_id,
                discountAmount: discountCalculation.total_discount
            });

            return {
                success: true,
                applied_promotion: appliedPromotion,
                message: 'Promotion applied successfully'
            };

        } catch (error) {
            this.logger.error('Promotion application failed', {
                error: error.message,
                promotionCode,
                orderData
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Calculate Promotion Discount
     */
    async calculatePromotionDiscount(promotion, orderItems, subtotal) {
        const discountRules = promotion.discount_rules;
        const promotionType = promotion.promotion_type;
        let totalDiscount = 0;
        const breakdown = [];

        switch (promotionType) {
            case 'percentage_discount':
                totalDiscount = this.calculatePercentageDiscount(subtotal, discountRules);
                breakdown.push({
                    type: 'percentage',
                    description: `${discountRules.discount_percentage}% discount`,
                    amount: totalDiscount
                });
                break;

            case 'fixed_discount':
                totalDiscount = Math.min(subtotal, discountRules.discount_amount);
                breakdown.push({
                    type: 'fixed',
                    description: `Fixed discount of ${discountRules.discount_amount}`,
                    amount: totalDiscount
                });
                break;

            case 'buy_x_get_y':
                const freeItemsDiscount = this.calculateBuyXGetYDiscount(orderItems, discountRules);
                totalDiscount = freeItemsDiscount.discount;
                breakdown.push({
                    type: 'buy_x_get_y',
                    description: `Buy ${discountRules.buy_quantity} get ${discountRules.get_quantity} free`,
                    amount: totalDiscount,
                    free_items: freeItemsDiscount.free_items
                });
                break;

            case 'tiered_discount':
                const tieredDiscount = this.calculateTieredDiscountAmount(orderItems, discountRules);
                totalDiscount = tieredDiscount.discount;
                breakdown.push({
                    type: 'tiered',
                    description: 'Quantity-based tiered discount',
                    amount: totalDiscount,
                    tier_applied: tieredDiscount.tier
                });
                break;

            case 'bundle_discount':
                const bundleDiscount = this.calculateBundleDiscountAmount(orderItems, discountRules);
                totalDiscount = bundleDiscount.discount;
                breakdown.push({
                    type: 'bundle',
                    description: 'Bundle discount',
                    amount: totalDiscount,
                    bundles_applied: bundleDiscount.bundles
                });
                break;
        }

        return {
            total_discount: Math.round(totalDiscount * 100) / 100,
            breakdown: breakdown,
            promotion_type: promotionType
        };
    }

    /**
     * Calculate Percentage Discount
     */
    calculatePercentageDiscount(subtotal, rules) {
        const discountAmount = subtotal * (rules.discount_percentage / 100);
        return rules.max_discount_amount ? 
            Math.min(discountAmount, rules.max_discount_amount) : discountAmount;
    }

    /**
     * Calculate Buy X Get Y Discount
     */
    calculateBuyXGetYDiscount(orderItems, rules) {
        let totalDiscount = 0;
        const freeItems = [];

        for (const item of orderItems) {
            if (rules.applicable_products && 
                !rules.applicable_products.includes(item.product_id)) {
                continue;
            }

            const freeQuantity = Math.floor(item.quantity / rules.buy_quantity) * rules.get_quantity;
            const maxFreeItems = rules.max_free_items || freeQuantity;
            const actualFreeQuantity = Math.min(freeQuantity, maxFreeItems);

            if (actualFreeQuantity > 0) {
                const itemDiscount = actualFreeQuantity * item.unit_price;
                totalDiscount += itemDiscount;
                freeItems.push({
                    product_id: item.product_id,
                    free_quantity: actualFreeQuantity,
                    discount_amount: itemDiscount
                });
            }
        }

        return {
            discount: totalDiscount,
            free_items: freeItems
        };
    }

    /**
     * Calculate Tiered Discount
     */
    calculateTieredDiscountAmount(orderItems, rules) {
        const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const tierRules = rules.tier_rules.sort((a, b) => b.min_quantity - a.min_quantity);
        
        let appliedTier = null;
        for (const tier of tierRules) {
            if (totalQuantity >= tier.min_quantity) {
                appliedTier = tier;
                break;
            }
        }

        if (!appliedTier) {
            return { discount: 0, tier: null };
        }

        const subtotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        let discount = 0;

        if (appliedTier.discount_type === 'percentage') {
            discount = subtotal * (appliedTier.discount_value / 100);
        } else if (appliedTier.discount_type === 'fixed') {
            discount = appliedTier.discount_value;
        }

        return {
            discount: Math.min(discount, appliedTier.max_discount || discount),
            tier: appliedTier
        };
    }

    /**
     * Calculate Bundle Discount
     */
    calculateBundleDiscountAmount(orderItems, rules) {
        const bundleProducts = rules.bundle_products;
        const bundleDiscount = rules.bundle_discount;
        let totalDiscount = 0;
        const appliedBundles = [];

        // Check if all bundle products are in the order
        const orderProductIds = orderItems.map(item => item.product_id);
        const hasBundleProducts = bundleProducts.every(productId => 
            orderProductIds.includes(productId)
        );

        if (hasBundleProducts) {
            // Calculate bundle discount
            const bundleValue = bundleProducts.reduce((sum, productId) => {
                const item = orderItems.find(item => item.product_id === productId);
                return sum + (item ? item.unit_price * item.quantity : 0);
            }, 0);

            if (bundleDiscount.type === 'percentage') {
                totalDiscount = bundleValue * (bundleDiscount.value / 100);
            } else if (bundleDiscount.type === 'fixed') {
                totalDiscount = bundleDiscount.value;
            }

            appliedBundles.push({
                products: bundleProducts,
                discount_amount: totalDiscount
            });
        }

        return {
            discount: totalDiscount,
            bundles: appliedBundles
        };
    }

    /**
     * Check Promotion Eligibility
     */
    async checkPromotionEligibility(promotion, customerId, orderItems) {
        const client = await this.db.connect();
        
        try {
            const eligibilityCriteria = promotion.eligibility_criteria;

            // Check customer eligibility
            if (eligibilityCriteria.customer_segments) {
                const customerSegmentQuery = `
                    SELECT customer_segment FROM customers WHERE id = $1
                `;
                const customerResult = await client.query(customerSegmentQuery, [customerId]);
                
                if (customerResult.rows.length === 0) {
                    return { eligible: false, reason: 'Customer not found' };
                }

                const customerSegment = customerResult.rows[0].customer_segment;
                if (!eligibilityCriteria.customer_segments.includes(customerSegment)) {
                    return { eligible: false, reason: 'Customer segment not eligible' };
                }
            }

            // Check minimum order value
            if (eligibilityCriteria.min_order_value) {
                const orderValue = orderItems.reduce((sum, item) => 
                    sum + (item.quantity * item.unit_price), 0
                );
                
                if (orderValue < eligibilityCriteria.min_order_value) {
                    return { 
                        eligible: false, 
                        reason: `Minimum order value of ${eligibilityCriteria.min_order_value} not met` 
                    };
                }
            }

            // Check product eligibility
            if (promotion.target_products && promotion.target_products.length > 0) {
                const orderProductIds = orderItems.map(item => item.product_id);
                const hasEligibleProducts = promotion.target_products.some(productId => 
                    orderProductIds.includes(productId)
                );
                
                if (!hasEligibleProducts) {
                    return { eligible: false, reason: 'No eligible products in order' };
                }
            }

            // Check usage limits per customer
            if (eligibilityCriteria.max_uses_per_customer) {
                const usageQuery = `
                    SELECT COUNT(*) as usage_count
                    FROM promotion_usage_log
                    WHERE promotion_id = $1 AND customer_id = $2
                `;
                const usageResult = await client.query(usageQuery, [promotion.id, customerId]);
                const usageCount = parseInt(usageResult.rows[0].usage_count);
                
                if (usageCount >= eligibilityCriteria.max_uses_per_customer) {
                    return { eligible: false, reason: 'Customer usage limit exceeded' };
                }
            }

            return { eligible: true, reason: 'All eligibility criteria met' };

        } finally {
            client.release();
        }
    }

    /**
     * Create A/B Test Variants
     */
    async createABTestVariants(client, promotionId, variants, userId) {
        for (const variant of variants) {
            const variantQuery = `
                INSERT INTO promotion_ab_test_variants (
                    id, promotion_id, variant_name, variant_config,
                    traffic_allocation, conversion_rate, revenue_impact,
                    is_active, created_by, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `;

            await client.query(variantQuery, [
                uuidv4(), promotionId, variant.variant_name,
                JSON.stringify(variant.variant_config), variant.traffic_allocation,
                0, 0, true, userId, new Date()
            ]);
        }
    }

    /**
     * Setup Promotion Triggers
     */
    async setupPromotionTriggers(client, promotionId, triggers, userId) {
        for (const trigger of triggers) {
            const triggerQuery = `
                INSERT INTO promotion_triggers (
                    id, promotion_id, trigger_type, trigger_conditions,
                    trigger_actions, is_active, created_by, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `;

            await client.query(triggerQuery, [
                uuidv4(), promotionId, trigger.trigger_type,
                JSON.stringify(trigger.trigger_conditions),
                JSON.stringify(trigger.trigger_actions),
                true, userId, new Date()
            ]);
        }
    }

    /**
     * Log Promotion Usage
     */
    async logPromotionUsage(client, promotionId, customerId, discountCalculation) {
        const usageQuery = `
            INSERT INTO promotion_usage_log (
                id, promotion_id, customer_id, discount_amount,
                discount_breakdown, used_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await client.query(usageQuery, [
            uuidv4(), promotionId, customerId, discountCalculation.total_discount,
            JSON.stringify(discountCalculation.breakdown), new Date()
        ]);
    }

    /**
     * Get Promotion Performance Analytics
     */
    async getPromotionAnalytics(promotionId, dateRange) {
        const client = await this.db.connect();
        
        try {
            // Get basic promotion metrics
            const metricsQuery = `
                SELECT 
                    COUNT(*) as total_uses,
                    SUM(discount_amount) as total_discount_given,
                    COUNT(DISTINCT customer_id) as unique_customers,
                    AVG(discount_amount) as average_discount
                FROM promotion_usage_log
                WHERE promotion_id = $1
                AND used_at BETWEEN $2 AND $3
            `;
            const metricsResult = await client.query(metricsQuery, [
                promotionId, dateRange.from, dateRange.to
            ]);

            // Get revenue impact
            const revenueQuery = `
                SELECT 
                    SUM(o.total_amount) as total_revenue,
                    COUNT(o.id) as orders_with_promotion
                FROM orders o
                JOIN promotion_usage_log pul ON o.customer_id = pul.customer_id
                WHERE pul.promotion_id = $1
                AND o.order_date BETWEEN $2 AND $3
                AND o.order_date >= pul.used_at
                AND o.order_date <= pul.used_at + INTERVAL '30 days'
            `;
            const revenueResult = await client.query(revenueQuery, [
                promotionId, dateRange.from, dateRange.to
            ]);

            // Get daily usage trend
            const trendQuery = `
                SELECT 
                    DATE(used_at) as usage_date,
                    COUNT(*) as daily_uses,
                    SUM(discount_amount) as daily_discount
                FROM promotion_usage_log
                WHERE promotion_id = $1
                AND used_at BETWEEN $2 AND $3
                GROUP BY DATE(used_at)
                ORDER BY usage_date
            `;
            const trendResult = await client.query(trendQuery, [
                promotionId, dateRange.from, dateRange.to
            ]);

            const metrics = metricsResult.rows[0];
            const revenue = revenueResult.rows[0];

            // Calculate ROI
            const totalDiscountGiven = parseFloat(metrics.total_discount_given) || 0;
            const totalRevenue = parseFloat(revenue.total_revenue) || 0;
            const roi = totalDiscountGiven > 0 ? 
                ((totalRevenue - totalDiscountGiven) / totalDiscountGiven) * 100 : 0;

            return {
                promotion_id: promotionId,
                date_range: dateRange,
                metrics: {
                    total_uses: parseInt(metrics.total_uses),
                    total_discount_given: totalDiscountGiven,
                    unique_customers: parseInt(metrics.unique_customers),
                    average_discount: parseFloat(metrics.average_discount) || 0,
                    total_revenue: totalRevenue,
                    orders_with_promotion: parseInt(revenue.orders_with_promotion),
                    roi_percentage: Math.round(roi * 100) / 100
                },
                daily_trend: trendResult.rows,
                calculated_at: new Date()
            };

        } finally {
            client.release();
        }
    }

    /**
     * Generate Promotion Code
     */
    async generatePromotionCode(promotionType) {
        const typePrefix = {
            'percentage_discount': 'PCT',
            'fixed_discount': 'FIX',
            'buy_x_get_y': 'BXG',
            'tiered_discount': 'TIR',
            'bundle_discount': 'BND'
        };

        const prefix = typePrefix[promotionType] || 'PRM';
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        // Get sequence number for this type and month
        const sequenceKey = `promotion_seq:${promotionType}:${year}${month}`;
        const sequence = await this.redis.incr(sequenceKey);
        await this.redis.expire(sequenceKey, 86400 * 31); // Expire after 31 days
        
        return `${prefix}${year}${month}${sequence.toString().padStart(3, '0')}`;
    }

    /**
     * Cache Promotion Rules
     */
    async cachePromotionRules(promotionId) {
        const client = await this.db.connect();
        
        try {
            const promotionQuery = `
                SELECT p.*, pr.rule_name, pr.rule_type, pr.conditions, pr.actions
                FROM promotions p
                LEFT JOIN promotion_rules pr ON p.id = pr.promotion_id
                WHERE p.id = $1 AND p.status = 'active'
            `;
            const promotionResult = await client.query(promotionQuery, [promotionId]);
            
            if (promotionResult.rows.length > 0) {
                await this.redis.setex(
                    `promotion:${promotionId}`, 
                    3600, 
                    JSON.stringify(promotionResult.rows)
                );
            }

        } finally {
            client.release();
        }
    }

    /**
     * Validate Promotion Data
     */
    async validatePromotionData(promotionData) {
        const schema = Joi.object({
            promotion_name: Joi.string().min(3).max(255).required(),
            promotion_type: Joi.string().valid(
                'percentage_discount', 'fixed_discount', 'buy_x_get_y', 
                'tiered_discount', 'bundle_discount'
            ).required(),
            description: Joi.string().max(1000).optional(),
            start_date: Joi.date().required(),
            end_date: Joi.date().greater(Joi.ref('start_date')).required(),
            priority: Joi.number().integer().min(1).max(10).optional(),
            budget_allocated: Joi.number().min(0).optional(),
            usage_limit: Joi.number().integer().min(1).optional(),
            discount_rules: Joi.object().required(),
            eligibility_criteria: Joi.object().optional(),
            target_products: Joi.array().items(Joi.string().uuid()).optional(),
            target_customers: Joi.array().items(Joi.string().uuid()).optional(),
            rules: Joi.array().items(Joi.object()).optional(),
            ab_test_variants: Joi.array().items(Joi.object()).optional(),
            triggers: Joi.array().items(Joi.object()).optional()
        });

        const { error, value } = schema.validate(promotionData);
        
        return {
            isValid: !error,
            errors: error ? error.details.map(detail => detail.message) : [],
            data: value
        };
    }
}

module.exports = PromotionEngineService;