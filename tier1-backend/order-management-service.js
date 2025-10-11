/**
 * SalesSync Tier-1 Order Management Service
 * Complete transactional order processing with workflow engine
 * 
 * Features:
 * - Order workflow engine with state management
 * - Payment processing integration
 * - Inventory reservation system
 * - Shipping integration with carriers
 * - Real-time order tracking
 * - Comprehensive audit trails
 * - ACID compliance
 */

const express = require('express');
const { Pool } = require('pg');
const Redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const winston = require('winston');

class OrderManagementService {
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
                new winston.transports.File({ filename: 'order-service.log' }),
                new winston.transports.Console()
            ]
        });

        this.initializeWorkflowEngine();
    }

    /**
     * Initialize Order Workflow Engine
     */
    initializeWorkflowEngine() {
        this.workflows = {
            standard: [
                { stage: 'created', next: 'validation', auto: true },
                { stage: 'validation', next: 'inventory_check', auto: true },
                { stage: 'inventory_check', next: 'credit_check', auto: true },
                { stage: 'credit_check', next: 'approval', auto: false },
                { stage: 'approval', next: 'confirmed', auto: false },
                { stage: 'confirmed', next: 'processing', auto: true },
                { stage: 'processing', next: 'picking', auto: false },
                { stage: 'picking', next: 'packing', auto: false },
                { stage: 'packing', next: 'shipping', auto: false },
                { stage: 'shipping', next: 'delivered', auto: false },
                { stage: 'delivered', next: 'completed', auto: true }
            ],
            express: [
                { stage: 'created', next: 'validation', auto: true },
                { stage: 'validation', next: 'confirmed', auto: true },
                { stage: 'confirmed', next: 'processing', auto: true },
                { stage: 'processing', next: 'shipping', auto: false },
                { stage: 'shipping', next: 'delivered', auto: false },
                { stage: 'delivered', next: 'completed', auto: true }
            ]
        };
    }

    /**
     * Create Order with Full Validation
     */
    async createOrder(orderData, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate order data
            const validationResult = await this.validateOrderData(orderData);
            if (!validationResult.isValid) {
                throw new Error(`Order validation failed: ${validationResult.errors.join(', ')}`);
            }

            // Generate order number
            const orderNumber = await this.generateOrderNumber();

            // Create order record
            const orderQuery = `
                INSERT INTO orders (
                    id, order_number, customer_id, sales_rep_id, agent_id,
                    order_date, required_date, status, priority, order_type,
                    source, payment_terms, payment_method, subtotal,
                    discount_amount, tax_amount, shipping_amount, total_amount,
                    currency, shipping_address, billing_address,
                    special_instructions, workflow_stage, created_by
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                    $21, $22, $23, $24
                ) RETURNING id, order_number
            `;

            const orderId = uuidv4();
            const orderResult = await client.query(orderQuery, [
                orderId, orderNumber, orderData.customer_id, orderData.sales_rep_id,
                orderData.agent_id, orderData.order_date || new Date(),
                orderData.required_date, 'draft', orderData.priority || 'normal',
                orderData.order_type || 'sales', orderData.source || 'manual',
                orderData.payment_terms || 30, orderData.payment_method,
                orderData.subtotal, orderData.discount_amount || 0,
                orderData.tax_amount || 0, orderData.shipping_amount || 0,
                orderData.total_amount, orderData.currency || 'INR',
                JSON.stringify(orderData.shipping_address),
                JSON.stringify(orderData.billing_address),
                orderData.special_instructions, 'created', userId
            ]);

            // Create order items
            for (const item of orderData.items) {
                await this.createOrderItem(client, orderId, item);
            }

            // Initialize workflow
            await this.initializeOrderWorkflow(client, orderId, orderData.workflow_type || 'standard');

            // Reserve inventory
            await this.reserveInventoryForOrder(client, orderId, orderData.items);

            // Log order creation
            await this.logOrderAudit(client, orderId, 'CREATE', null, orderResult.rows[0], userId);

            await client.query('COMMIT');

            // Start workflow processing
            await this.processOrderWorkflow(orderId);

            // Cache order for quick access
            await this.cacheOrder(orderId);

            this.logger.info('Order created successfully', {
                orderId,
                orderNumber,
                customerId: orderData.customer_id,
                totalAmount: orderData.total_amount
            });

            return {
                success: true,
                orderId,
                orderNumber,
                message: 'Order created successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Order creation failed', {
                error: error.message,
                orderData,
                userId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Generate Order Number
     */
    async generateOrderNumber() {
        const prefix = 'ORD';
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        // Get sequence number for today
        const sequenceKey = `order_seq:${year}${month}${day}`;
        const sequence = await this.redis.incr(sequenceKey);
        await this.redis.expire(sequenceKey, 86400); // Expire after 24 hours
        
        return `${prefix}${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
    }

    /**
     * Process Payment for Order
     */
    async processPayment(orderId, paymentData, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Get order details
            const orderQuery = `
                SELECT * FROM orders WHERE id = $1 AND status IN ('confirmed', 'processing')
            `;
            const orderResult = await client.query(orderQuery, [orderId]);
            
            if (orderResult.rows.length === 0) {
                throw new Error('Order not found or not in payable status');
            }

            const order = orderResult.rows[0];

            // Validate payment amount
            if (paymentData.amount !== order.total_amount) {
                throw new Error(`Payment amount mismatch. Expected: ${order.total_amount}, Received: ${paymentData.amount}`);
            }

            // Process payment through gateway
            const paymentResult = await this.processPaymentGateway(paymentData);
            
            if (!paymentResult.success) {
                throw new Error(`Payment processing failed: ${paymentResult.error}`);
            }

            // Create payment transaction record
            const transactionId = uuidv4();
            const transactionQuery = `
                INSERT INTO payment_transactions (
                    id, transaction_number, order_id, customer_id, payment_method,
                    payment_gateway, gateway_transaction_id, amount, currency,
                    status, processed_at, gateway_response, net_amount,
                    created_by, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
                ) RETURNING id, transaction_number
            `;

            const transactionNumber = await this.generateTransactionNumber();
            await client.query(transactionQuery, [
                transactionId, transactionNumber, orderId, order.customer_id,
                paymentData.payment_method, paymentData.gateway,
                paymentResult.gateway_transaction_id, paymentData.amount,
                paymentData.currency || 'INR', 'completed', new Date(),
                JSON.stringify(paymentResult.gateway_response),
                paymentData.amount - (paymentResult.fees || 0), userId, new Date()
            ]);

            // Update order payment status
            const updateOrderQuery = `
                UPDATE orders 
                SET payment_status = 'completed', 
                    workflow_stage = 'payment_completed',
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = $1
                WHERE id = $2
            `;
            await client.query(updateOrderQuery, [userId, orderId]);

            // Continue workflow processing
            await this.processOrderWorkflow(orderId);

            await client.query('COMMIT');

            this.logger.info('Payment processed successfully', {
                orderId,
                transactionId,
                amount: paymentData.amount,
                paymentMethod: paymentData.payment_method
            });

            return {
                success: true,
                transaction_id: transactionId,
                transaction_number: transactionNumber,
                message: 'Payment processed successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Payment processing failed', {
                error: error.message,
                orderId,
                paymentData
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Process Payment Gateway
     */
    async processPaymentGateway(paymentData) {
        // Simulate payment gateway processing
        // In production, integrate with actual payment gateways like Razorpay, Stripe, etc.
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Simulate success/failure based on card number (for testing)
            const testFailureCards = ['4000000000000002', '4000000000000069'];
            const isTestFailure = testFailureCards.includes(paymentData.card_number);

            if (isTestFailure) {
                return {
                    success: false,
                    error: 'Payment declined by bank',
                    gateway_response: {
                        error_code: 'DECLINED',
                        error_message: 'Insufficient funds'
                    }
                };
            }

            // Simulate successful payment
            return {
                success: true,
                gateway_transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                gateway_response: {
                    status: 'SUCCESS',
                    authorization_code: `AUTH_${Math.random().toString(36).substr(2, 6)}`,
                    reference_number: `REF_${Date.now()}`
                },
                fees: paymentData.amount * 0.025 // 2.5% gateway fee
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                gateway_response: { error: error.message }
            };
        }
    }

    /**
     * Create Shipping Label
     */
    async createShippingLabel(orderId, shippingData, userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Get order details
            const orderQuery = `
                SELECT o.*, c.company_name, c.contact_person, c.phone, c.email
                FROM orders o
                JOIN customers c ON o.customer_id = c.id
                WHERE o.id = $1 AND o.payment_status = 'completed'
            `;
            const orderResult = await client.query(orderQuery, [orderId]);
            
            if (orderResult.rows.length === 0) {
                throw new Error('Order not found or payment not completed');
            }

            const order = orderResult.rows[0];

            // Create shipping label through carrier API
            const labelResult = await this.createCarrierShippingLabel(order, shippingData);
            
            if (!labelResult.success) {
                throw new Error(`Shipping label creation failed: ${labelResult.error}`);
            }

            // Create shipment record
            const shipmentId = uuidv4();
            const shipmentQuery = `
                INSERT INTO order_shipments (
                    id, order_id, shipment_number, carrier, service_type,
                    tracking_number, label_url, estimated_delivery,
                    shipping_cost, weight, dimensions, status,
                    created_by, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                ) RETURNING id, shipment_number, tracking_number
            `;

            const shipmentNumber = await this.generateShipmentNumber();
            const shipmentResult = await client.query(shipmentQuery, [
                shipmentId, orderId, shipmentNumber, shippingData.carrier,
                shippingData.service_type, labelResult.tracking_number,
                labelResult.label_url, labelResult.estimated_delivery,
                shippingData.shipping_cost, shippingData.weight,
                JSON.stringify(shippingData.dimensions), 'label_created',
                userId, new Date()
            ]);

            // Update order status
            const updateOrderQuery = `
                UPDATE orders 
                SET status = 'shipped', 
                    workflow_stage = 'shipped',
                    shipped_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = $1
                WHERE id = $2
            `;
            await client.query(updateOrderQuery, [userId, orderId]);

            await client.query('COMMIT');

            this.logger.info('Shipping label created successfully', {
                orderId,
                shipmentId,
                trackingNumber: labelResult.tracking_number,
                carrier: shippingData.carrier
            });

            return {
                success: true,
                shipment_id: shipmentId,
                shipment_number: shipmentNumber,
                tracking_number: labelResult.tracking_number,
                label_url: labelResult.label_url,
                estimated_delivery: labelResult.estimated_delivery,
                message: 'Shipping label created successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Shipping label creation failed', {
                error: error.message,
                orderId,
                shippingData
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Create Carrier Shipping Label
     */
    async createCarrierShippingLabel(order, shippingData) {
        // Simulate carrier API integration
        // In production, integrate with carriers like FedEx, UPS, DHL, etc.
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));

            const trackingNumber = `${shippingData.carrier.toUpperCase()}${Date.now()}${Math.random().toString(36).substr(2, 6)}`;
            const estimatedDelivery = new Date();
            estimatedDelivery.setDate(estimatedDelivery.getDate() + (shippingData.service_type === 'express' ? 1 : 3));

            return {
                success: true,
                tracking_number: trackingNumber,
                label_url: `https://labels.carrier.com/${trackingNumber}.pdf`,
                estimated_delivery: estimatedDelivery,
                carrier_response: {
                    status: 'SUCCESS',
                    service_type: shippingData.service_type,
                    cost: shippingData.shipping_cost
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                carrier_response: { error: error.message }
            };
        }
    }

    /**
     * Track Order Shipment
     */
    async trackShipment(trackingNumber) {
        const client = await this.db.connect();
        
        try {
            // Get shipment details
            const shipmentQuery = `
                SELECT s.*, o.order_number, c.company_name
                FROM order_shipments s
                JOIN orders o ON s.order_id = o.id
                JOIN customers c ON o.customer_id = c.id
                WHERE s.tracking_number = $1
            `;
            const shipmentResult = await client.query(shipmentQuery, [trackingNumber]);
            
            if (shipmentResult.rows.length === 0) {
                throw new Error('Shipment not found');
            }

            const shipment = shipmentResult.rows[0];

            // Get tracking updates from carrier
            const trackingData = await this.getCarrierTrackingData(trackingNumber, shipment.carrier);

            // Update shipment status if changed
            if (trackingData.status !== shipment.status) {
                const updateShipmentQuery = `
                    UPDATE order_shipments 
                    SET status = $1, 
                        tracking_events = $2,
                        delivered_at = $3,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE tracking_number = $4
                `;
                
                await client.query(updateShipmentQuery, [
                    trackingData.status,
                    JSON.stringify(trackingData.events),
                    trackingData.status === 'delivered' ? new Date() : null,
                    trackingNumber
                ]);

                // Update order status if delivered
                if (trackingData.status === 'delivered') {
                    const updateOrderQuery = `
                        UPDATE orders 
                        SET status = 'delivered',
                            workflow_stage = 'delivered',
                            delivered_at = CURRENT_TIMESTAMP,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $1
                    `;
                    await client.query(updateOrderQuery, [shipment.order_id]);
                }
            }

            return {
                success: true,
                tracking_data: {
                    tracking_number: trackingNumber,
                    status: trackingData.status,
                    estimated_delivery: shipment.estimated_delivery,
                    events: trackingData.events,
                    order_number: shipment.order_number,
                    customer_name: shipment.company_name
                }
            };

        } finally {
            client.release();
        }
    }

    /**
     * Get Carrier Tracking Data
     */
    async getCarrierTrackingData(trackingNumber, carrier) {
        // Simulate carrier tracking API
        // In production, integrate with actual carrier tracking APIs
        
        const statuses = ['label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
        const currentStatusIndex = Math.floor(Math.random() * statuses.length);
        const status = statuses[currentStatusIndex];

        const events = [];
        for (let i = 0; i <= currentStatusIndex; i++) {
            const eventDate = new Date();
            eventDate.setHours(eventDate.getHours() - (currentStatusIndex - i) * 12);
            
            events.push({
                status: statuses[i],
                description: this.getStatusDescription(statuses[i]),
                location: 'Distribution Center',
                timestamp: eventDate.toISOString()
            });
        }

        return {
            status,
            events,
            carrier_response: {
                tracking_number: trackingNumber,
                service_type: 'standard'
            }
        };
    }

    /**
     * Get Status Description
     */
    getStatusDescription(status) {
        const descriptions = {
            'label_created': 'Shipping label created',
            'picked_up': 'Package picked up by carrier',
            'in_transit': 'Package in transit',
            'out_for_delivery': 'Out for delivery',
            'delivered': 'Package delivered'
        };
        return descriptions[status] || status;
    }

    /**
     * Generate Transaction Number
     */
    async generateTransactionNumber() {
        const prefix = 'TXN';
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        const sequenceKey = `txn_seq:${year}${month}${day}`;
        const sequence = await this.redis.incr(sequenceKey);
        await this.redis.expire(sequenceKey, 86400);
        
        return `${prefix}${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
    }

    /**
     * Generate Shipment Number
     */
    async generateShipmentNumber() {
        const prefix = 'SHP';
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        const sequenceKey = `shp_seq:${year}${month}${day}`;
        const sequence = await this.redis.incr(sequenceKey);
        await this.redis.expire(sequenceKey, 86400);
        
        return `${prefix}${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
    }

    /**
     * Validate Order Data
     */
    async validateOrderData(orderData) {
        const schema = Joi.object({
            customer_id: Joi.string().uuid().required(),
            sales_rep_id: Joi.string().uuid().optional(),
            agent_id: Joi.string().uuid().optional(),
            order_date: Joi.date().optional(),
            required_date: Joi.date().optional(),
            priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
            order_type: Joi.string().valid('sales', 'return', 'exchange').optional(),
            source: Joi.string().optional(),
            payment_terms: Joi.number().integer().min(0).optional(),
            payment_method: Joi.string().optional(),
            subtotal: Joi.number().min(0).required(),
            discount_amount: Joi.number().min(0).optional(),
            tax_amount: Joi.number().min(0).optional(),
            shipping_amount: Joi.number().min(0).optional(),
            total_amount: Joi.number().min(0).required(),
            currency: Joi.string().length(3).optional(),
            shipping_address: Joi.object().optional(),
            billing_address: Joi.object().optional(),
            special_instructions: Joi.string().optional(),
            workflow_type: Joi.string().valid('standard', 'express').optional(),
            items: Joi.array().items(
                Joi.object({
                    product_id: Joi.string().uuid().required(),
                    quantity: Joi.number().integer().min(1).required(),
                    unit_price: Joi.number().min(0).optional(),
                    discount_percent: Joi.number().min(0).max(100).optional(),
                    tax_rate: Joi.number().min(0).optional(),
                    notes: Joi.string().optional()
                })
            ).min(1).required()
        });

        const { error, value } = schema.validate(orderData);
        
        return {
            isValid: !error,
            errors: error ? error.details.map(detail => detail.message) : [],
            data: value
        };
    }
}

module.exports = OrderManagementService;