/**
 * SalesSync Tier-1 Customer Management Service
 * Complete customer lifecycle management system
 * 
 * Features:
 * - Customer lifecycle management (prospect to loyal customer)
 * - Credit assessment and management
 * - Customer hierarchy and relationships
 * - CRM integration and contact management
 * - Customer segmentation and targeting
 * - Churn prediction and retention
 * - Customer analytics and insights
 * - Multi-contact management
 * - Customer communication history
 * - Territory and sales rep assignment
 */

const express = require('express');
const { Pool } = require('pg');
const Redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const winston = require('winston');

class CustomerManagementService {
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
                new winston.transports.File({ filename: 'customer-management.log' }),
                new winston.transports.Console()
            ]
        });

        this.initializeCustomerSettings();
    }

    /**
     * Initialize Customer Settings
     */
    initializeCustomerSettings() {
        this.customerLifecycleStages = {
            PROSPECT: { name: 'Prospect', description: 'Potential customer identified' },
            LEAD: { name: 'Lead', description: 'Qualified prospect with interest' },
            OPPORTUNITY: { name: 'Opportunity', description: 'Active sales opportunity' },
            CUSTOMER: { name: 'Customer', description: 'Active paying customer' },
            LOYAL: { name: 'Loyal Customer', description: 'High-value repeat customer' },
            INACTIVE: { name: 'Inactive', description: 'No recent activity' },
            CHURNED: { name: 'Churned', description: 'Lost customer' }
        };

        this.customerSegments = {
            ENTERPRISE: { name: 'Enterprise', min_revenue: 1000000, description: 'Large enterprise customers' },
            SMB: { name: 'Small/Medium Business', min_revenue: 100000, description: 'SMB customers' },
            STARTUP: { name: 'Startup', min_revenue: 10000, description: 'Startup customers' },
            INDIVIDUAL: { name: 'Individual', min_revenue: 0, description: 'Individual customers' }
        };

        this.riskCategories = {
            LOW: { score_range: [0, 30], description: 'Low risk customers' },
            MEDIUM: { score_range: [31, 60], description: 'Medium risk customers' },
            HIGH: { score_range: [61, 80], description: 'High risk customers' },
            CRITICAL: { score_range: [81, 100], description: 'Critical risk customers' }
        };
    }

    /**
     * Create Customer with Full Profile
     */
    async createCustomer(customerData, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate customer data
            const validationResult = await this.validateCustomerData(customerData);
            if (!validationResult.isValid) {
                throw new Error(`Customer validation failed: ${validationResult.errors.join(', ')}`);
            }

            // Generate customer code
            const customerCode = await this.generateCustomerCode();

            // Create customer record
            const customerId = uuidv4();
            const customerQuery = `
                INSERT INTO customers (
                    id, customer_code, company_name, contact_person, email, phone,
                    mobile, whatsapp_number, address_line1, address_line2, city,
                    state, postal_code, country, location, customer_type,
                    business_type, status, credit_limit, payment_terms, tax_id,
                    gst_number, pan_number, territory_id, area_id, sales_rep_id,
                    customer_since, store_size, store_type, landmark,
                    operating_hours, notes, tags, custom_fields,
                    created_by, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                    ST_SetSRID(ST_MakePoint($15, $16), 4326), $17, $18, $19, $20,
                    $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
                    $33, $34, $35, $36, $37
                ) RETURNING id, customer_code
            `;

            const customerResult = await client.query(customerQuery, [
                customerId, customerCode, customerData.company_name,
                customerData.contact_person, customerData.email, customerData.phone,
                customerData.mobile, customerData.whatsapp_number,
                customerData.address_line1, customerData.address_line2,
                customerData.city, customerData.state, customerData.postal_code,
                customerData.country || 'India',
                customerData.location?.longitude || 0, customerData.location?.latitude || 0,
                customerData.customer_type || 'retail', customerData.business_type,
                'active', customerData.credit_limit || 0, customerData.payment_terms || 30,
                customerData.tax_id, customerData.gst_number, customerData.pan_number,
                customerData.territory_id, customerData.area_id, customerData.sales_rep_id,
                new Date(), customerData.store_size, customerData.store_type,
                customerData.landmark, JSON.stringify(customerData.operating_hours || {}),
                customerData.notes, customerData.tags || [], 
                JSON.stringify(customerData.custom_fields || {}),
                userId, new Date()
            ]);

            // Create additional contacts
            if (customerData.contacts && customerData.contacts.length > 0) {
                for (const contact of customerData.contacts) {
                    await this.createCustomerContact(client, customerId, contact, userId);
                }
            }

            // Initialize customer lifecycle
            await this.initializeCustomerLifecycle(client, customerId, userId);

            // Perform initial credit assessment
            if (customerData.credit_limit > 0) {
                await this.performCreditAssessment(client, customerId, customerData, userId);
            }

            // Create customer segmentation
            await this.assignCustomerSegment(client, customerId, customerData);

            await client.query('COMMIT');

            // Cache customer data
            await this.cacheCustomer(customerId);

            this.logger.info('Customer created successfully', {
                customerId,
                customerCode,
                companyName: customerData.company_name,
                customerType: customerData.customer_type
            });

            return {
                success: true,
                customer_id: customerId,
                customer_code: customerCode,
                message: 'Customer created successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Customer creation failed', {
                error: error.message,
                customerData,
                userId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Create Customer Contact
     */
    async createCustomerContact(client, customerId, contactData, userId) {
        const contactQuery = `
            INSERT INTO customer_contacts (
                id, customer_id, contact_type, name, designation, email,
                phone, mobile, whatsapp_number, is_primary, is_decision_maker,
                is_active, notes, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;

        await client.query(contactQuery, [
            uuidv4(), customerId, contactData.contact_type, contactData.name,
            contactData.designation, contactData.email, contactData.phone,
            contactData.mobile, contactData.whatsapp_number,
            contactData.is_primary || false, contactData.is_decision_maker || false,
            true, contactData.notes, new Date()
        ]);
    }

    /**
     * Initialize Customer Lifecycle
     */
    async initializeCustomerLifecycle(client, customerId, userId) {
        const lifecycleQuery = `
            INSERT INTO customer_lifecycle_stages (
                id, customer_id, stage, stage_date, notes, created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        await client.query(lifecycleQuery, [
            uuidv4(), customerId, 'PROSPECT', new Date(),
            'Initial customer creation', userId, new Date()
        ]);
    }

    /**
     * Perform Credit Assessment
     */
    async performCreditAssessment(client, customerId, customerData, userId) {
        // Calculate credit score based on various factors
        let creditScore = 50; // Base score

        // Business type scoring
        const businessTypeScores = {
            'manufacturing': 20,
            'retail': 15,
            'wholesale': 18,
            'services': 12,
            'individual': 5
        };
        creditScore += businessTypeScores[customerData.business_type] || 10;

        // Years in business (if provided)
        if (customerData.years_in_business) {
            creditScore += Math.min(customerData.years_in_business * 2, 20);
        }

        // Annual revenue (if provided)
        if (customerData.annual_revenue) {
            if (customerData.annual_revenue > 10000000) creditScore += 15;
            else if (customerData.annual_revenue > 1000000) creditScore += 10;
            else if (customerData.annual_revenue > 100000) creditScore += 5;
        }

        // Cap at 100
        creditScore = Math.min(creditScore, 100);

        // Determine risk category
        let riskCategory = 'MEDIUM';
        for (const [category, config] of Object.entries(this.riskCategories)) {
            if (creditScore >= config.score_range[0] && creditScore <= config.score_range[1]) {
                riskCategory = category;
                break;
            }
        }

        // Create credit assessment record
        const assessmentQuery = `
            INSERT INTO customer_credit_assessments (
                id, customer_id, credit_score, risk_category, assessment_date,
                assessment_factors, recommended_credit_limit, assessed_by,
                notes, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        const assessmentFactors = {
            business_type: customerData.business_type,
            years_in_business: customerData.years_in_business,
            annual_revenue: customerData.annual_revenue,
            base_score: 50,
            calculated_score: creditScore
        };

        await client.query(assessmentQuery, [
            uuidv4(), customerId, creditScore, riskCategory, new Date(),
            JSON.stringify(assessmentFactors), customerData.credit_limit,
            userId, 'Initial credit assessment', new Date()
        ]);

        // Update customer risk score
        await client.query(
            'UPDATE customers SET risk_score = $1 WHERE id = $2',
            [creditScore, customerId]
        );
    }

    /**
     * Assign Customer Segment
     */
    async assignCustomerSegment(client, customerId, customerData) {
        let segment = 'INDIVIDUAL';
        const annualRevenue = customerData.annual_revenue || 0;

        // Determine segment based on revenue
        for (const [segmentKey, config] of Object.entries(this.customerSegments)) {
            if (annualRevenue >= config.min_revenue) {
                segment = segmentKey;
                break;
            }
        }

        // Update customer segment
        await client.query(
            'UPDATE customers SET customer_segment = $1 WHERE id = $2',
            [segment, customerId]
        );
    }

    /**
     * Update Customer Lifecycle Stage
     */
    async updateLifecycleStage(customerId, newStage, notes, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate stage
            if (!this.customerLifecycleStages[newStage]) {
                throw new Error(`Invalid lifecycle stage: ${newStage}`);
            }

            // Get current stage
            const currentStageQuery = `
                SELECT stage FROM customer_lifecycle_stages
                WHERE customer_id = $1
                ORDER BY created_at DESC
                LIMIT 1
            `;
            const currentStageResult = await client.query(currentStageQuery, [customerId]);
            const currentStage = currentStageResult.rows[0]?.stage;

            if (currentStage === newStage) {
                throw new Error('Customer is already in this lifecycle stage');
            }

            // Create new lifecycle stage record
            const lifecycleQuery = `
                INSERT INTO customer_lifecycle_stages (
                    id, customer_id, stage, stage_date, previous_stage,
                    notes, created_by, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `;

            await client.query(lifecycleQuery, [
                uuidv4(), customerId, newStage, new Date(), currentStage,
                notes, userId, new Date()
            ]);

            // Update customer status if needed
            if (newStage === 'CHURNED') {
                await client.query(
                    'UPDATE customers SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    ['inactive', customerId]
                );
            } else if (newStage === 'CUSTOMER' || newStage === 'LOYAL') {
                await client.query(
                    'UPDATE customers SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    ['active', customerId]
                );
            }

            await client.query('COMMIT');

            // Invalidate cache
            await this.redis.del(`customer:${customerId}`);

            this.logger.info('Customer lifecycle stage updated', {
                customerId,
                previousStage: currentStage,
                newStage,
                userId
            });

            return {
                success: true,
                previous_stage: currentStage,
                new_stage: newStage,
                message: 'Lifecycle stage updated successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Lifecycle stage update failed', {
                error: error.message,
                customerId,
                newStage,
                userId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Update Credit Limit
     */
    async updateCreditLimit(customerId, newCreditLimit, reason, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Get current credit limit
            const customerQuery = `
                SELECT credit_limit, credit_used FROM customers WHERE id = $1
            `;
            const customerResult = await client.query(customerQuery, [customerId]);
            
            if (customerResult.rows.length === 0) {
                throw new Error('Customer not found');
            }

            const customer = customerResult.rows[0];
            const oldCreditLimit = customer.credit_limit;

            // Validate new credit limit
            if (newCreditLimit < customer.credit_used) {
                throw new Error(`New credit limit cannot be less than used credit (${customer.credit_used})`);
            }

            // Create credit history record
            const historyQuery = `
                INSERT INTO customer_credit_history (
                    id, customer_id, credit_limit_old, credit_limit_new,
                    changed_by, change_reason, effective_date, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `;

            await client.query(historyQuery, [
                uuidv4(), customerId, oldCreditLimit, newCreditLimit,
                userId, reason, new Date(), new Date()
            ]);

            // Update customer credit limit
            const updateQuery = `
                UPDATE customers 
                SET credit_limit = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
                WHERE id = $3
            `;
            await client.query(updateQuery, [newCreditLimit, userId, customerId]);

            await client.query('COMMIT');

            // Invalidate cache
            await this.redis.del(`customer:${customerId}`);

            this.logger.info('Customer credit limit updated', {
                customerId,
                oldCreditLimit,
                newCreditLimit,
                reason,
                userId
            });

            return {
                success: true,
                old_credit_limit: oldCreditLimit,
                new_credit_limit: newCreditLimit,
                message: 'Credit limit updated successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Credit limit update failed', {
                error: error.message,
                customerId,
                newCreditLimit,
                userId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Create Customer Hierarchy Relationship
     */
    async createCustomerHierarchy(parentCustomerId, childCustomerId, relationshipType, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate both customers exist
            const customerCheck = await client.query(
                'SELECT id FROM customers WHERE id IN ($1, $2)',
                [parentCustomerId, childCustomerId]
            );

            if (customerCheck.rows.length !== 2) {
                throw new Error('One or both customers not found');
            }

            // Check for circular relationships
            const circularCheck = await this.checkCircularRelationship(
                client, parentCustomerId, childCustomerId
            );

            if (circularCheck) {
                throw new Error('Circular relationship detected');
            }

            // Create hierarchy relationship
            const hierarchyQuery = `
                INSERT INTO customer_hierarchy (
                    id, parent_customer_id, child_customer_id, relationship_type,
                    effective_from, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (parent_customer_id, child_customer_id) 
                DO UPDATE SET 
                    relationship_type = $4,
                    effective_from = $5
            `;

            await client.query(hierarchyQuery, [
                uuidv4(), parentCustomerId, childCustomerId, relationshipType,
                new Date(), new Date()
            ]);

            await client.query('COMMIT');

            this.logger.info('Customer hierarchy created', {
                parentCustomerId,
                childCustomerId,
                relationshipType,
                userId
            });

            return {
                success: true,
                message: 'Customer hierarchy relationship created successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Customer hierarchy creation failed', {
                error: error.message,
                parentCustomerId,
                childCustomerId,
                relationshipType,
                userId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Check Circular Relationship
     */
    async checkCircularRelationship(client, parentId, childId) {
        // Check if childId is already a parent of parentId
        const circularQuery = `
            WITH RECURSIVE hierarchy_tree AS (
                SELECT parent_customer_id, child_customer_id, 1 as level
                FROM customer_hierarchy
                WHERE child_customer_id = $1
                
                UNION ALL
                
                SELECT ch.parent_customer_id, ch.child_customer_id, ht.level + 1
                FROM customer_hierarchy ch
                JOIN hierarchy_tree ht ON ch.child_customer_id = ht.parent_customer_id
                WHERE ht.level < 10
            )
            SELECT 1 FROM hierarchy_tree WHERE parent_customer_id = $2
        `;

        const result = await client.query(circularQuery, [parentId, childId]);
        return result.rows.length > 0;
    }

    /**
     * Perform Churn Prediction Analysis
     */
    async performChurnPrediction(customerId) {
        const client = await this.db.connect();
        
        try {
            // Get customer data for churn analysis
            const customerQuery = `
                SELECT 
                    c.*,
                    EXTRACT(DAYS FROM CURRENT_DATE - c.last_order_date) as days_since_last_order,
                    EXTRACT(DAYS FROM CURRENT_DATE - c.last_visit_date) as days_since_last_visit,
                    c.total_orders,
                    c.lifetime_value,
                    COALESCE(
                        (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id 
                         AND o.order_date >= CURRENT_DATE - INTERVAL '90 days'), 0
                    ) as orders_last_90_days,
                    COALESCE(
                        (SELECT SUM(o.total_amount) FROM orders o WHERE o.customer_id = c.id 
                         AND o.order_date >= CURRENT_DATE - INTERVAL '90 days'), 0
                    ) as revenue_last_90_days
                FROM customers c
                WHERE c.id = $1
            `;

            const customerResult = await client.query(customerQuery, [customerId]);
            
            if (customerResult.rows.length === 0) {
                throw new Error('Customer not found');
            }

            const customer = customerResult.rows[0];

            // Calculate churn risk score
            let churnScore = 0;

            // Days since last order factor
            const daysSinceLastOrder = customer.days_since_last_order || 365;
            if (daysSinceLastOrder > 180) churnScore += 30;
            else if (daysSinceLastOrder > 90) churnScore += 20;
            else if (daysSinceLastOrder > 30) churnScore += 10;

            // Order frequency factor
            if (customer.orders_last_90_days === 0) churnScore += 25;
            else if (customer.orders_last_90_days < 2) churnScore += 15;
            else if (customer.orders_last_90_days < 5) churnScore += 5;

            // Revenue trend factor
            const avgOrderValue = customer.total_orders > 0 ? 
                customer.lifetime_value / customer.total_orders : 0;
            const recentAvgOrderValue = customer.orders_last_90_days > 0 ? 
                customer.revenue_last_90_days / customer.orders_last_90_days : 0;

            if (recentAvgOrderValue < avgOrderValue * 0.5) churnScore += 20;
            else if (recentAvgOrderValue < avgOrderValue * 0.8) churnScore += 10;

            // Customer lifecycle stage factor
            if (customer.status === 'inactive') churnScore += 15;

            // Determine churn risk level
            let riskLevel = 'LOW';
            if (churnScore >= 70) riskLevel = 'CRITICAL';
            else if (churnScore >= 50) riskLevel = 'HIGH';
            else if (churnScore >= 30) riskLevel = 'MEDIUM';

            // Create churn prediction record
            const predictionQuery = `
                INSERT INTO customer_churn_predictions (
                    id, customer_id, churn_score, risk_level, prediction_date,
                    prediction_factors, recommended_actions, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `;

            const predictionFactors = {
                days_since_last_order: daysSinceLastOrder,
                orders_last_90_days: customer.orders_last_90_days,
                revenue_last_90_days: customer.revenue_last_90_days,
                avg_order_value: avgOrderValue,
                recent_avg_order_value: recentAvgOrderValue,
                customer_status: customer.status
            };

            const recommendedActions = this.generateChurnPreventionActions(riskLevel, predictionFactors);

            await client.query(predictionQuery, [
                uuidv4(), customerId, churnScore, riskLevel, new Date(),
                JSON.stringify(predictionFactors), JSON.stringify(recommendedActions),
                new Date()
            ]);

            return {
                customer_id: customerId,
                churn_score: churnScore,
                risk_level: riskLevel,
                prediction_factors: predictionFactors,
                recommended_actions: recommendedActions,
                prediction_date: new Date()
            };

        } finally {
            client.release();
        }
    }

    /**
     * Generate Churn Prevention Actions
     */
    generateChurnPreventionActions(riskLevel, factors) {
        const actions = [];

        switch (riskLevel) {
            case 'CRITICAL':
                actions.push('Immediate personal outreach by account manager');
                actions.push('Offer special discount or incentive');
                actions.push('Schedule face-to-face meeting');
                actions.push('Review and address any service issues');
                break;
            case 'HIGH':
                actions.push('Proactive outreach within 48 hours');
                actions.push('Send personalized retention offer');
                actions.push('Conduct satisfaction survey');
                break;
            case 'MEDIUM':
                actions.push('Include in next marketing campaign');
                actions.push('Send product recommendations');
                actions.push('Schedule regular check-in call');
                break;
            case 'LOW':
                actions.push('Continue regular engagement');
                actions.push('Monitor for changes in behavior');
                break;
        }

        return actions;
    }

    /**
     * Get Customer 360 View
     */
    async getCustomer360View(customerId) {
        const client = await this.db.connect();
        
        try {
            // Get comprehensive customer data
            const customerQuery = `
                SELECT 
                    c.*,
                    t.name as territory_name,
                    a.name as area_name,
                    u.first_name || ' ' || u.last_name as sales_rep_name,
                    EXTRACT(DAYS FROM CURRENT_DATE - c.customer_since) as days_as_customer,
                    CASE 
                        WHEN c.last_order_date IS NULL THEN 'Never ordered'
                        WHEN c.last_order_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'Active'
                        WHEN c.last_order_date >= CURRENT_DATE - INTERVAL '90 days' THEN 'Recent'
                        ELSE 'Inactive'
                    END as activity_status
                FROM customers c
                LEFT JOIN territories t ON c.territory_id = t.id
                LEFT JOIN areas a ON c.area_id = a.id
                LEFT JOIN users u ON c.sales_rep_id = u.id
                WHERE c.id = $1
            `;

            const customerResult = await client.query(customerQuery, [customerId]);
            
            if (customerResult.rows.length === 0) {
                throw new Error('Customer not found');
            }

            const customer = customerResult.rows[0];

            // Get contacts
            const contactsQuery = `
                SELECT * FROM customer_contacts
                WHERE customer_id = $1 AND is_active = true
                ORDER BY is_primary DESC, created_at ASC
            `;
            const contactsResult = await client.query(contactsQuery, [customerId]);

            // Get recent orders
            const ordersQuery = `
                SELECT * FROM orders
                WHERE customer_id = $1
                ORDER BY order_date DESC
                LIMIT 10
            `;
            const ordersResult = await client.query(ordersQuery, [customerId]);

            // Get lifecycle history
            const lifecycleQuery = `
                SELECT * FROM customer_lifecycle_stages
                WHERE customer_id = $1
                ORDER BY created_at DESC
            `;
            const lifecycleResult = await client.query(lifecycleQuery, [customerId]);

            // Get credit history
            const creditQuery = `
                SELECT * FROM customer_credit_history
                WHERE customer_id = $1
                ORDER BY created_at DESC
                LIMIT 5
            `;
            const creditResult = await client.query(creditQuery, [customerId]);

            // Get recent visits
            const visitsQuery = `
                SELECT vl.*, fa.agent_code, u.first_name || ' ' || u.last_name as agent_name
                FROM visit_lists vl
                LEFT JOIN field_agents fa ON vl.agent_id = fa.id
                LEFT JOIN users u ON fa.user_id = u.id
                WHERE vl.customer_id = $1
                ORDER BY vl.visit_date DESC
                LIMIT 10
            `;
            const visitsResult = await client.query(visitsQuery, [customerId]);

            // Get churn prediction
            const churnQuery = `
                SELECT * FROM customer_churn_predictions
                WHERE customer_id = $1
                ORDER BY prediction_date DESC
                LIMIT 1
            `;
            const churnResult = await client.query(churnQuery, [customerId]);

            return {
                customer: customer,
                contacts: contactsResult.rows,
                recent_orders: ordersResult.rows,
                lifecycle_history: lifecycleResult.rows,
                credit_history: creditResult.rows,
                recent_visits: visitsResult.rows,
                churn_prediction: churnResult.rows[0] || null,
                generated_at: new Date()
            };

        } finally {
            client.release();
        }
    }

    /**
     * Generate Customer Code
     */
    async generateCustomerCode() {
        const prefix = 'CUST';
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        const sequenceKey = `customer_seq:${year}${month}`;
        const sequence = await this.redis.incr(sequenceKey);
        await this.redis.expire(sequenceKey, 86400 * 31);
        
        return `${prefix}${year}${month}${sequence.toString().padStart(5, '0')}`;
    }

    /**
     * Cache Customer Data
     */
    async cacheCustomer(customerId) {
        const customer = await this.getCustomer360View(customerId);
        await this.redis.setex(`customer:${customerId}`, 600, JSON.stringify(customer));
    }

    /**
     * Validate Customer Data
     */
    async validateCustomerData(customerData) {
        const schema = Joi.object({
            company_name: Joi.string().min(2).max(255).required(),
            contact_person: Joi.string().max(255).optional(),
            email: Joi.string().email().optional(),
            phone: Joi.string().max(20).optional(),
            mobile: Joi.string().max(20).optional(),
            whatsapp_number: Joi.string().max(20).optional(),
            address_line1: Joi.string().max(255).optional(),
            address_line2: Joi.string().max(255).optional(),
            city: Joi.string().max(100).optional(),
            state: Joi.string().max(100).optional(),
            postal_code: Joi.string().max(20).optional(),
            country: Joi.string().max(100).optional(),
            location: Joi.object({
                latitude: Joi.number().min(-90).max(90).required(),
                longitude: Joi.number().min(-180).max(180).required()
            }).optional(),
            customer_type: Joi.string().valid('retail', 'wholesale', 'distributor', 'corporate').optional(),
            business_type: Joi.string().max(100).optional(),
            credit_limit: Joi.number().min(0).optional(),
            payment_terms: Joi.number().integer().min(0).optional(),
            tax_id: Joi.string().max(50).optional(),
            gst_number: Joi.string().max(20).optional(),
            pan_number: Joi.string().max(20).optional(),
            territory_id: Joi.string().uuid().optional(),
            area_id: Joi.string().uuid().optional(),
            sales_rep_id: Joi.string().uuid().optional(),
            store_size: Joi.string().max(50).optional(),
            store_type: Joi.string().max(50).optional(),
            landmark: Joi.string().max(255).optional(),
            operating_hours: Joi.object().optional(),
            notes: Joi.string().optional(),
            tags: Joi.array().items(Joi.string()).optional(),
            custom_fields: Joi.object().optional(),
            contacts: Joi.array().items(
                Joi.object({
                    contact_type: Joi.string().required(),
                    name: Joi.string().required(),
                    designation: Joi.string().optional(),
                    email: Joi.string().email().optional(),
                    phone: Joi.string().optional(),
                    mobile: Joi.string().optional(),
                    whatsapp_number: Joi.string().optional(),
                    is_primary: Joi.boolean().optional(),
                    is_decision_maker: Joi.boolean().optional(),
                    notes: Joi.string().optional()
                })
            ).optional(),
            annual_revenue: Joi.number().min(0).optional(),
            years_in_business: Joi.number().integer().min(0).optional()
        });

        const { error, value } = schema.validate(customerData);
        
        return {
            isValid: !error,
            errors: error ? error.details.map(detail => detail.message) : [],
            data: value
        };
    }
}

module.exports = CustomerManagementService;