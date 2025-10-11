/**
 * SalesSync Tier-1 Event Management Service
 * Complete event lifecycle management system
 * 
 * Features:
 * - Event planning and scheduling
 * - Venue management and booking
 * - Attendee registration and management
 * - Resource allocation and tracking
 * - Budget management and cost tracking
 * - Vendor and supplier management
 * - Post-event analytics and ROI
 * - Integration with trade marketing campaigns
 */

const express = require('express');
const { Pool } = require('pg');
const Redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const winston = require('winston');

class EventManagementService {
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
                new winston.transports.File({ filename: 'event-management.log' }),
                new winston.transports.Console()
            ]
        });

        this.initializeEventTypes();
    }

    /**
     * Initialize Event Types and Templates
     */
    initializeEventTypes() {
        this.eventTypes = {
            trade_show: {
                name: 'Trade Show',
                description: 'Industry trade shows and exhibitions',
                required_resources: ['booth_space', 'display_materials', 'staff'],
                typical_duration: 3, // days
                planning_lead_time: 90 // days
            },
            product_launch: {
                name: 'Product Launch',
                description: 'New product launch events',
                required_resources: ['venue', 'catering', 'av_equipment', 'marketing_materials'],
                typical_duration: 1,
                planning_lead_time: 60
            },
            customer_conference: {
                name: 'Customer Conference',
                description: 'Customer conferences and seminars',
                required_resources: ['venue', 'catering', 'speakers', 'av_equipment'],
                typical_duration: 2,
                planning_lead_time: 120
            },
            dealer_meet: {
                name: 'Dealer Meet',
                description: 'Dealer and partner meetings',
                required_resources: ['venue', 'catering', 'presentation_materials'],
                typical_duration: 1,
                planning_lead_time: 30
            },
            roadshow: {
                name: 'Roadshow',
                description: 'Multi-city promotional roadshows',
                required_resources: ['transportation', 'mobile_setup', 'staff', 'promotional_materials'],
                typical_duration: 30,
                planning_lead_time: 45
            }
        };
    }

    /**
     * Create Event
     */
    async createEvent(eventData, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate event data
            const validationResult = await this.validateEventData(eventData);
            if (!validationResult.isValid) {
                throw new Error(`Event validation failed: ${validationResult.errors.join(', ')}`);
            }

            // Generate event code
            const eventCode = await this.generateEventCode(eventData.event_type);

            // Create event record
            const eventId = uuidv4();
            const eventQuery = `
                INSERT INTO events (
                    id, event_code, event_name, event_type, description,
                    start_date, end_date, status, budget_allocated, budget_spent,
                    expected_attendees, venue_id, event_manager_id,
                    objectives, success_metrics, campaign_id,
                    created_by, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18
                ) RETURNING id, event_code
            `;

            const eventResult = await client.query(eventQuery, [
                eventId, eventCode, eventData.event_name, eventData.event_type,
                eventData.description, eventData.start_date, eventData.end_date,
                'planning', eventData.budget_allocated, 0, eventData.expected_attendees,
                eventData.venue_id, eventData.event_manager_id,
                JSON.stringify(eventData.objectives || []),
                JSON.stringify(eventData.success_metrics || []),
                eventData.campaign_id, userId, new Date()
            ]);

            // Create event schedule
            if (eventData.schedule && eventData.schedule.length > 0) {
                for (const scheduleItem of eventData.schedule) {
                    await this.createEventScheduleItem(client, eventId, scheduleItem, userId);
                }
            }

            // Allocate resources
            if (eventData.resource_requirements) {
                await this.allocateEventResources(client, eventId, eventData.resource_requirements, userId);
            }

            // Create budget breakdown
            if (eventData.budget_breakdown) {
                await this.createEventBudgetBreakdown(client, eventId, eventData.budget_breakdown, userId);
            }

            // Initialize event workflow
            await this.initializeEventWorkflow(client, eventId, eventData.event_type);

            await client.query('COMMIT');

            // Cache event data
            await this.cacheEvent(eventId);

            this.logger.info('Event created successfully', {
                eventId,
                eventCode,
                eventType: eventData.event_type,
                budget: eventData.budget_allocated
            });

            return {
                success: true,
                event_id: eventId,
                event_code: eventCode,
                message: 'Event created successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Event creation failed', {
                error: error.message,
                eventData,
                userId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Create Event Schedule Item
     */
    async createEventScheduleItem(client, eventId, scheduleData, userId) {
        const scheduleQuery = `
            INSERT INTO event_schedule (
                id, event_id, session_name, session_type, description,
                start_time, end_time, venue_location, speaker_id,
                capacity, registration_required, materials_needed,
                created_by, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            )
        `;

        await client.query(scheduleQuery, [
            uuidv4(), eventId, scheduleData.session_name, scheduleData.session_type,
            scheduleData.description, scheduleData.start_time, scheduleData.end_time,
            scheduleData.venue_location, scheduleData.speaker_id, scheduleData.capacity,
            scheduleData.registration_required || false,
            JSON.stringify(scheduleData.materials_needed || []),
            userId, new Date()
        ]);
    }

    /**
     * Allocate Event Resources
     */
    async allocateEventResources(client, eventId, resourceRequirements, userId) {
        for (const resource of resourceRequirements) {
            const resourceQuery = `
                INSERT INTO event_resource_allocations (
                    id, event_id, resource_type, resource_name, quantity_required,
                    quantity_allocated, cost_per_unit, total_cost, supplier_id,
                    allocation_date, status, notes, created_by, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                )
            `;

            await client.query(resourceQuery, [
                uuidv4(), eventId, resource.resource_type, resource.resource_name,
                resource.quantity_required, resource.quantity_allocated || 0,
                resource.cost_per_unit || 0, resource.total_cost || 0,
                resource.supplier_id, resource.allocation_date || new Date(),
                'requested', resource.notes, userId, new Date()
            ]);
        }
    }

    /**
     * Create Event Budget Breakdown
     */
    async createEventBudgetBreakdown(client, eventId, budgetBreakdown, userId) {
        for (const budgetItem of budgetBreakdown) {
            const budgetQuery = `
                INSERT INTO event_budget_breakdown (
                    id, event_id, category, subcategory, allocated_amount,
                    spent_amount, description, approval_required,
                    created_by, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `;

            await client.query(budgetQuery, [
                uuidv4(), eventId, budgetItem.category, budgetItem.subcategory,
                budgetItem.allocated_amount, 0, budgetItem.description,
                budgetItem.approval_required || false, userId, new Date()
            ]);
        }
    }

    /**
     * Register Event Attendee
     */
    async registerAttendee(registrationData, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate registration data
            const validationResult = await this.validateRegistrationData(registrationData);
            if (!validationResult.isValid) {
                throw new Error(`Registration validation failed: ${validationResult.errors.join(', ')}`);
            }

            // Check event capacity
            const capacityCheck = await this.checkEventCapacity(registrationData.event_id);
            if (!capacityCheck.available) {
                throw new Error('Event is at full capacity');
            }

            // Check for duplicate registration
            const duplicateCheck = await client.query(
                'SELECT id FROM event_attendees WHERE event_id = $1 AND email = $2',
                [registrationData.event_id, registrationData.email]
            );

            if (duplicateCheck.rows.length > 0) {
                throw new Error('Attendee already registered for this event');
            }

            // Create attendee record
            const attendeeId = uuidv4();
            const registrationNumber = await this.generateRegistrationNumber(registrationData.event_id);

            const attendeeQuery = `
                INSERT INTO event_attendees (
                    id, event_id, registration_number, first_name, last_name,
                    email, phone, company, designation, registration_type,
                    registration_date, status, dietary_requirements,
                    special_needs, session_preferences, created_by, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17
                ) RETURNING id, registration_number
            `;

            const attendeeResult = await client.query(attendeeQuery, [
                attendeeId, registrationData.event_id, registrationNumber,
                registrationData.first_name, registrationData.last_name,
                registrationData.email, registrationData.phone,
                registrationData.company, registrationData.designation,
                registrationData.registration_type || 'standard',
                new Date(), 'registered',
                registrationData.dietary_requirements,
                registrationData.special_needs,
                JSON.stringify(registrationData.session_preferences || []),
                userId, new Date()
            ]);

            // Send confirmation email (implement email service)
            await this.sendRegistrationConfirmation(attendeeId);

            await client.query('COMMIT');

            this.logger.info('Event attendee registered', {
                attendeeId,
                eventId: registrationData.event_id,
                registrationNumber,
                email: registrationData.email
            });

            return {
                success: true,
                attendee_id: attendeeId,
                registration_number: registrationNumber,
                message: 'Registration successful'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Attendee registration failed', {
                error: error.message,
                registrationData,
                userId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Track Event Expenses
     */
    async trackEventExpense(expenseData, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate expense data
            const validationResult = await this.validateExpenseData(expenseData);
            if (!validationResult.isValid) {
                throw new Error(`Expense validation failed: ${validationResult.errors.join(', ')}`);
            }

            // Check budget availability
            const budgetCheck = await this.checkEventBudgetAvailability(
                expenseData.event_id,
                expenseData.category,
                expenseData.amount
            );

            if (!budgetCheck.available) {
                throw new Error(`Insufficient budget. Available: ${budgetCheck.available_amount}, Required: ${expenseData.amount}`);
            }

            // Create expense record
            const expenseId = uuidv4();
            const expenseQuery = `
                INSERT INTO event_expenses (
                    id, event_id, category, subcategory, amount, currency,
                    expense_date, vendor_name, invoice_number, description,
                    receipt_url, approval_status, approved_by, approved_at,
                    created_by, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16
                ) RETURNING id
            `;

            await client.query(expenseQuery, [
                expenseId, expenseData.event_id, expenseData.category,
                expenseData.subcategory, expenseData.amount,
                expenseData.currency || 'INR', expenseData.expense_date || new Date(),
                expenseData.vendor_name, expenseData.invoice_number,
                expenseData.description, expenseData.receipt_url,
                expenseData.approval_required ? 'pending' : 'approved',
                expenseData.approval_required ? null : userId,
                expenseData.approval_required ? null : new Date(),
                userId, new Date()
            ]);

            // Update budget breakdown
            const updateBudgetQuery = `
                UPDATE event_budget_breakdown 
                SET spent_amount = spent_amount + $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE event_id = $2 AND category = $3
            `;
            await client.query(updateBudgetQuery, [
                expenseData.amount, expenseData.event_id, expenseData.category
            ]);

            // Update event total spent
            const updateEventQuery = `
                UPDATE events 
                SET budget_spent = budget_spent + $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `;
            await client.query(updateEventQuery, [expenseData.amount, expenseData.event_id]);

            await client.query('COMMIT');

            this.logger.info('Event expense tracked', {
                expenseId,
                eventId: expenseData.event_id,
                amount: expenseData.amount,
                category: expenseData.category
            });

            return {
                success: true,
                expense_id: expenseId,
                remaining_budget: budgetCheck.available_amount - expenseData.amount,
                message: 'Expense tracked successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Event expense tracking failed', {
                error: error.message,
                expenseData,
                userId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Calculate Event ROI
     */
    async calculateEventROI(eventId) {
        const client = await this.db.connect();
        
        try {
            // Get event expenses
            const expenseQuery = `
                SELECT SUM(amount) as total_expenses
                FROM event_expenses
                WHERE event_id = $1 AND approval_status = 'approved'
            `;
            const expenseResult = await client.query(expenseQuery, [eventId]);
            const totalExpenses = parseFloat(expenseResult.rows[0].total_expenses) || 0;

            // Get event-attributed revenue
            const revenueQuery = `
                SELECT SUM(o.total_amount) as total_revenue
                FROM orders o
                JOIN event_lead_attribution ela ON o.customer_id = ela.customer_id
                WHERE ela.event_id = $1
                AND o.order_date >= ela.attribution_date
                AND o.order_date <= ela.attribution_date + INTERVAL '90 days'
            `;
            const revenueResult = await client.query(revenueQuery, [eventId]);
            const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue) || 0;

            // Get attendee metrics
            const attendeeQuery = `
                SELECT 
                    COUNT(*) as total_registered,
                    COUNT(CASE WHEN attendance_status = 'attended' THEN 1 END) as total_attended,
                    COUNT(CASE WHEN lead_generated = true THEN 1 END) as leads_generated
                FROM event_attendees
                WHERE event_id = $1
            `;
            const attendeeResult = await client.query(attendeeQuery, [eventId]);
            const attendeeMetrics = attendeeResult.rows[0];

            // Calculate metrics
            const roi = totalExpenses > 0 ? ((totalRevenue - totalExpenses) / totalExpenses) * 100 : 0;
            const costPerAttendee = attendeeMetrics.total_attended > 0 ? 
                totalExpenses / attendeeMetrics.total_attended : 0;
            const costPerLead = attendeeMetrics.leads_generated > 0 ? 
                totalExpenses / attendeeMetrics.leads_generated : 0;
            const attendanceRate = attendeeMetrics.total_registered > 0 ? 
                (attendeeMetrics.total_attended / attendeeMetrics.total_registered) * 100 : 0;

            const roiData = {
                event_id: eventId,
                total_expenses: totalExpenses,
                total_revenue: totalRevenue,
                roi_percentage: Math.round(roi * 100) / 100,
                total_registered: parseInt(attendeeMetrics.total_registered),
                total_attended: parseInt(attendeeMetrics.total_attended),
                leads_generated: parseInt(attendeeMetrics.leads_generated),
                attendance_rate: Math.round(attendanceRate * 100) / 100,
                cost_per_attendee: Math.round(costPerAttendee * 100) / 100,
                cost_per_lead: Math.round(costPerLead * 100) / 100,
                calculated_at: new Date()
            };

            // Cache ROI data
            await this.redis.setex(`event_roi:${eventId}`, 3600, JSON.stringify(roiData));

            return roiData;

        } finally {
            client.release();
        }
    }

    /**
     * Get Event Dashboard
     */
    async getEventDashboard(eventId) {
        const client = await this.db.connect();
        
        try {
            // Get event details
            const eventQuery = `
                SELECT e.*, v.venue_name, v.address as venue_address,
                       u.first_name || ' ' || u.last_name as manager_name
                FROM events e
                LEFT JOIN venues v ON e.venue_id = v.id
                LEFT JOIN users u ON e.event_manager_id = u.id
                WHERE e.id = $1
            `;
            const eventResult = await client.query(eventQuery, [eventId]);
            
            if (eventResult.rows.length === 0) {
                throw new Error('Event not found');
            }

            const event = eventResult.rows[0];

            // Get registration statistics
            const registrationQuery = `
                SELECT 
                    COUNT(*) as total_registered,
                    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
                    COUNT(CASE WHEN attendance_status = 'attended' THEN 1 END) as attended
                FROM event_attendees
                WHERE event_id = $1
            `;
            const registrationResult = await client.query(registrationQuery, [eventId]);

            // Get budget utilization
            const budgetQuery = `
                SELECT 
                    category,
                    allocated_amount,
                    spent_amount,
                    (spent_amount / NULLIF(allocated_amount, 0)) * 100 as utilization_percent
                FROM event_budget_breakdown
                WHERE event_id = $1
                ORDER BY allocated_amount DESC
            `;
            const budgetResult = await client.query(budgetQuery, [eventId]);

            // Get recent expenses
            const expenseQuery = `
                SELECT 
                    category,
                    amount,
                    expense_date,
                    vendor_name,
                    description
                FROM event_expenses
                WHERE event_id = $1
                ORDER BY expense_date DESC
                LIMIT 10
            `;
            const expenseResult = await client.query(expenseQuery, [eventId]);

            // Get resource allocation status
            const resourceQuery = `
                SELECT 
                    resource_type,
                    COUNT(*) as total_resources,
                    SUM(quantity_required) as total_required,
                    SUM(quantity_allocated) as total_allocated,
                    SUM(total_cost) as total_cost
                FROM event_resource_allocations
                WHERE event_id = $1
                GROUP BY resource_type
            `;
            const resourceResult = await client.query(resourceQuery, [eventId]);

            // Calculate ROI
            const roiData = await this.calculateEventROI(eventId);

            const dashboard = {
                event: event,
                registration_stats: registrationResult.rows[0],
                budget_utilization: budgetResult.rows,
                recent_expenses: expenseResult.rows,
                resource_allocation: resourceResult.rows,
                roi_metrics: roiData,
                performance_summary: {
                    budget_utilization_percent: event.budget_allocated > 0 ? 
                        (event.budget_spent / event.budget_allocated) * 100 : 0,
                    days_until_event: Math.ceil((new Date(event.start_date) - new Date()) / (1000 * 60 * 60 * 24)),
                    registration_rate: event.expected_attendees > 0 ? 
                        (registrationResult.rows[0].total_registered / event.expected_attendees) * 100 : 0
                }
            };

            return dashboard;

        } finally {
            client.release();
        }
    }

    /**
     * Check Event Capacity
     */
    async checkEventCapacity(eventId) {
        const client = await this.db.connect();
        
        try {
            const capacityQuery = `
                SELECT 
                    e.expected_attendees as capacity,
                    COUNT(ea.id) as current_registrations
                FROM events e
                LEFT JOIN event_attendees ea ON e.id = ea.event_id 
                    AND ea.status IN ('registered', 'confirmed')
                WHERE e.id = $1
                GROUP BY e.expected_attendees
            `;
            const capacityResult = await client.query(capacityQuery, [eventId]);
            
            if (capacityResult.rows.length === 0) {
                return { available: false, message: 'Event not found' };
            }

            const capacity = capacityResult.rows[0];
            const available = capacity.current_registrations < capacity.capacity;
            
            return {
                available,
                capacity: parseInt(capacity.capacity),
                current_registrations: parseInt(capacity.current_registrations),
                available_spots: capacity.capacity - capacity.current_registrations
            };

        } finally {
            client.release();
        }
    }

    /**
     * Check Event Budget Availability
     */
    async checkEventBudgetAvailability(eventId, category, amount) {
        const client = await this.db.connect();
        
        try {
            const budgetQuery = `
                SELECT 
                    allocated_amount,
                    spent_amount,
                    (allocated_amount - spent_amount) as available_amount
                FROM event_budget_breakdown
                WHERE event_id = $1 AND category = $2
            `;
            const budgetResult = await client.query(budgetQuery, [eventId, category]);
            
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
     * Generate Event Code
     */
    async generateEventCode(eventType) {
        const typePrefix = {
            'trade_show': 'TS',
            'product_launch': 'PL',
            'customer_conference': 'CC',
            'dealer_meet': 'DM',
            'roadshow': 'RS'
        };

        const prefix = typePrefix[eventType] || 'EV';
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        // Get sequence number for this type and month
        const sequenceKey = `event_seq:${eventType}:${year}${month}`;
        const sequence = await this.redis.incr(sequenceKey);
        await this.redis.expire(sequenceKey, 86400 * 31); // Expire after 31 days
        
        return `${prefix}${year}${month}${sequence.toString().padStart(3, '0')}`;
    }

    /**
     * Generate Registration Number
     */
    async generateRegistrationNumber(eventId) {
        const sequenceKey = `event_reg_seq:${eventId}`;
        const sequence = await this.redis.incr(sequenceKey);
        await this.redis.expire(sequenceKey, 86400 * 365); // Expire after 1 year
        
        return `REG${sequence.toString().padStart(6, '0')}`;
    }

    /**
     * Initialize Event Workflow
     */
    async initializeEventWorkflow(client, eventId, eventType) {
        const workflowStages = ['planning', 'preparation', 'execution', 'post_event', 'analysis'];
        
        // Create initial workflow state
        const workflowQuery = `
            INSERT INTO event_workflow_states (
                id, event_id, workflow_stage, stage_status,
                entered_at, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await client.query(workflowQuery, [
            uuidv4(), eventId, workflowStages[0], 'in_progress',
            new Date(), new Date()
        ]);
    }

    /**
     * Send Registration Confirmation
     */
    async sendRegistrationConfirmation(attendeeId) {
        // Implement email service integration
        this.logger.info('Registration confirmation sent', { attendeeId });
    }

    /**
     * Cache Event Data
     */
    async cacheEvent(eventId) {
        const event = await this.getEventDetails(eventId);
        await this.redis.setex(`event:${eventId}`, 300, JSON.stringify(event));
    }

    /**
     * Get Event Details
     */
    async getEventDetails(eventId) {
        const client = await this.db.connect();
        
        try {
            const eventQuery = `
                SELECT e.*, v.venue_name, v.address as venue_address,
                       u.first_name || ' ' || u.last_name as manager_name
                FROM events e
                LEFT JOIN venues v ON e.venue_id = v.id
                LEFT JOIN users u ON e.event_manager_id = u.id
                WHERE e.id = $1
            `;
            const eventResult = await client.query(eventQuery, [eventId]);
            
            if (eventResult.rows.length === 0) {
                throw new Error('Event not found');
            }

            return eventResult.rows[0];

        } finally {
            client.release();
        }
    }

    /**
     * Validate Event Data
     */
    async validateEventData(eventData) {
        const schema = Joi.object({
            event_name: Joi.string().min(3).max(255).required(),
            event_type: Joi.string().valid('trade_show', 'product_launch', 'customer_conference', 'dealer_meet', 'roadshow').required(),
            description: Joi.string().max(1000).optional(),
            start_date: Joi.date().required(),
            end_date: Joi.date().greater(Joi.ref('start_date')).required(),
            budget_allocated: Joi.number().min(0).required(),
            expected_attendees: Joi.number().integer().min(1).required(),
            venue_id: Joi.string().uuid().optional(),
            event_manager_id: Joi.string().uuid().required(),
            objectives: Joi.array().items(Joi.string()).optional(),
            success_metrics: Joi.array().items(Joi.object()).optional(),
            campaign_id: Joi.string().uuid().optional(),
            schedule: Joi.array().items(Joi.object()).optional(),
            resource_requirements: Joi.array().items(Joi.object()).optional(),
            budget_breakdown: Joi.array().items(Joi.object()).optional()
        });

        const { error, value } = schema.validate(eventData);
        
        return {
            isValid: !error,
            errors: error ? error.details.map(detail => detail.message) : [],
            data: value
        };
    }

    /**
     * Validate Registration Data
     */
    async validateRegistrationData(registrationData) {
        const schema = Joi.object({
            event_id: Joi.string().uuid().required(),
            first_name: Joi.string().min(2).max(100).required(),
            last_name: Joi.string().min(2).max(100).required(),
            email: Joi.string().email().required(),
            phone: Joi.string().min(10).max(20).required(),
            company: Joi.string().max(255).optional(),
            designation: Joi.string().max(100).optional(),
            registration_type: Joi.string().valid('standard', 'vip', 'speaker', 'sponsor').optional(),
            dietary_requirements: Joi.string().max(500).optional(),
            special_needs: Joi.string().max(500).optional(),
            session_preferences: Joi.array().items(Joi.string().uuid()).optional()
        });

        const { error, value } = schema.validate(registrationData);
        
        return {
            isValid: !error,
            errors: error ? error.details.map(detail => detail.message) : [],
            data: value
        };
    }

    /**
     * Validate Expense Data
     */
    async validateExpenseData(expenseData) {
        const schema = Joi.object({
            event_id: Joi.string().uuid().required(),
            category: Joi.string().required(),
            subcategory: Joi.string().optional(),
            amount: Joi.number().min(0.01).required(),
            currency: Joi.string().length(3).optional(),
            expense_date: Joi.date().optional(),
            vendor_name: Joi.string().max(255).required(),
            invoice_number: Joi.string().max(100).optional(),
            description: Joi.string().max(500).required(),
            receipt_url: Joi.string().uri().optional(),
            approval_required: Joi.boolean().optional()
        });

        const { error, value } = schema.validate(expenseData);
        
        return {
            isValid: !error,
            errors: error ? error.details.map(detail => detail.message) : [],
            data: value
        };
    }
}

module.exports = EventManagementService;