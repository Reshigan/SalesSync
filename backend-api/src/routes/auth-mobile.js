/**
 * Mobile Login Authentication Routes for Agents
 * Agents login using mobile number + 6-digit PIN
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getOneQuery, runQuery } = require('../database/init');

// Simple logger (will be replaced by winston if available)
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

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
      FROM agents a
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

    // Verify PIN
    if (agent.mobile_pin !== pin) {
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
      SELECT id, mobile_pin FROM agents 
      WHERE tenant_id = ? AND mobile_number = ?
    `, [tenant.id, normalizedMobile]);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent not found', code: 'AGENT_NOT_FOUND' }
      });
    }

    // Verify old PIN
    if (agent.mobile_pin !== oldPin) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid old PIN', code: 'INVALID_OLD_PIN' }
      });
    }

    // Update PIN
    await runQuery(`
      UPDATE agents 
      SET mobile_pin = ?, pin_last_changed = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [newPin, agent.id]);

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

    const pinToSet = newPin || '123456'; // Default PIN

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

    // Update agent PIN
    await runQuery(`
      UPDATE agents 
      SET mobile_pin = ?, pin_last_changed = CURRENT_TIMESTAMP 
      WHERE id = ? AND tenant_id = ?
    `, [pinToSet, agentId, tenant.id]);

    logger.info('PIN reset by admin', { agentId });

    res.json({
      success: true,
      message: 'PIN reset successfully',
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
