/**
 * Mobile Login Authentication Routes for Agents
 * Agents login using mobile number + 6-digit PIN
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getOneQuery, runQuery } = require('../utils/database');

// Simple logger (will be replaced by winston if available)
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Validate JWT secret in production
if (process.env.NODE_ENV === 'production') {
  const insecureSecrets = [
    'your-secret-key-change-in-production',
    'your-super-secret-jwt-key-change-in-production',
    'secret',
    'jwt-secret'
  ];
  if (insecureSecrets.includes(JWT_SECRET) || JWT_SECRET.length < 32) {
    logger.error('SECURITY ERROR: Insecure JWT secret detected in production. Please set a secure JWT_SECRET environment variable (minimum 32 characters).');
    process.exit(1);
  }
}

/**
 * POST /api/auth/mobile-login
 * Agent login with mobile number and PIN
 */
router.post('/mobile-login', async (req, res) => {
  try {
    const { mobile, pin } = req.body;
    const tenantCode = req.headers['x-tenant-code'];

    // Validation
    if (!mobile) {
      return res.status(400).json({
        success: false,
        error: { message: 'Mobile number is required', code: 'MOBILE_REQUIRED' }
      });
    }

    if (!pin) {
      return res.status(400).json({
        success: false,
        error: { message: 'PIN is required', code: 'PIN_REQUIRED' }
      });
    }

    if (!tenantCode) {
      return res.status(400).json({
        success: false,
        error: { message: 'Tenant code is required', code: 'TENANT_REQUIRED' }
      });
    }

    // Validate PIN format (exactly 6 digits)
    if (!/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        error: { message: 'PIN must be exactly 6 digits', code: 'INVALID_PIN_FORMAT' }
      });
    }

    // Normalize mobile number (remove spaces, dashes)
    const normalizedMobile = mobile.replace(/[\s-]/g, '');

    // Get tenant
    const tenant = await getOneQuery(`
      SELECT id, code, name, status 
      FROM tenants 
      WHERE LOWER(code) = LOWER(?)
    `, [tenantCode]);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Tenant not found', code: 'TENANT_NOT_FOUND' }
      });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: { message: 'Tenant is not active', code: 'TENANT_INACTIVE' }
      });
    }

    // Find agent by mobile number and tenant
    const agent = await getOneQuery(`
      SELECT 
        a.id, a.mobile_number, a.mobile_pin, 
        a.status, a.user_id, u.role, u.email, u.first_name, u.last_name
      FROM users WHERE role IN ('agent', 'sales_agent', 'field_agent') a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.tenant_id = ? 
      AND a.mobile_number = ?
    `, [tenant.id, normalizedMobile]);

    if (!agent) {
      logger.warn('Mobile login failed - agent not found', { mobile: normalizedMobile, tenantCode });
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid mobile number or PIN', code: 'INVALID_CREDENTIALS' }
      });
    }

    // Check if agent is active
    if (agent.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: { message: 'Agent account is not active', code: 'AGENT_INACTIVE' }
      });
    }

    // Verify PIN (supports both hashed and legacy plain text PINs)
    let pinValid = false;
    if (agent.mobile_pin) {
      // Check if PIN is hashed (bcrypt hashes start with $2)
      if (agent.mobile_pin.startsWith('$2')) {
        pinValid = await bcrypt.compare(pin, agent.mobile_pin);
      } else {
        // Legacy plain text PIN - compare directly but flag for migration
        pinValid = agent.mobile_pin === pin;
        if (pinValid) {
          // Auto-migrate to hashed PIN on successful login
          const hashedPin = await bcrypt.hash(pin, 10);
          await runQuery(`UPDATE agents SET mobile_pin = ? WHERE id = ?`, [hashedPin, agent.id]);
          logger.info('Auto-migrated PIN to hashed format', { agentId: agent.id });
        }
      }
    }
    
    if (!pinValid) {
      logger.warn('Mobile login failed - invalid PIN', { mobile: normalizedMobile, agentId: agent.id });
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid mobile number or PIN', code: 'INVALID_CREDENTIALS' }
      });
    }

    // Update last login
    await runQuery(`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [agent.user_id]);

    // Generate JWT token
    const tokenPayload = {
      userId: agent.id,
      tenantId: tenant.id,
      role: agent.role || 'agent',
      type: 'agent',
      mobile: agent.mobile_number
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    // Return success response
    logger.info('Mobile login successful', { 
      agentId: agent.id, 
      mobile: normalizedMobile,
      tenantCode 
    });

    const agentName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'Agent';
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      agent: {
        id: agent.id,
        name: agentName,
        email: agent.email,
        mobile: agent.mobile_number,
        role: agent.role || 'agent',
        status: agent.status
      },
      tenant: {
        id: tenant.id,
        code: tenant.code,
        name: tenant.name
      }
    });

  } catch (error) {
    logger.error('Mobile login error:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: 'An error occurred during login',
        code: 'LOGIN_ERROR'
      }
    });
  }
});

/**
 * POST /api/auth/mobile-change-pin
 * Agent changes their PIN
 */
router.post('/mobile-change-pin', async (req, res) => {
  try {
    const { mobile, oldPin, newPin } = req.body;
    const tenantCode = req.headers['x-tenant-code'];

    // Validation
    if (!mobile || !oldPin || !newPin) {
      return res.status(400).json({
        success: false,
        error: { message: 'Mobile, old PIN, and new PIN are required', code: 'MISSING_FIELDS' }
      });
    }

    if (!/^\d{6}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        error: { message: 'New PIN must be exactly 6 digits', code: 'INVALID_PIN_FORMAT' }
      });
    }

    const normalizedMobile = mobile.replace(/[\s-]/g, '');

    // Get tenant
    const tenant = await getOneQuery(`
      SELECT id FROM tenants WHERE LOWER(code) = LOWER(?)
    `, [tenantCode]);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Tenant not found', code: 'TENANT_NOT_FOUND' }
      });
    }

    // Find agent
    const agent = await getOneQuery(`
      SELECT id, mobile_pin FROM users WHERE role IN ('agent', 'sales_agent', 'field_agent') WHERE tenant_id = ? AND mobile_number = ?
    `, [tenant.id, normalizedMobile]);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent not found', code: 'AGENT_NOT_FOUND' }
      });
    }

    // Verify old PIN (supports both hashed and legacy plain text PINs)
    let oldPinValid = false;
    if (agent.mobile_pin) {
      if (agent.mobile_pin.startsWith('$2')) {
        oldPinValid = await bcrypt.compare(oldPin, agent.mobile_pin);
      } else {
        oldPinValid = agent.mobile_pin === oldPin;
      }
    }
    
    if (!oldPinValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid old PIN', code: 'INVALID_OLD_PIN' }
      });
    }

    // Hash and update new PIN
    const hashedNewPin = await bcrypt.hash(newPin, 10);
    await runQuery(`
      UPDATE agents 
      SET mobile_pin = ?, pin_last_changed = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [hashedNewPin, agent.id]);

    logger.info('PIN changed successfully', { agentId: agent.id });

    res.json({
      success: true,
      message: 'PIN changed successfully'
    });

  } catch (error) {
    logger.error('Change PIN error:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: 'An error occurred while changing PIN',
        code: 'CHANGE_PIN_ERROR'
      }
    });
  }
});

/**
 * POST /api/auth/mobile-reset-pin (Admin only)
 * Reset agent's PIN to default
 */
router.post('/mobile-reset-pin', async (req, res) => {
  try {
    const { agentId, newPin } = req.body;
    const tenantCode = req.headers['x-tenant-code'];

    // TODO: Add admin authentication check

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Agent ID is required', code: 'AGENT_ID_REQUIRED' }
      });
    }

    // Generate secure random PIN if not provided
    const crypto = require('crypto');
    const pinToSet = newPin || crypto.randomInt(100000, 999999).toString();

    if (!/^\d{6}$/.test(pinToSet)) {
      return res.status(400).json({
        success: false,
        error: { message: 'PIN must be exactly 6 digits', code: 'INVALID_PIN_FORMAT' }
      });
    }

    // Get tenant
    const tenant = await getOneQuery(`
      SELECT id FROM tenants WHERE LOWER(code) = LOWER(?)
    `, [tenantCode]);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Tenant not found', code: 'TENANT_NOT_FOUND' }
      });
    }

    // Check if agent exists
    const agent = await getOneQuery(`
      SELECT id FROM agents WHERE id = ? AND tenant_id = ?
    `, [agentId, tenant.id]);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent not found', code: 'AGENT_NOT_FOUND' }
      });
    }

    // Hash and update agent PIN
    const hashedPin = await bcrypt.hash(pinToSet, 10);
    await runQuery(`
      UPDATE agents 
      SET mobile_pin = ?, pin_last_changed = CURRENT_TIMESTAMP 
      WHERE id = ? AND tenant_id = ?
    `, [hashedPin, agentId, tenant.id]);

    logger.info('PIN reset by admin', { agentId });

    res.json({
      success: true,
      message: 'PIN reset successfully. Agent must change PIN on first login.',
      newPin: pinToSet
    });

  } catch (error) {
    logger.error('Reset PIN error:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: 'An error occurred while resetting PIN',
        code: 'RESET_PIN_ERROR'
      }
    });
  }
});

module.exports = router;
