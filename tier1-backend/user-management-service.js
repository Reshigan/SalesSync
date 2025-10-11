/**
 * SalesSync Tier-1 User Management Service
 * Complete user lifecycle and role-based access control
 * 
 * Features:
 * - Role-based access control (RBAC) with granular permissions
 * - User hierarchy and team management
 * - Session management and authentication
 * - Audit logging and activity tracking
 * - Permission matrix and dynamic role assignment
 * - Bulk user operations and imports
 * - Multi-agent type support (Van Sales, Trade Marketing, Promotion, Events, etc.)
 * - Server assignment to roles, activities, and visits
 * - Territory and area-based access control
 */

const express = require('express');
const { Pool } = require('pg');
const Redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const winston = require('winston');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UserManagementService {
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
                new winston.transports.File({ filename: 'user-management.log' }),
                new winston.transports.Console()
            ]
        });

        this.initializeUserSettings();
    }

    /**
     * Initialize User Settings and Agent Types
     */
    initializeUserSettings() {
        this.agentTypes = {
            VAN_SALES: {
                name: 'Van Sales Agent',
                description: 'Mobile sales agents with van-based operations',
                capabilities: ['order_taking', 'inventory_management', 'customer_visits', 'payment_collection'],
                visit_types: ['sales_visit', 'delivery', 'collection', 'customer_service']
            },
            TRADE_MARKETING: {
                name: 'Trade Marketing Agent',
                description: 'Trade marketing and merchandising specialists',
                capabilities: ['campaign_execution', 'merchandising', 'brand_promotion', 'trade_activities'],
                visit_types: ['merchandising_visit', 'campaign_execution', 'trade_audit', 'brand_activation']
            },
            PROMOTION_EVENTS: {
                name: 'Promotion & Events Agent',
                description: 'Promotion and event management specialists',
                capabilities: ['event_management', 'promotion_execution', 'sampling', 'brand_engagement'],
                visit_types: ['event_setup', 'promotion_execution', 'sampling_activity', 'brand_engagement']
            },
            FIELD_MARKETING: {
                name: 'Field Marketing Agent',
                description: 'General field marketing representatives',
                capabilities: ['market_research', 'competitor_analysis', 'customer_engagement', 'lead_generation'],
                visit_types: ['market_research', 'competitor_audit', 'customer_survey', 'lead_qualification']
            },
            SALES_SUPERVISOR: {
                name: 'Sales Supervisor',
                description: 'Team supervisors and managers',
                capabilities: ['team_management', 'performance_monitoring', 'territory_oversight', 'coaching'],
                visit_types: ['team_review', 'performance_audit', 'coaching_session', 'territory_inspection']
            },
            TECHNICAL_SUPPORT: {
                name: 'Technical Support Agent',
                description: 'Technical support and service specialists',
                capabilities: ['technical_support', 'product_training', 'troubleshooting', 'installation'],
                visit_types: ['technical_support', 'product_demo', 'training_session', 'installation_support']
            }
        };

        this.systemRoles = {
            SUPER_ADMIN: {
                name: 'Super Administrator',
                level: 1,
                permissions: ['*'], // All permissions
                description: 'Full system access'
            },
            ADMIN: {
                name: 'Administrator',
                level: 2,
                permissions: ['user_management', 'system_config', 'reports', 'analytics'],
                description: 'Administrative access'
            },
            MANAGER: {
                name: 'Manager',
                level: 3,
                permissions: ['team_management', 'reports', 'customer_management', 'order_management'],
                description: 'Management level access'
            },
            SUPERVISOR: {
                name: 'Supervisor',
                level: 4,
                permissions: ['team_view', 'customer_view', 'order_view', 'visit_management'],
                description: 'Supervisory access'
            },
            AGENT: {
                name: 'Field Agent',
                level: 5,
                permissions: ['customer_visit', 'order_create', 'inventory_view', 'activity_log'],
                description: 'Field agent access'
            },
            VIEWER: {
                name: 'Viewer',
                level: 6,
                permissions: ['read_only'],
                description: 'Read-only access'
            }
        };

        this.permissions = {
            // User Management
            'users.create': 'Create users',
            'users.read': 'View users',
            'users.update': 'Update users',
            'users.delete': 'Delete users',
            'users.assign_roles': 'Assign roles to users',
            'users.assign_servers': 'Assign servers to users',
            
            // Customer Management
            'customers.create': 'Create customers',
            'customers.read': 'View customers',
            'customers.update': 'Update customers',
            'customers.delete': 'Delete customers',
            
            // Order Management
            'orders.create': 'Create orders',
            'orders.read': 'View orders',
            'orders.update': 'Update orders',
            'orders.delete': 'Delete orders',
            'orders.approve': 'Approve orders',
            
            // Inventory Management
            'inventory.create': 'Create inventory',
            'inventory.read': 'View inventory',
            'inventory.update': 'Update inventory',
            'inventory.delete': 'Delete inventory',
            'inventory.transfer': 'Transfer inventory',
            
            // Field Marketing
            'field_marketing.create': 'Create field marketing activities',
            'field_marketing.read': 'View field marketing activities',
            'field_marketing.update': 'Update field marketing activities',
            'field_marketing.assign_servers': 'Assign servers to field activities',
            
            // Visits
            'visits.create': 'Create visits',
            'visits.read': 'View visits',
            'visits.update': 'Update visits',
            'visits.assign_servers': 'Assign servers to visits',
            
            // Reports
            'reports.view': 'View reports',
            'reports.create': 'Create reports',
            'reports.export': 'Export reports',
            
            // System Administration
            'system.configure': 'Configure system settings',
            'system.backup': 'Backup system',
            'system.restore': 'Restore system',
            'system.audit': 'View audit logs'
        };

        this.serverTypes = {
            WEB_SERVER: 'Web Application Server',
            API_SERVER: 'API Gateway Server',
            MOBILE_SERVER: 'Mobile Application Server',
            ANALYTICS_SERVER: 'Analytics Processing Server',
            NOTIFICATION_SERVER: 'Notification Service Server',
            FILE_SERVER: 'File Storage Server',
            BACKUP_SERVER: 'Backup and Recovery Server'
        };
    }

    /**
     * Create User with Role Assignment
     */
    async createUser(userData, createdBy) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate user data
            const validationResult = await this.validateUserData(userData);
            if (!validationResult.isValid) {
                throw new Error(`User validation failed: ${validationResult.errors.join(', ')}`);
            }

            // Check if user already exists
            const existingUserQuery = `
                SELECT id FROM users WHERE email = $1 OR username = $2
            `;
            const existingUser = await client.query(existingUserQuery, [
                userData.email, userData.username
            ]);

            if (existingUser.rows.length > 0) {
                throw new Error('User with this email or username already exists');
            }

            // Generate employee code
            const employeeCode = await this.generateEmployeeCode();

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 12);

            // Create user record
            const userId = uuidv4();
            const userQuery = `
                INSERT INTO users (
                    id, employee_code, username, email, password_hash, first_name,
                    last_name, phone, mobile, department, designation, manager_id,
                    hire_date, status, is_active, timezone, language, profile_image,
                    emergency_contact, address, notes, custom_fields,
                    created_by, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                    $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
                ) RETURNING id, employee_code
            `;

            const userResult = await client.query(userQuery, [
                userId, employeeCode, userData.username, userData.email,
                hashedPassword, userData.first_name, userData.last_name,
                userData.phone, userData.mobile, userData.department,
                userData.designation, userData.manager_id, userData.hire_date || new Date(),
                'active', true, userData.timezone || 'Asia/Kolkata',
                userData.language || 'en', userData.profile_image,
                JSON.stringify(userData.emergency_contact || {}),
                JSON.stringify(userData.address || {}), userData.notes,
                JSON.stringify(userData.custom_fields || {}), createdBy, new Date()
            ]);

            // Assign roles
            if (userData.roles && userData.roles.length > 0) {
                for (const roleId of userData.roles) {
                    await this.assignUserRole(client, userId, roleId, createdBy);
                }
            }

            // Assign servers if specified
            if (userData.assigned_servers && userData.assigned_servers.length > 0) {
                for (const serverAssignment of userData.assigned_servers) {
                    await this.assignServerToUser(client, userId, serverAssignment, createdBy);
                }
            }

            // Create user profile
            await this.createUserProfile(client, userId, userData, createdBy);

            // Initialize user preferences
            await this.initializeUserPreferences(client, userId);

            await client.query('COMMIT');

            // Cache user data
            await this.cacheUser(userId);

            this.logger.info('User created successfully', {
                userId,
                employeeCode,
                username: userData.username,
                email: userData.email,
                createdBy
            });

            return {
                success: true,
                user_id: userId,
                employee_code: employeeCode,
                message: 'User created successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('User creation failed', {
                error: error.message,
                userData: { ...userData, password: '[REDACTED]' },
                createdBy
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Assign Role to User
     */
    async assignUserRole(client, userId, roleId, assignedBy) {
        const roleAssignmentQuery = `
            INSERT INTO user_role_assignments (
                id, user_id, role_id, assigned_by, assigned_at, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id, role_id) 
            DO UPDATE SET 
                assigned_by = $4,
                assigned_at = $5,
                is_active = $6
        `;

        await client.query(roleAssignmentQuery, [
            uuidv4(), userId, roleId, assignedBy, new Date(), true
        ]);
    }

    /**
     * Assign Server to User
     */
    async assignServerToUser(client, userId, serverAssignment, assignedBy) {
        const serverAssignmentQuery = `
            INSERT INTO user_server_assignments (
                id, user_id, server_id, server_type, assignment_type,
                access_level, assigned_by, assigned_at, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id, server_id) 
            DO UPDATE SET 
                assignment_type = $5,
                access_level = $6,
                assigned_by = $7,
                assigned_at = $8,
                is_active = $9
        `;

        await client.query(serverAssignmentQuery, [
            uuidv4(), userId, serverAssignment.server_id, serverAssignment.server_type,
            serverAssignment.assignment_type || 'primary', serverAssignment.access_level || 'read',
            assignedBy, new Date(), true
        ]);
    }

    /**
     * Assign Server to Role Activity
     */
    async assignServerToRoleActivity(roleId, activityId, serverAssignment, assignedBy) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate role and activity exist
            const validationQuery = `
                SELECT r.id as role_id, ra.id as activity_id
                FROM roles r
                CROSS JOIN role_activities ra
                WHERE r.id = $1 AND ra.id = $2
            `;
            const validationResult = await client.query(validationQuery, [roleId, activityId]);
            
            if (validationResult.rows.length === 0) {
                throw new Error('Role or activity not found');
            }

            // Create server assignment for role activity
            const assignmentQuery = `
                INSERT INTO role_activity_server_assignments (
                    id, role_id, activity_id, server_id, server_type,
                    assignment_type, access_level, assigned_by, assigned_at, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (role_id, activity_id, server_id) 
                DO UPDATE SET 
                    assignment_type = $6,
                    access_level = $7,
                    assigned_by = $8,
                    assigned_at = $9,
                    is_active = $10
            `;

            await client.query(assignmentQuery, [
                uuidv4(), roleId, activityId, serverAssignment.server_id,
                serverAssignment.server_type, serverAssignment.assignment_type || 'primary',
                serverAssignment.access_level || 'read', assignedBy, new Date(), true
            ]);

            await client.query('COMMIT');

            this.logger.info('Server assigned to role activity', {
                roleId,
                activityId,
                serverId: serverAssignment.server_id,
                assignedBy
            });

            return {
                success: true,
                message: 'Server assigned to role activity successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Server assignment to role activity failed', {
                error: error.message,
                roleId,
                activityId,
                serverAssignment,
                assignedBy
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Assign Server to Visit
     */
    async assignServerToVisit(visitId, serverAssignment, assignedBy) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            // Validate visit exists
            const visitQuery = `SELECT id FROM visit_lists WHERE id = $1`;
            const visitResult = await client.query(visitQuery, [visitId]);
            
            if (visitResult.rows.length === 0) {
                throw new Error('Visit not found');
            }

            // Create server assignment for visit
            const assignmentQuery = `
                INSERT INTO visit_server_assignments (
                    id, visit_id, server_id, server_type, assignment_type,
                    access_level, assigned_by, assigned_at, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (visit_id, server_id) 
                DO UPDATE SET 
                    assignment_type = $5,
                    access_level = $6,
                    assigned_by = $7,
                    assigned_at = $8,
                    is_active = $9
            `;

            await client.query(assignmentQuery, [
                uuidv4(), visitId, serverAssignment.server_id, serverAssignment.server_type,
                serverAssignment.assignment_type || 'primary', serverAssignment.access_level || 'read',
                assignedBy, new Date(), true
            ]);

            await client.query('COMMIT');

            this.logger.info('Server assigned to visit', {
                visitId,
                serverId: serverAssignment.server_id,
                assignedBy
            });

            return {
                success: true,
                message: 'Server assigned to visit successfully'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Server assignment to visit failed', {
                error: error.message,
                visitId,
                serverAssignment,
                assignedBy
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Authenticate User
     */
    async authenticateUser(credentials) {
        const client = await this.db.connect();
        
        try {
            // Get user with roles and permissions
            const userQuery = `
                SELECT 
                    u.*,
                    array_agg(DISTINCT r.role_name) as roles,
                    array_agg(DISTINCT rp.permission_name) as permissions
                FROM users u
                LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.is_active = true
                LEFT JOIN roles r ON ura.role_id = r.id AND r.is_active = true
                LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.is_active = true
                WHERE (u.username = $1 OR u.email = $1) 
                AND u.is_active = true 
                AND u.status = 'active'
                GROUP BY u.id
            `;

            const userResult = await client.query(userQuery, [credentials.username]);
            
            if (userResult.rows.length === 0) {
                throw new Error('Invalid credentials');
            }

            const user = userResult.rows[0];

            // Verify password
            const passwordValid = await bcrypt.compare(credentials.password, user.password_hash);
            if (!passwordValid) {
                throw new Error('Invalid credentials');
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    username: user.username,
                    email: user.email,
                    roles: user.roles.filter(r => r !== null),
                    permissions: user.permissions.filter(p => p !== null)
                },
                process.env.JWT_SECRET || 'salessync_secret_key',
                { expiresIn: '24h' }
            );

            // Create session
            const sessionId = uuidv4();
            const sessionQuery = `
                INSERT INTO user_sessions (
                    id, user_id, session_token, ip_address, user_agent,
                    created_at, expires_at, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `;

            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            await client.query(sessionQuery, [
                sessionId, user.id, token, credentials.ip_address,
                credentials.user_agent, new Date(), expiresAt, true
            ]);

            // Update last login
            await client.query(
                'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
                [user.id]
            );

            // Cache user session
            await this.redis.setex(`session:${sessionId}`, 86400, JSON.stringify({
                userId: user.id,
                username: user.username,
                roles: user.roles.filter(r => r !== null),
                permissions: user.permissions.filter(p => p !== null)
            }));

            this.logger.info('User authenticated successfully', {
                userId: user.id,
                username: user.username,
                sessionId
            });

            return {
                success: true,
                token: token,
                session_id: sessionId,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    roles: user.roles.filter(r => r !== null),
                    permissions: user.permissions.filter(p => p !== null)
                },
                expires_at: expiresAt
            };

        } finally {
            client.release();
        }
    }

    /**
     * Create User Profile
     */
    async createUserProfile(client, userId, userData, createdBy) {
        const profileQuery = `
            INSERT INTO user_profiles (
                id, user_id, bio, skills, certifications, experience_years,
                education, social_links, preferences, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        await client.query(profileQuery, [
            uuidv4(), userId, userData.bio, 
            JSON.stringify(userData.skills || []),
            JSON.stringify(userData.certifications || []),
            userData.experience_years || 0,
            JSON.stringify(userData.education || {}),
            JSON.stringify(userData.social_links || {}),
            JSON.stringify(userData.preferences || {}),
            new Date()
        ]);
    }

    /**
     * Initialize User Preferences
     */
    async initializeUserPreferences(client, userId) {
        const defaultPreferences = {
            theme: 'light',
            language: 'en',
            timezone: 'Asia/Kolkata',
            notifications: {
                email: true,
                sms: false,
                push: true,
                in_app: true
            },
            dashboard: {
                layout: 'default',
                widgets: ['orders', 'customers', 'inventory', 'visits']
            }
        };

        const preferencesQuery = `
            INSERT INTO user_preferences (
                id, user_id, preferences, created_at
            ) VALUES ($1, $2, $3, $4)
        `;

        await client.query(preferencesQuery, [
            uuidv4(), userId, JSON.stringify(defaultPreferences), new Date()
        ]);
    }

    /**
     * Get User with Full Details
     */
    async getUserDetails(userId) {
        const client = await this.db.connect();
        
        try {
            // Get user with roles, permissions, and server assignments
            const userQuery = `
                SELECT 
                    u.*,
                    up.bio, up.skills, up.certifications, up.experience_years,
                    up.education, up.social_links,
                    array_agg(DISTINCT jsonb_build_object(
                        'role_id', r.id,
                        'role_name', r.role_name,
                        'role_description', r.description
                    )) FILTER (WHERE r.id IS NOT NULL) as roles,
                    array_agg(DISTINCT rp.permission_name) FILTER (WHERE rp.permission_name IS NOT NULL) as permissions
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.is_active = true
                LEFT JOIN roles r ON ura.role_id = r.id AND r.is_active = true
                LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.is_active = true
                WHERE u.id = $1
                GROUP BY u.id, up.id
            `;

            const userResult = await client.query(userQuery, [userId]);
            
            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }

            const user = userResult.rows[0];

            // Get server assignments
            const serverQuery = `
                SELECT 
                    usa.server_id,
                    usa.server_type,
                    usa.assignment_type,
                    usa.access_level,
                    s.server_name,
                    s.server_url,
                    s.status as server_status
                FROM user_server_assignments usa
                LEFT JOIN servers s ON usa.server_id = s.id
                WHERE usa.user_id = $1 AND usa.is_active = true
            `;
            const serverResult = await client.query(serverQuery, [userId]);

            // Get reporting structure
            const reportingQuery = `
                SELECT 
                    m.id as manager_id,
                    m.first_name || ' ' || m.last_name as manager_name,
                    m.designation as manager_designation,
                    array_agg(DISTINCT jsonb_build_object(
                        'id', s.id,
                        'name', s.first_name || ' ' || s.last_name,
                        'designation', s.designation
                    )) FILTER (WHERE s.id IS NOT NULL) as subordinates
                FROM users u
                LEFT JOIN users m ON u.manager_id = m.id
                LEFT JOIN users s ON s.manager_id = u.id AND s.is_active = true
                WHERE u.id = $1
                GROUP BY u.id, m.id, m.first_name, m.last_name, m.designation
            `;
            const reportingResult = await client.query(reportingQuery, [userId]);

            return {
                user: user,
                server_assignments: serverResult.rows,
                reporting_structure: reportingResult.rows[0] || {},
                generated_at: new Date()
            };

        } finally {
            client.release();
        }
    }

    /**
     * Bulk User Operations
     */
    async bulkUserOperation(operation, userIds, operationData, performedBy) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');

            const results = [];

            for (const userId of userIds) {
                try {
                    let result;
                    
                    switch (operation) {
                        case 'activate':
                            result = await this.activateUser(client, userId, performedBy);
                            break;
                        case 'deactivate':
                            result = await this.deactivateUser(client, userId, performedBy);
                            break;
                        case 'assign_role':
                            result = await this.assignUserRole(client, userId, operationData.role_id, performedBy);
                            break;
                        case 'remove_role':
                            result = await this.removeUserRole(client, userId, operationData.role_id, performedBy);
                            break;
                        case 'assign_server':
                            result = await this.assignServerToUser(client, userId, operationData.server_assignment, performedBy);
                            break;
                        case 'update_department':
                            result = await this.updateUserDepartment(client, userId, operationData.department, performedBy);
                            break;
                        default:
                            throw new Error(`Unsupported bulk operation: ${operation}`);
                    }

                    results.push({
                        user_id: userId,
                        success: true,
                        result: result
                    });

                } catch (error) {
                    results.push({
                        user_id: userId,
                        success: false,
                        error: error.message
                    });
                }
            }

            await client.query('COMMIT');

            this.logger.info('Bulk user operation completed', {
                operation,
                userCount: userIds.length,
                successCount: results.filter(r => r.success).length,
                failureCount: results.filter(r => !r.success).length,
                performedBy
            });

            return {
                success: true,
                operation: operation,
                total_users: userIds.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results: results
            };

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Bulk user operation failed', {
                error: error.message,
                operation,
                userIds,
                performedBy
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Activate User
     */
    async activateUser(client, userId, performedBy) {
        await client.query(
            'UPDATE users SET is_active = true, status = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3',
            ['active', performedBy, userId]
        );
        return { message: 'User activated successfully' };
    }

    /**
     * Deactivate User
     */
    async deactivateUser(client, userId, performedBy) {
        await client.query(
            'UPDATE users SET is_active = false, status = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3',
            ['inactive', performedBy, userId]
        );
        return { message: 'User deactivated successfully' };
    }

    /**
     * Remove User Role
     */
    async removeUserRole(client, userId, roleId, performedBy) {
        await client.query(
            'UPDATE user_role_assignments SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND role_id = $2',
            [userId, roleId]
        );
        return { message: 'Role removed successfully' };
    }

    /**
     * Update User Department
     */
    async updateUserDepartment(client, userId, department, performedBy) {
        await client.query(
            'UPDATE users SET department = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3',
            [department, performedBy, userId]
        );
        return { message: 'Department updated successfully' };
    }

    /**
     * Audit User Activity
     */
    async auditUserActivity(userId, activity, details, ipAddress) {
        const client = await this.db.connect();
        
        try {
            const auditQuery = `
                INSERT INTO user_activity_audit (
                    id, user_id, activity_type, activity_details, ip_address,
                    user_agent, timestamp, session_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `;

            await client.query(auditQuery, [
                uuidv4(), userId, activity, JSON.stringify(details),
                ipAddress, details.user_agent, new Date(), details.session_id
            ]);

        } finally {
            client.release();
        }
    }

    /**
     * Generate Employee Code
     */
    async generateEmployeeCode() {
        const prefix = 'EMP';
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        
        const sequenceKey = `employee_seq:${year}`;
        const sequence = await this.redis.incr(sequenceKey);
        await this.redis.expire(sequenceKey, 86400 * 365);
        
        return `${prefix}${year}${sequence.toString().padStart(5, '0')}`;
    }

    /**
     * Cache User Data
     */
    async cacheUser(userId) {
        const user = await this.getUserDetails(userId);
        await this.redis.setex(`user:${userId}`, 600, JSON.stringify(user));
    }

    /**
     * Validate User Data
     */
    async validateUserData(userData) {
        const schema = Joi.object({
            username: Joi.string().alphanum().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
            first_name: Joi.string().min(2).max(100).required(),
            last_name: Joi.string().min(2).max(100).required(),
            phone: Joi.string().max(20).optional(),
            mobile: Joi.string().max(20).optional(),
            department: Joi.string().max(100).optional(),
            designation: Joi.string().max(100).optional(),
            manager_id: Joi.string().uuid().optional(),
            hire_date: Joi.date().optional(),
            timezone: Joi.string().optional(),
            language: Joi.string().length(2).optional(),
            profile_image: Joi.string().uri().optional(),
            emergency_contact: Joi.object().optional(),
            address: Joi.object().optional(),
            notes: Joi.string().optional(),
            custom_fields: Joi.object().optional(),
            roles: Joi.array().items(Joi.string().uuid()).optional(),
            assigned_servers: Joi.array().items(
                Joi.object({
                    server_id: Joi.string().uuid().required(),
                    server_type: Joi.string().required(),
                    assignment_type: Joi.string().optional(),
                    access_level: Joi.string().valid('read', 'write', 'admin').optional()
                })
            ).optional(),
            bio: Joi.string().optional(),
            skills: Joi.array().items(Joi.string()).optional(),
            certifications: Joi.array().items(Joi.object()).optional(),
            experience_years: Joi.number().integer().min(0).optional(),
            education: Joi.object().optional(),
            social_links: Joi.object().optional(),
            preferences: Joi.object().optional()
        });

        const { error, value } = schema.validate(userData);
        
        return {
            isValid: !error,
            errors: error ? error.details.map(detail => detail.message) : [],
            data: value
        };
    }
}

module.exports = UserManagementService;