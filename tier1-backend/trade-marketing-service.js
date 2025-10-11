/**
 * SalesSync Tier-1 Trade Marketing Service
 * Complete trade marketing campaign and promotion management
 * 
 * Features:
 * - Campaign lifecycle management
 * - Trade spend tracking and optimization
 * - Partner/retailer management
 * - Co-op advertising management
 * - Merchandising support
 * - ROI analytics and reporting
 * - Budget allocation and tracking
 * - Performance dashboards
 */

const express = require('express');
const { Pool } = require('pg');
const Redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const winston = require('winston');

class TradeMarketingService {
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
                new winston.transports.File({ filename: 'trade-marketing.log' }),
                new winston.transports.Console()
            ]
        });

        this.initializeCampaignTypes();
    }

    /**
     * Initialize Campaign Types and Templates
     */
    initializeCampaignTypes() {
        this.campaignTypes = {
            trade_promotion: {
                name: 'Trade Promotion',
                description: 'Promotional campaigns targeting trade partners',
                required_fields: ['target_audience', 'promotion_mechanics', 'budget_allocation'],
                workflow_stages: ['planning', 'approval', 'execution', 'monitoring', 'evaluation']
            },
            co_op_advertising: {
                name: 'Co-op Advertising',
                description: 'Joint advertising campaigns with retail partners',
                required_fields: ['partner_contribution', 'media_channels', 'creative_assets'],
                workflow_stages: ['partner_agreement', 'creative_development', 'media_booking', 'execution', 'reporting']
            },
            merchandising: {
                name: 'Merchandising Campaign',
                description: 'In-store merchandising and display campaigns',
                required_fields: ['store_locations', 'display_requirements', 'execution_timeline'],
                workflow_stages: ['planning', 'material_production', 'distribution', 'installation', 'monitoring']
            },
            trade_show: {
                name: 'Trade Show',
                description: 'Trade show participation and management',
                required_fields: ['event_details', 'booth_requirements', 'staff_allocation'],
                workflow_stages: ['registration', 'preparation', 'execution', 'follow_up', 'analysis']
            }
        };
    }

    /**
     * Create Trade Marketing Campaign
     */
    async createCampaign(campaignData, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate campaign data
            const validationResult = await this.validateCampaignData(campaignData);
            if (!validationResult.isValid) {
                throw new Error(`Campaign validation failed: ${validationResult.errors.join(', ')}`);
            }

            // Generate campaign code
            const campaignCode = await this.generateCampaignCode(campaignData.campaign_type);

            // Create campaign record
            const campaignId = uuidv4();
            const campaignQuery = `
                INSERT INTO trade_marketing_campaigns (
                    id, campaign_code, campaign_name, campaign_type, description,
                    start_date, end_date, status, budget_allocated, budget_spent,
                    target_audience, objectives, success_metrics, brand_id,
                    campaign_manager_id, approval_required, created_by, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18
                ) RETURNING id, campaign_code
            `;

            const campaignResult = await client.query(campaignQuery, [
                campaignId, campaignCode, campaignData.campaign_name,
                campaignData.campaign_type, campaignData.description,
                campaignData.start_date, campaignData.end_date, 'draft',
                campaignData.budget_allocated, 0, JSON.stringify(campaignData.target_audience),
                JSON.stringify(campaignData.objectives), JSON.stringify(campaignData.success_metrics),
                campaignData.brand_id, campaignData.campaign_manager_id,
                campaignData.approval_required || true, userId, new Date()
            ]);

            // Create campaign activities
            if (campaignData.activities && campaignData.activities.length > 0) {
                for (const activity of campaignData.activities) {
                    await this.createCampaignActivity(client, campaignId, activity, userId);
                }
            }

            // Create budget allocations
            if (campaignData.budget_breakdown) {
                await this.createBudgetAllocations(client, campaignId, campaignData.budget_breakdown, userId);
            }

            // Initialize campaign workflow
            await this.initializeCampaignWorkflow(client, campaignId, campaignData.campaign_type);

            // Create partner associations
            if (campaignData.partner_ids && campaignData.partner_ids.length > 0) {
                await this.associateCampaignPartners(client, campaignId, campaignData.partner_ids);
            }

            await client.query('COMMIT');

            // Cache campaign data
            await this.cacheCampaign(campaignId);

            this.logger.info('Trade marketing campaign created', {
                campaignId,
                campaignCode,
                campaignType: campaignData.campaign_type,
                budget: campaignData.budget_allocated
            });

            return {
                success: true,
                campaign_id: campaignId,
                campaign_code: campaignCode,
                message: 'Campaign created successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Campaign creation failed', {
                error: error.message,
                campaignData,
                userId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Create Campaign Activity
     */
    async createCampaignActivity(client, campaignId, activityData, userId) {
        const activityQuery = `
            INSERT INTO campaign_activities (
                id, campaign_id, activity_name, activity_type, description,
                start_date, end_date, budget_allocated, status,
                assigned_to, deliverables, success_criteria,
                created_by, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            )
        `;

        await client.query(activityQuery, [
            uuidv4(), campaignId, activityData.activity_name,
            activityData.activity_type, activityData.description,
            activityData.start_date, activityData.end_date,
            activityData.budget_allocated, 'planned',
            activityData.assigned_to, JSON.stringify(activityData.deliverables || []),
            JSON.stringify(activityData.success_criteria || []),
            userId, new Date()
        ]);
    }

    /**
     * Create Budget Allocations
     */
    async createBudgetAllocations(client, campaignId, budgetBreakdown, userId) {
        for (const allocation of budgetBreakdown) {
            const allocationQuery = `
                INSERT INTO campaign_budget_allocations (
                    id, campaign_id, category, allocated_amount, spent_amount,
                    description, approval_required, created_by, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;

            await client.query(allocationQuery, [
                uuidv4(), campaignId, allocation.category,
                allocation.allocated_amount, 0, allocation.description,
                allocation.approval_required || false, userId, new Date()
            ]);
        }
    }

    /**
     * Track Trade Spend
     */
    async trackTradeSpend(spendData, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate spend data
            const validationResult = await this.validateSpendData(spendData);
            if (!validationResult.isValid) {
                throw new Error(`Spend validation failed: ${validationResult.errors.join(', ')}`);
            }

            // Check budget availability
            const budgetCheck = await this.checkBudgetAvailability(
                spendData.campaign_id, 
                spendData.category, 
                spendData.amount
            );

            if (!budgetCheck.available) {
                throw new Error(`Insufficient budget. Available: ${budgetCheck.available_amount}, Required: ${spendData.amount}`);
            }

            // Create spend record
            const spendId = uuidv4();
            const spendQuery = `
                INSERT INTO trade_spend_tracking (
                    id, campaign_id, activity_id, category, subcategory,
                    amount, currency, spend_date, vendor_name, invoice_number,
                    description, approval_status, approved_by, approved_at,
                    created_by, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16
                ) RETURNING id
            `;

            await client.query(spendQuery, [
                spendId, spendData.campaign_id, spendData.activity_id,
                spendData.category, spendData.subcategory, spendData.amount,
                spendData.currency || 'INR', spendData.spend_date || new Date(),
                spendData.vendor_name, spendData.invoice_number,
                spendData.description, spendData.approval_required ? 'pending' : 'approved',
                spendData.approval_required ? null : userId,
                spendData.approval_required ? null : new Date(),
                userId, new Date()
            ]);

            // Update budget allocation spent amount
            const updateBudgetQuery = `
                UPDATE campaign_budget_allocations 
                SET spent_amount = spent_amount + $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE campaign_id = $2 AND category = $3
            `;
            await client.query(updateBudgetQuery, [
                spendData.amount, spendData.campaign_id, spendData.category
            ]);

            // Update campaign total spent
            const updateCampaignQuery = `
                UPDATE trade_marketing_campaigns 
                SET budget_spent = budget_spent + $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `;
            await client.query(updateCampaignQuery, [spendData.amount, spendData.campaign_id]);

            await client.query('COMMIT');

            this.logger.info('Trade spend tracked', {
                spendId,
                campaignId: spendData.campaign_id,
                amount: spendData.amount,
                category: spendData.category
            });

            return {
                success: true,
                spend_id: spendId,
                remaining_budget: budgetCheck.available_amount - spendData.amount,
                message: 'Trade spend tracked successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Trade spend tracking failed', {
                error: error.message,
                spendData,
                userId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Manage Co-op Advertising Campaign
     */
    async createCoopCampaign(coopData, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Create main campaign
            const campaignResult = await this.createCampaign({
                ...coopData,
                campaign_type: 'co_op_advertising'
            }, userId);

            const campaignId = campaignResult.campaign_id;

            // Create co-op specific details
            const coopQuery = `
                INSERT INTO coop_advertising_campaigns (
                    id, campaign_id, partner_id, partner_contribution_percent,
                    partner_contribution_amount, media_channels, creative_assets,
                    approval_workflow, performance_metrics, created_by, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;

            await client.query(coopQuery, [
                uuidv4(), campaignId, coopData.partner_id,
                coopData.partner_contribution_percent, coopData.partner_contribution_amount,
                JSON.stringify(coopData.media_channels), JSON.stringify(coopData.creative_assets),
                JSON.stringify(coopData.approval_workflow), JSON.stringify(coopData.performance_metrics),
                userId, new Date()
            ]);

            // Create media bookings
            if (coopData.media_bookings) {
                for (const booking of coopData.media_bookings) {
                    await this.createMediaBooking(client, campaignId, booking, userId);
                }
            }

            await client.query('COMMIT');

            this.logger.info('Co-op advertising campaign created', {
                campaignId,
                partnerId: coopData.partner_id,
                partnerContribution: coopData.partner_contribution_amount
            });

            return {
                success: true,
                campaign_id: campaignId,
                message: 'Co-op advertising campaign created successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Co-op campaign creation failed', {
                error: error.message,
                coopData,
                userId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Create Media Booking
     */
    async createMediaBooking(client, campaignId, bookingData, userId) {
        const bookingQuery = `
            INSERT INTO media_bookings (
                id, campaign_id, media_type, media_channel, booking_date,
                start_date, end_date, cost, impressions_target,
                reach_target, frequency_target, creative_specifications,
                booking_status, created_by, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
            )
        `;

        await client.query(bookingQuery, [
            uuidv4(), campaignId, bookingData.media_type,
            bookingData.media_channel, bookingData.booking_date,
            bookingData.start_date, bookingData.end_date, bookingData.cost,
            bookingData.impressions_target, bookingData.reach_target,
            bookingData.frequency_target, JSON.stringify(bookingData.creative_specifications),
            'booked', userId, new Date()
        ]);
    }

    /**
     * Manage Merchandising Campaign
     */
    async createMerchandisingCampaign(merchandisingData, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Create main campaign
            const campaignResult = await this.createCampaign({
                ...merchandisingData,
                campaign_type: 'merchandising'
            }, userId);

            const campaignId = campaignResult.campaign_id;

            // Create merchandising specific details
            const merchandisingQuery = `
                INSERT INTO merchandising_campaigns (
                    id, campaign_id, display_type, material_requirements,
                    installation_instructions, store_locations, execution_timeline,
                    compliance_requirements, performance_tracking, created_by, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;

            await client.query(merchandisingQuery, [
                uuidv4(), campaignId, merchandisingData.display_type,
                JSON.stringify(merchandisingData.material_requirements),
                merchandisingData.installation_instructions,
                JSON.stringify(merchandisingData.store_locations),
                JSON.stringify(merchandisingData.execution_timeline),
                JSON.stringify(merchandisingData.compliance_requirements),
                JSON.stringify(merchandisingData.performance_tracking),
                userId, new Date()
            ]);

            // Create store executions
            if (merchandisingData.store_executions) {
                for (const execution of merchandisingData.store_executions) {
                    await this.createStoreExecution(client, campaignId, execution, userId);
                }
            }

            await client.query('COMMIT');

            this.logger.info('Merchandising campaign created', {
                campaignId,
                displayType: merchandisingData.display_type,
                storeCount: merchandisingData.store_locations?.length || 0
            });

            return {
                success: true,
                campaign_id: campaignId,
                message: 'Merchandising campaign created successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Merchandising campaign creation failed', {
                error: error.message,
                merchandisingData,
                userId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Create Store Execution
     */
    async createStoreExecution(client, campaignId, executionData, userId) {
        const executionQuery = `
            INSERT INTO store_executions (
                id, campaign_id, store_id, execution_date, execution_status,
                materials_used, installation_photos, compliance_score,
                execution_notes, executed_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        await client.query(executionQuery, [
            uuidv4(), campaignId, executionData.store_id,
            executionData.execution_date, 'planned',
            JSON.stringify(executionData.materials_used || []),
            JSON.stringify(executionData.installation_photos || []),
            executionData.compliance_score || 0,
            executionData.execution_notes, executionData.executed_by,
            new Date()
        ]);
    }

    /**
     * Calculate Campaign ROI
     */
    async calculateCampaignROI(campaignId) {
        const client = await this.db.connect();
        
        try {
            // Get campaign spend
            const spendQuery = `
                SELECT SUM(amount) as total_spend
                FROM trade_spend_tracking
                WHERE campaign_id = $1 AND approval_status = 'approved'
            `;
            const spendResult = await client.query(spendQuery, [campaignId]);
            const totalSpend = parseFloat(spendResult.rows[0].total_spend) || 0;

            // Get campaign revenue (from orders attributed to campaign)
            const revenueQuery = `
                SELECT SUM(o.total_amount) as total_revenue
                FROM orders o
                JOIN order_campaign_attribution oca ON o.id = oca.order_id
                WHERE oca.campaign_id = $1
            `;
            const revenueResult = await client.query(revenueQuery, [campaignId]);
            const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue) || 0;

            // Calculate metrics
            const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
            const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

            // Get additional metrics
            const metricsQuery = `
                SELECT 
                    COUNT(DISTINCT oca.order_id) as orders_attributed,
                    COUNT(DISTINCT o.customer_id) as customers_reached,
                    AVG(o.total_amount) as average_order_value
                FROM orders o
                JOIN order_campaign_attribution oca ON o.id = oca.order_id
                WHERE oca.campaign_id = $1
            `;
            const metricsResult = await client.query(metricsQuery, [campaignId]);
            const metrics = metricsResult.rows[0];

            const roiData = {
                campaign_id: campaignId,
                total_spend: totalSpend,
                total_revenue: totalRevenue,
                roi_percentage: Math.round(roi * 100) / 100,
                roas: Math.round(roas * 100) / 100,
                orders_attributed: parseInt(metrics.orders_attributed) || 0,
                customers_reached: parseInt(metrics.customers_reached) || 0,
                average_order_value: parseFloat(metrics.average_order_value) || 0,
                cost_per_order: metrics.orders_attributed > 0 ? totalSpend / metrics.orders_attributed : 0,
                calculated_at: new Date()
            };

            // Cache ROI data
            await this.redis.setex(`campaign_roi:${campaignId}`, 3600, JSON.stringify(roiData));

            return roiData;

        } finally {
            client.release();
        }
    }

    /**
     * Get Campaign Performance Dashboard
     */
    async getCampaignDashboard(campaignId) {
        const client = await this.db.connect();
        
        try {
            // Get campaign details
            const campaignQuery = `
                SELECT c.*, b.name as brand_name,
                       u.first_name || ' ' || u.last_name as manager_name
                FROM trade_marketing_campaigns c
                LEFT JOIN brands b ON c.brand_id = b.id
                LEFT JOIN users u ON c.campaign_manager_id = u.id
                WHERE c.id = $1
            `;
            const campaignResult = await client.query(campaignQuery, [campaignId]);
            
            if (campaignResult.rows.length === 0) {
                throw new Error('Campaign not found');
            }

            const campaign = campaignResult.rows[0];

            // Get budget utilization
            const budgetQuery = `
                SELECT 
                    category,
                    allocated_amount,
                    spent_amount,
                    (spent_amount / NULLIF(allocated_amount, 0)) * 100 as utilization_percent
                FROM campaign_budget_allocations
                WHERE campaign_id = $1
                ORDER BY allocated_amount DESC
            `;
            const budgetResult = await client.query(budgetQuery, [campaignId]);

            // Get activity status
            const activityQuery = `
                SELECT 
                    status,
                    COUNT(*) as count,
                    SUM(budget_allocated) as total_budget
                FROM campaign_activities
                WHERE campaign_id = $1
                GROUP BY status
            `;
            const activityResult = await client.query(activityQuery, [campaignId]);

            // Get recent spend
            const recentSpendQuery = `
                SELECT 
                    category,
                    amount,
                    spend_date,
                    vendor_name,
                    description
                FROM trade_spend_tracking
                WHERE campaign_id = $1
                ORDER BY spend_date DESC
                LIMIT 10
            `;
            const recentSpendResult = await client.query(recentSpendQuery, [campaignId]);

            // Calculate ROI
            const roiData = await this.calculateCampaignROI(campaignId);

            const dashboard = {
                campaign: campaign,
                budget_utilization: budgetResult.rows,
                activity_status: activityResult.rows,
                recent_spend: recentSpendResult.rows,
                roi_metrics: roiData,
                performance_summary: {
                    budget_utilization_percent: campaign.budget_allocated > 0 ? 
                        (campaign.budget_spent / campaign.budget_allocated) * 100 : 0,
                    days_remaining: Math.ceil((new Date(campaign.end_date) - new Date()) / (1000 * 60 * 60 * 24)),
                    completion_percent: this.calculateCampaignCompletion(campaign, activityResult.rows)
                }
            };

            return dashboard;

        } finally {
            client.release();
        }
    }

    /**
     * Calculate Campaign Completion Percentage
     */
    calculateCampaignCompletion(campaign, activities) {
        const totalActivities = activities.reduce((sum, activity) => sum + activity.count, 0);
        const completedActivities = activities.find(a => a.status === 'completed')?.count || 0;
        
        if (totalActivities === 0) return 0;
        
        return Math.round((completedActivities / totalActivities) * 100);
    }

    /**
     * Validate Campaign Data
     */
    async validateCampaignData(campaignData) {
        const schema = Joi.object({
            campaign_name: Joi.string().min(3).max(255).required(),
            campaign_type: Joi.string().valid('trade_promotion', 'co_op_advertising', 'merchandising', 'trade_show').required(),
            description: Joi.string().max(1000).optional(),
            start_date: Joi.date().required(),
            end_date: Joi.date().greater(Joi.ref('start_date')).required(),
            budget_allocated: Joi.number().min(0).required(),
            brand_id: Joi.string().uuid().required(),
            campaign_manager_id: Joi.string().uuid().required(),
            target_audience: Joi.object().required(),
            objectives: Joi.array().items(Joi.string()).required(),
            success_metrics: Joi.array().items(Joi.object()).required(),
            activities: Joi.array().items(Joi.object()).optional(),
            budget_breakdown: Joi.array().items(Joi.object()).optional(),
            partner_ids: Joi.array().items(Joi.string().uuid()).optional()
        });

        const { error, value } = schema.validate(campaignData);
        
        return {
            isValid: !error,
            errors: error ? error.details.map(detail => detail.message) : [],
            data: value
        };
    }

    /**
     * Validate Spend Data
     */
    async validateSpendData(spendData) {
        const schema = Joi.object({
            campaign_id: Joi.string().uuid().required(),
            activity_id: Joi.string().uuid().optional(),
            category: Joi.string().required(),
            subcategory: Joi.string().optional(),
            amount: Joi.number().min(0.01).required(),
            currency: Joi.string().length(3).optional(),
            spend_date: Joi.date().optional(),
            vendor_name: Joi.string().max(255).required(),
            invoice_number: Joi.string().max(100).optional(),
            description: Joi.string().max(500).required(),
            approval_required: Joi.boolean().optional()
        });

        const { error, value } = schema.validate(spendData);
        
        return {
            isValid: !error,
            errors: error ? error.details.map(detail => detail.message) : [],
            data: value
        };
    }

    /**
     * Check Budget Availability
     */
    async checkBudgetAvailability(campaignId, category, amount) {
        const client = await this.db.connect();
        
        try {
            const budgetQuery = `
                SELECT 
                    allocated_amount,
                    spent_amount,
                    (allocated_amount - spent_amount) as available_amount
                FROM campaign_budget_allocations
                WHERE campaign_id = $1 AND category = $2
            `;
            const budgetResult = await client.query(budgetQuery, [campaignId, category]);
            
            if (budgetResult.rows.length === 0) {
                return { available: false, available_amount: 0, message: 'Budget category not found' };
            }

            const budget = budgetResult.rows[0];
            const availableAmount = parseFloat(budget.available_amount);
            
            return {
                available: availableAmount >= amount,
                available_amount: availableAmount,
                allocated_amount: parseFloat(budget.allocated_amount),
                spent_amount: parseFloat(budget.spent_amount)
            };

        } finally {
            client.release();
        }
    }

    /**
     * Generate Campaign Code
     */
    async generateCampaignCode(campaignType) {
        const typePrefix = {
            'trade_promotion': 'TP',
            'co_op_advertising': 'CA',
            'merchandising': 'MD',
            'trade_show': 'TS'
        };

        const prefix = typePrefix[campaignType] || 'TM';
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        // Get sequence number for this type and month
        const sequenceKey = `campaign_seq:${campaignType}:${year}${month}`;
        const sequence = await this.redis.incr(sequenceKey);
        await this.redis.expire(sequenceKey, 86400 * 31); // Expire after 31 days
        
        return `${prefix}${year}${month}${sequence.toString().padStart(3, '0')}`;
    }

    /**
     * Initialize Campaign Workflow
     */
    async initializeCampaignWorkflow(client, campaignId, campaignType) {
        const workflow = this.campaignTypes[campaignType]?.workflow_stages || ['planning', 'execution', 'evaluation'];
        
        // Create initial workflow state
        const workflowQuery = `
            INSERT INTO campaign_workflow_states (
                id, campaign_id, workflow_stage, stage_status,
                entered_at, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await client.query(workflowQuery, [
            uuidv4(), campaignId, workflow[0], 'in_progress',
            new Date(), new Date()
        ]);
    }

    /**
     * Associate Campaign Partners
     */
    async associateCampaignPartners(client, campaignId, partnerIds) {
        for (const partnerId of partnerIds) {
            const associationQuery = `
                INSERT INTO campaign_partner_associations (
                    id, campaign_id, partner_id, association_type,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5)
            `;

            await client.query(associationQuery, [
                uuidv4(), campaignId, partnerId, 'primary',
                new Date()
            ]);
        }
    }

    /**
     * Cache Campaign Data
     */
    async cacheCampaign(campaignId) {
        const campaign = await this.getCampaignDetails(campaignId);
        await this.redis.setex(`campaign:${campaignId}`, 300, JSON.stringify(campaign));
    }

    /**
     * Get Campaign Details
     */
    async getCampaignDetails(campaignId) {
        const client = await this.db.connect();
        
        try {
            const campaignQuery = `
                SELECT c.*, b.name as brand_name,
                       u.first_name || ' ' || u.last_name as manager_name
                FROM trade_marketing_campaigns c
                LEFT JOIN brands b ON c.brand_id = b.id
                LEFT JOIN users u ON c.campaign_manager_id = u.id
                WHERE c.id = $1
            `;
            const campaignResult = await client.query(campaignQuery, [campaignId]);
            
            if (campaignResult.rows.length === 0) {
                throw new Error('Campaign not found');
            }

            return campaignResult.rows[0];

        } finally {
            client.release();
        }
    }
}

module.exports = TradeMarketingService;