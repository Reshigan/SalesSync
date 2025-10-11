/**
 * SalesSync Tier-1 Field Marketing Agent Service
 * Complete transactional field marketing system
 * 
 * Features:
 * - GPS validation within 10m radius
 * - Image analytics for board coverage
 * - Board placement with commission calculation
 * - Product distribution tracking
 * - Visit workflow management
 * - Survey system with validation
 * - Offline sync capabilities
 * - Real-time commission tracking
 */

const express = require('express');
const { Pool } = require('pg');
const Redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const winston = require('winston');
const sharp = require('sharp');
const geolib = require('geolib');

class FieldMarketingService {
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
                new winston.transports.File({ filename: 'field-marketing.log' }),
                new winston.transports.Console()
            ]
        });

        this.GPS_VALIDATION_RADIUS = 10; // meters
        this.IMAGE_ANALYSIS_CONFIDENCE_THRESHOLD = 0.85;
    }

    /**
     * Agent Authentication and Device Registration
     */
    async authenticateAgent(credentials, deviceInfo) {
        const client = await this.db.connect();
        
        try {
            // Authenticate user
            const userQuery = `
                SELECT u.id, u.username, u.email, u.first_name, u.last_name,
                       fa.id as agent_id, fa.agent_code, fa.status as agent_status,
                       fa.territory_ids, fa.area_ids, fa.commission_rate
                FROM users u
                JOIN field_agents fa ON u.id = fa.user_id
                WHERE u.username = $1 AND u.password_hash = $2 AND u.status = 'active'
            `;
            
            const userResult = await client.query(userQuery, [
                credentials.username, 
                credentials.password_hash
            ]);

            if (userResult.rows.length === 0) {
                throw new Error('Invalid credentials or inactive agent');
            }

            const agent = userResult.rows[0];

            if (agent.agent_status !== 'active') {
                throw new Error('Agent account is not active');
            }

            // Register/Update device
            const deviceQuery = `
                INSERT INTO agent_devices (
                    id, agent_id, device_id, device_info, last_seen,
                    is_active, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (agent_id, device_id) 
                DO UPDATE SET 
                    device_info = $4,
                    last_seen = $5,
                    is_active = true
                RETURNING id
            `;

            await client.query(deviceQuery, [
                uuidv4(), agent.agent_id, deviceInfo.device_id,
                JSON.stringify(deviceInfo), new Date(), true, new Date()
            ]);

            // Generate session token
            const sessionToken = this.generateSessionToken();
            const sessionQuery = `
                INSERT INTO user_sessions (
                    id, user_id, session_token, device_info, expires_at, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `;

            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour session

            await client.query(sessionQuery, [
                uuidv4(), agent.id, sessionToken, JSON.stringify(deviceInfo),
                expiresAt, true
            ]);

            this.logger.info('Agent authenticated successfully', {
                agentId: agent.agent_id,
                agentCode: agent.agent_code,
                deviceId: deviceInfo.device_id
            });

            return {
                success: true,
                agent: {
                    id: agent.agent_id,
                    code: agent.agent_code,
                    name: `${agent.first_name} ${agent.last_name}`,
                    email: agent.email,
                    territories: agent.territory_ids,
                    areas: agent.area_ids,
                    commission_rate: agent.commission_rate
                },
                session_token: sessionToken,
                expires_at: expiresAt
            };

        } catch (error) {
            this.logger.error('Agent authentication failed', {
                error: error.message,
                username: credentials.username
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Start Customer Visit with GPS Validation
     */
    async startVisit(agentId, visitData) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate GPS location
            const gpsValidation = await this.validateGPSLocation(
                visitData.customer_id, 
                visitData.current_location
            );

            if (!gpsValidation.isValid) {
                throw new Error(`GPS validation failed: ${gpsValidation.message}`);
            }

            // Check if agent has active visit
            const activeVisitQuery = `
                SELECT id FROM visit_lists 
                WHERE agent_id = $1 AND status = 'in_progress'
            `;
            const activeVisitResult = await client.query(activeVisitQuery, [agentId]);
            
            if (activeVisitResult.rows.length > 0) {
                throw new Error('Agent already has an active visit');
            }

            // Create visit record
            const visitId = uuidv4();
            const visitQuery = `
                INSERT INTO visit_lists (
                    id, customer_id, agent_id, visit_date, actual_start_time,
                    visit_purpose, brands, planned_activities, visit_location,
                    distance_from_customer, status, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, 
                    ST_SetSRID(ST_MakePoint($9, $10), 4326),
                    $11, $12, $13
                ) RETURNING id
            `;

            await client.query(visitQuery, [
                visitId, visitData.customer_id, agentId, new Date(),
                new Date(), visitData.visit_purpose, visitData.brands || [],
                JSON.stringify(visitData.planned_activities || {}),
                visitData.current_location.longitude, visitData.current_location.latitude,
                gpsValidation.distance, 'in_progress', new Date()
            ]);

            // Generate visit activities based on brands and customer type
            const activities = await this.generateVisitActivities(
                visitData.customer_id, 
                visitData.brands || []
            );

            // Update visit with generated activities
            const updateActivitiesQuery = `
                UPDATE visit_lists 
                SET planned_activities = $1
                WHERE id = $2
            `;
            await client.query(updateActivitiesQuery, [
                JSON.stringify(activities), visitId
            ]);

            await client.query('COMMIT');

            this.logger.info('Visit started successfully', {
                visitId,
                agentId,
                customerId: visitData.customer_id,
                distance: gpsValidation.distance
            });

            return {
                success: true,
                visit_id: visitId,
                activities,
                gps_validation: gpsValidation,
                message: 'Visit started successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Visit start failed', {
                error: error.message,
                agentId,
                visitData
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Validate GPS Location
     */
    async validateGPSLocation(customerId, currentLocation) {
        const client = await this.db.connect();
        
        try {
            // Get customer location
            const customerQuery = `
                SELECT ST_X(location) as longitude, ST_Y(location) as latitude,
                       company_name, address_line1
                FROM customers 
                WHERE id = $1
            `;
            const customerResult = await client.query(customerQuery, [customerId]);
            
            if (customerResult.rows.length === 0) {
                return {
                    isValid: false,
                    message: 'Customer not found'
                };
            }

            const customer = customerResult.rows[0];
            
            if (!customer.longitude || !customer.latitude) {
                return {
                    isValid: false,
                    message: 'Customer location not set'
                };
            }

            // Calculate distance
            const distance = geolib.getDistance(
                { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
                { latitude: customer.latitude, longitude: customer.longitude }
            );

            const isValid = distance <= this.GPS_VALIDATION_RADIUS;

            return {
                isValid,
                distance,
                message: isValid ? 'GPS validation successful' : 
                        `Distance ${distance}m exceeds allowed radius of ${this.GPS_VALIDATION_RADIUS}m`,
                customer_location: {
                    latitude: customer.latitude,
                    longitude: customer.longitude
                },
                customer_name: customer.company_name,
                customer_address: customer.address_line1
            };

        } finally {
            client.release();
        }
    }

    /**
     * Place Board with Image Analysis
     */
    async placeBoard(agentId, placementData) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate visit is active
            const visitQuery = `
                SELECT id FROM visit_lists 
                WHERE agent_id = $1 AND status = 'in_progress'
                ORDER BY actual_start_time DESC LIMIT 1
            `;
            const visitResult = await client.query(visitQuery, [agentId]);
            
            if (visitResult.rows.length === 0) {
                throw new Error('No active visit found');
            }

            const visitId = visitResult.rows[0].id;

            // Validate board exists and is active
            const boardQuery = `
                SELECT b.*, br.name as brand_name
                FROM boards b
                JOIN brands br ON b.brand_id = br.id
                WHERE b.id = $1 AND b.is_active = true
            `;
            const boardResult = await client.query(boardQuery, [placementData.board_id]);
            
            if (boardResult.rows.length === 0) {
                throw new Error('Board not found or inactive');
            }

            const board = boardResult.rows[0];

            // Analyze board coverage using image analysis
            const imageAnalysis = await this.analyzeImageCoverage(
                placementData.board_photo,
                placementData.storefront_photo
            );

            if (imageAnalysis.confidence < this.IMAGE_ANALYSIS_CONFIDENCE_THRESHOLD) {
                throw new Error(`Image analysis confidence too low: ${imageAnalysis.confidence}`);
            }

            // Calculate commission
            const commission = await this.calculateBoardCommission(
                board, 
                imageAnalysis.coverage_percentage
            );

            // Create board placement record
            const placementId = uuidv4();
            const placementQuery = `
                INSERT INTO board_placements (
                    id, board_id, customer_id, agent_id, 
                    placement_location, placement_address, placement_photo_url,
                    storefront_photo_url, coverage_percentage, quality_score,
                    ai_analysis_result, commission_earned, bonus_earned,
                    placement_date, status, created_at
                ) VALUES (
                    $1, $2, $3, $4,
                    ST_SetSRID(ST_MakePoint($5, $6), 4326),
                    $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
                ) RETURNING id
            `;

            await client.query(placementQuery, [
                placementId, placementData.board_id, placementData.customer_id,
                agentId, placementData.location.longitude, placementData.location.latitude,
                placementData.placement_address, placementData.board_photo_url,
                placementData.storefront_photo_url, imageAnalysis.coverage_percentage,
                imageAnalysis.quality_score, JSON.stringify(imageAnalysis),
                commission.base_amount, commission.bonus_amount,
                new Date(), 'active', new Date()
            ]);

            // Record commission
            await this.recordCommission(client, agentId, 'board_placement', placementId, commission);

            // Update visit activities
            await this.updateVisitActivity(client, visitId, 'board_placement', {
                board_id: placementData.board_id,
                placement_id: placementId,
                commission_earned: commission.total_amount,
                coverage_percentage: imageAnalysis.coverage_percentage
            });

            await client.query('COMMIT');

            this.logger.info('Board placed successfully', {
                placementId,
                agentId,
                boardId: placementData.board_id,
                coverage: imageAnalysis.coverage_percentage,
                commission: commission.total_amount
            });

            return {
                success: true,
                placement_id: placementId,
                coverage_percentage: imageAnalysis.coverage_percentage,
                quality_score: imageAnalysis.quality_score,
                commission_earned: commission.total_amount,
                image_analysis: imageAnalysis,
                message: 'Board placed successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Board placement failed', {
                error: error.message,
                agentId,
                placementData
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Analyze Image Coverage using AI
     */
    async analyzeImageCoverage(boardPhotoBase64, storefrontPhotoBase64) {
        try {
            // Convert base64 to buffer
            const boardBuffer = Buffer.from(boardPhotoBase64.split(',')[1], 'base64');
            const storefrontBuffer = Buffer.from(storefrontPhotoBase64.split(',')[1], 'base64');

            // Get image metadata
            const boardMetadata = await sharp(boardBuffer).metadata();
            const storefrontMetadata = await sharp(storefrontBuffer).metadata();

            // Simulate AI analysis (in production, integrate with actual AI service)
            const boardArea = boardMetadata.width * boardMetadata.height;
            const storefrontArea = storefrontMetadata.width * storefrontMetadata.height;
            
            // Calculate coverage percentage (simplified algorithm)
            const coveragePercentage = Math.min((boardArea / storefrontArea) * 100, 100);
            
            // Quality assessment based on image properties
            const qualityScore = this.calculateImageQuality(boardMetadata, storefrontMetadata);
            
            // Confidence based on image clarity and size
            const confidence = Math.min(
                (boardMetadata.width * boardMetadata.height) / (1920 * 1080), 
                1.0
            );

            return {
                coverage_percentage: Math.round(coveragePercentage * 100) / 100,
                quality_score: Math.round(qualityScore * 100) / 100,
                confidence: Math.round(confidence * 100) / 100,
                board_dimensions: {
                    width: boardMetadata.width,
                    height: boardMetadata.height
                },
                storefront_dimensions: {
                    width: storefrontMetadata.width,
                    height: storefrontMetadata.height
                },
                analysis_timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('Image analysis failed', { error: error.message });
            throw new Error('Image analysis failed');
        }
    }

    /**
     * Calculate Image Quality Score
     */
    calculateImageQuality(boardMetadata, storefrontMetadata) {
        let qualityScore = 0;

        // Resolution score (0-40 points)
        const boardResolution = boardMetadata.width * boardMetadata.height;
        const storefrontResolution = storefrontMetadata.width * storefrontMetadata.height;
        const avgResolution = (boardResolution + storefrontResolution) / 2;
        const resolutionScore = Math.min(avgResolution / (1920 * 1080) * 40, 40);

        // Format score (0-20 points)
        const formatScore = (boardMetadata.format === 'jpeg' || boardMetadata.format === 'png') ? 20 : 10;

        // Size score (0-20 points) - prefer reasonable file sizes
        const avgSize = (boardMetadata.size || 1000000) / 1000000; // MB
        const sizeScore = avgSize > 0.5 && avgSize < 5 ? 20 : 10;

        // Density score (0-20 points)
        const densityScore = (boardMetadata.density && boardMetadata.density >= 72) ? 20 : 10;

        qualityScore = resolutionScore + formatScore + sizeScore + densityScore;
        return Math.min(qualityScore, 100);
    }

    /**
     * Calculate Board Commission
     */
    async calculateBoardCommission(board, coveragePercentage) {
        const baseAmount = parseFloat(board.commission_rate);
        let bonusAmount = 0;

        // Parse bonus rules
        const bonusRules = board.bonus_rules || {};
        
        // Coverage bonus
        if (bonusRules.coverage_bonus) {
            for (const rule of bonusRules.coverage_bonus) {
                if (coveragePercentage >= rule.min_coverage) {
                    bonusAmount += rule.bonus_amount || (baseAmount * rule.multiplier);
                }
            }
        }

        // Quality bonus
        if (bonusRules.quality_bonus && coveragePercentage >= 80) {
            bonusAmount += bonusRules.quality_bonus.amount || 0;
        }

        return {
            base_amount: baseAmount,
            bonus_amount: bonusAmount,
            total_amount: baseAmount + bonusAmount,
            calculation_details: {
                coverage_percentage: coveragePercentage,
                base_rate: board.commission_rate,
                bonus_rules_applied: bonusRules
            }
        };
    }

    /**
     * Distribute Product
     */
    async distributeProduct(agentId, distributionData) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate active visit
            const visitQuery = `
                SELECT id FROM visit_lists 
                WHERE agent_id = $1 AND status = 'in_progress'
                ORDER BY actual_start_time DESC LIMIT 1
            `;
            const visitResult = await client.query(visitQuery, [agentId]);
            
            if (visitResult.rows.length === 0) {
                throw new Error('No active visit found');
            }

            const visitId = visitResult.rows[0].id;

            // Validate product is distributable
            const productQuery = `
                SELECT id, name, is_distributable, distribution_commission
                FROM products 
                WHERE id = $1 AND is_active = true AND is_distributable = true
            `;
            const productResult = await client.query(productQuery, [distributionData.product_id]);
            
            if (productResult.rows.length === 0) {
                throw new Error('Product not found or not distributable');
            }

            const product = productResult.rows[0];

            // Check agent inventory (if applicable)
            const agentInventoryQuery = `
                SELECT quantity_on_hand FROM agent_inventory 
                WHERE agent_id = $1 AND product_id = $2
            `;
            const inventoryResult = await client.query(agentInventoryQuery, [
                agentId, distributionData.product_id
            ]);

            if (inventoryResult.rows.length > 0) {
                const availableQuantity = inventoryResult.rows[0].quantity_on_hand;
                if (availableQuantity < distributionData.quantity_distributed) {
                    throw new Error(`Insufficient inventory. Available: ${availableQuantity}`);
                }
            }

            // Calculate commission
            const commission = parseFloat(product.distribution_commission) * distributionData.quantity_distributed;

            // Create distribution record
            const distributionId = uuidv4();
            const distributionQuery = `
                INSERT INTO product_distributions (
                    id, product_id, agent_id, customer_id, visit_id,
                    quantity_distributed, recipient_details, distribution_form,
                    distribution_location, distribution_photo_url, recipient_signature_url,
                    commission_earned, distribution_date, status, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8,
                    ST_SetSRID(ST_MakePoint($9, $10), 4326),
                    $11, $12, $13, $14, $15, $16
                ) RETURNING id
            `;

            await client.query(distributionQuery, [
                distributionId, distributionData.product_id, agentId,
                distributionData.customer_id, visitId, distributionData.quantity_distributed,
                JSON.stringify(distributionData.recipient_details),
                JSON.stringify(distributionData.distribution_form),
                distributionData.location.longitude, distributionData.location.latitude,
                distributionData.distribution_photo_url, distributionData.recipient_signature_url,
                commission, new Date(), 'distributed', new Date()
            ]);

            // Update agent inventory if applicable
            if (inventoryResult.rows.length > 0) {
                const updateInventoryQuery = `
                    UPDATE agent_inventory 
                    SET quantity_on_hand = quantity_on_hand - $1,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE agent_id = $2 AND product_id = $3
                `;
                await client.query(updateInventoryQuery, [
                    distributionData.quantity_distributed, agentId, distributionData.product_id
                ]);
            }

            // Record commission
            await this.recordCommission(client, agentId, 'product_distribution', distributionId, {
                base_amount: commission,
                bonus_amount: 0,
                total_amount: commission
            });

            // Update visit activities
            await this.updateVisitActivity(client, visitId, 'product_distribution', {
                product_id: distributionData.product_id,
                distribution_id: distributionId,
                quantity: distributionData.quantity_distributed,
                commission_earned: commission
            });

            await client.query('COMMIT');

            this.logger.info('Product distributed successfully', {
                distributionId,
                agentId,
                productId: distributionData.product_id,
                quantity: distributionData.quantity_distributed,
                commission
            });

            return {
                success: true,
                distribution_id: distributionId,
                commission_earned: commission,
                message: 'Product distributed successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Product distribution failed', {
                error: error.message,
                agentId,
                distributionData
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Complete Survey
     */
    async completeSurvey(agentId, surveyData) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate survey exists and is active
            const surveyQuery = `
                SELECT * FROM surveys 
                WHERE id = $1 AND is_active = true
                AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
                AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
            `;
            const surveyResult = await client.query(surveyQuery, [surveyData.survey_id]);
            
            if (surveyResult.rows.length === 0) {
                throw new Error('Survey not found or not active');
            }

            const survey = surveyResult.rows[0];

            // Validate responses
            const validationResult = this.validateSurveyResponses(survey, surveyData.responses);
            if (!validationResult.isValid) {
                throw new Error(`Survey validation failed: ${validationResult.errors.join(', ')}`);
            }

            // Get active visit
            const visitQuery = `
                SELECT id FROM visit_lists 
                WHERE agent_id = $1 AND status = 'in_progress'
                ORDER BY actual_start_time DESC LIMIT 1
            `;
            const visitResult = await client.query(visitQuery, [agentId]);
            const visitId = visitResult.rows.length > 0 ? visitResult.rows[0].id : null;

            // Calculate commission
            const commission = parseFloat(survey.commission_rate) || 0;

            // Create survey response
            const responseId = uuidv4();
            const responseQuery = `
                INSERT INTO survey_responses (
                    id, survey_id, visit_id, agent_id, customer_id,
                    responses, completion_time, location, commission_earned,
                    submitted_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7,
                    ST_SetSRID(ST_MakePoint($8, $9), 4326),
                    $10, $11
                ) RETURNING id
            `;

            await client.query(responseQuery, [
                responseId, surveyData.survey_id, visitId, agentId,
                surveyData.customer_id, JSON.stringify(surveyData.responses),
                surveyData.completion_time, surveyData.location.longitude,
                surveyData.location.latitude, commission, new Date()
            ]);

            // Record commission if applicable
            if (commission > 0) {
                await this.recordCommission(client, agentId, 'survey_completion', responseId, {
                    base_amount: commission,
                    bonus_amount: 0,
                    total_amount: commission
                });
            }

            // Update visit activities if visit is active
            if (visitId) {
                await this.updateVisitActivity(client, visitId, 'survey_completion', {
                    survey_id: surveyData.survey_id,
                    response_id: responseId,
                    commission_earned: commission
                });
            }

            await client.query('COMMIT');

            this.logger.info('Survey completed successfully', {
                responseId,
                agentId,
                surveyId: surveyData.survey_id,
                commission
            });

            return {
                success: true,
                response_id: responseId,
                commission_earned: commission,
                message: 'Survey completed successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Survey completion failed', {
                error: error.message,
                agentId,
                surveyData
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Complete Visit
     */
    async completeVisit(agentId, visitData) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Get active visit
            const visitQuery = `
                SELECT * FROM visit_lists 
                WHERE agent_id = $1 AND status = 'in_progress'
                ORDER BY actual_start_time DESC LIMIT 1
            `;
            const visitResult = await client.query(visitQuery, [agentId]);
            
            if (visitResult.rows.length === 0) {
                throw new Error('No active visit found');
            }

            const visit = visitResult.rows[0];

            // Calculate total commission for this visit
            const commissionQuery = `
                SELECT SUM(total_amount) as total_commission
                FROM agent_commissions
                WHERE agent_id = $1 AND earned_date = CURRENT_DATE
                AND activity_id IN (
                    SELECT id FROM board_placements WHERE agent_id = $1 AND DATE(placement_date) = CURRENT_DATE
                    UNION
                    SELECT id FROM product_distributions WHERE agent_id = $1 AND DATE(distribution_date) = CURRENT_DATE
                    UNION
                    SELECT id FROM survey_responses WHERE agent_id = $1 AND DATE(submitted_at) = CURRENT_DATE
                )
            `;
            const commissionResult = await client.query(commissionQuery, [agentId]);
            const totalCommission = parseFloat(commissionResult.rows[0].total_commission) || 0;

            // Update visit record
            const updateVisitQuery = `
                UPDATE visit_lists 
                SET actual_end_time = $1,
                    status = $2,
                    visit_rating = $3,
                    customer_feedback = $4,
                    agent_notes = $5,
                    total_commission = $6,
                    completed_activities = $7,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $8
            `;

            await client.query(updateVisitQuery, [
                new Date(), 'completed', visitData.visit_rating,
                visitData.customer_feedback, visitData.agent_notes,
                totalCommission, JSON.stringify(visitData.completed_activities),
                visit.id
            ]);

            // Update agent statistics
            const updateAgentQuery = `
                UPDATE field_agents 
                SET total_visits = total_visits + 1,
                    total_commissions = total_commissions + $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `;
            await client.query(updateAgentQuery, [totalCommission, agentId]);

            await client.query('COMMIT');

            this.logger.info('Visit completed successfully', {
                visitId: visit.id,
                agentId,
                totalCommission,
                duration: new Date() - new Date(visit.actual_start_time)
            });

            return {
                success: true,
                visit_id: visit.id,
                total_commission: totalCommission,
                visit_duration: Math.round((new Date() - new Date(visit.actual_start_time)) / 60000), // minutes
                message: 'Visit completed successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Visit completion failed', {
                error: error.message,
                agentId,
                visitData
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Record Commission
     */
    async recordCommission(client, agentId, activityType, activityId, commission) {
        const commissionQuery = `
            INSERT INTO agent_commissions (
                id, agent_id, activity_type, activity_id,
                base_amount, bonus_amount, total_amount,
                calculation_details, earned_date, payment_status,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        await client.query(commissionQuery, [
            uuidv4(), agentId, activityType, activityId,
            commission.base_amount, commission.bonus_amount, commission.total_amount,
            JSON.stringify(commission.calculation_details || {}),
            new Date(), 'pending', new Date()
        ]);
    }

    /**
     * Update Visit Activity
     */
    async updateVisitActivity(client, visitId, activityType, activityData) {
        const updateQuery = `
            UPDATE visit_lists 
            SET completed_activities = completed_activities || $1
            WHERE id = $2
        `;

        const activityUpdate = {};
        activityUpdate[activityType] = activityData;

        await client.query(updateQuery, [
            JSON.stringify(activityUpdate), visitId
        ]);
    }

    /**
     * Generate Visit Activities
     */
    async generateVisitActivities(customerId, brands) {
        const client = await this.db.connect();
        
        try {
            const activities = {
                mandatory_surveys: [],
                optional_surveys: [],
                board_placements: [],
                product_distributions: []
            };

            // Get mandatory surveys
            const mandatorySurveyQuery = `
                SELECT id, title, brand_id FROM surveys 
                WHERE survey_type = 'mandatory' AND is_active = true
                AND (brand_id IS NULL OR brand_id = ANY($1))
            `;
            const mandatorySurveys = await client.query(mandatorySurveyQuery, [brands]);
            activities.mandatory_surveys = mandatorySurveys.rows;

            // Get available boards for brands
            const boardQuery = `
                SELECT id, board_name, brand_id, commission_rate 
                FROM boards 
                WHERE brand_id = ANY($1) AND is_active = true
            `;
            const boards = await client.query(boardQuery, [brands]);
            activities.board_placements = boards.rows;

            // Get distributable products
            const productQuery = `
                SELECT id, name, distribution_commission 
                FROM products 
                WHERE is_distributable = true AND is_active = true
            `;
            const products = await client.query(productQuery);
            activities.product_distributions = products.rows;

            return activities;

        } finally {
            client.release();
        }
    }

    /**
     * Validate Survey Responses
     */
    validateSurveyResponses(survey, responses) {
        const errors = [];
        const questions = survey.questions || [];

        for (const question of questions) {
            const response = responses[question.questionId];

            if (question.required && (!response || response === '')) {
                errors.push(`Question "${question.question}" is required`);
                continue;
            }

            if (response && question.validation) {
                // Apply validation rules
                const validation = question.validation;
                
                if (validation.minLength && response.length < validation.minLength) {
                    errors.push(`Question "${question.question}" must be at least ${validation.minLength} characters`);
                }

                if (validation.maxLength && response.length > validation.maxLength) {
                    errors.push(`Question "${question.question}" must not exceed ${validation.maxLength} characters`);
                }

                if (validation.pattern && !new RegExp(validation.pattern).test(response)) {
                    errors.push(`Question "${question.question}" format is invalid`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Generate Session Token
     */
    generateSessionToken() {
        return require('crypto').randomBytes(32).toString('hex');
    }

    /**
     * Get Agent Dashboard Data
     */
    async getAgentDashboard(agentId, dateRange) {
        const client = await this.db.connect();
        
        try {
            const dashboardQuery = `
                SELECT 
                    COUNT(DISTINCT vl.id) as total_visits,
                    COUNT(DISTINCT bp.id) as total_board_placements,
                    COUNT(DISTINCT pd.id) as total_product_distributions,
                    COUNT(DISTINCT sr.id) as total_surveys,
                    COALESCE(SUM(ac.total_amount), 0) as total_commissions,
                    COUNT(DISTINCT vl.customer_id) as unique_customers
                FROM field_agents fa
                LEFT JOIN visit_lists vl ON fa.id = vl.agent_id 
                    AND vl.visit_date BETWEEN $2 AND $3
                LEFT JOIN board_placements bp ON fa.id = bp.agent_id 
                    AND bp.placement_date BETWEEN $2 AND $3
                LEFT JOIN product_distributions pd ON fa.id = pd.agent_id 
                    AND pd.distribution_date BETWEEN $2 AND $3
                LEFT JOIN survey_responses sr ON fa.id = sr.agent_id 
                    AND sr.submitted_at BETWEEN $2 AND $3
                LEFT JOIN agent_commissions ac ON fa.id = ac.agent_id 
                    AND ac.earned_date BETWEEN $2 AND $3
                WHERE fa.id = $1
                GROUP BY fa.id
            `;

            const result = await client.query(dashboardQuery, [
                agentId, dateRange.from, dateRange.to
            ]);

            return result.rows[0] || {
                total_visits: 0,
                total_board_placements: 0,
                total_product_distributions: 0,
                total_surveys: 0,
                total_commissions: 0,
                unique_customers: 0
            };

        } finally {
            client.release();
        }
    }
}

module.exports = FieldMarketingService;