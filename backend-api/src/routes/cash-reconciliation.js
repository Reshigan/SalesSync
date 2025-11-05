/**
 * Cash Reconciliation Routes
 * Handles cash collection tracking, reconciliation, and variance management
 */

const express = require('express');
const router = express.Router();
const cashReconciliationService = require('../services/cash-reconciliation.service');


/**
 * POST /api/cash-reconciliation/start
 * Start a new cash collection for an agent
 */
router.post('/start', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { agent_id, opening_float } = req.body;

    if (!agent_id || opening_float === undefined) {
      return res.status(400).json({
        success: false,
        message: 'agent_id and opening_float are required'
      });
    }

    const result = await cashReconciliationService.startCashCollection(
      tenantId,
      agent_id,
      opening_float
    );

    res.json(result);
  } catch (error) {
    console.error('Error starting cash collection:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start cash collection'
    });
  }
});

/**
 * POST /api/cash-reconciliation/record-sale
 * Record a cash sale and link to collection
 */
router.post('/record-sale', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { order_id, collection_id, cash_received, change_given } = req.body;

    if (!order_id || !collection_id || cash_received === undefined) {
      return res.status(400).json({
        success: false,
        message: 'order_id, collection_id, and cash_received are required'
      });
    }

    const result = await cashReconciliationService.recordCashSale(
      tenantId,
      order_id,
      collection_id,
      cash_received,
      change_given || 0
    );

    res.json(result);
  } catch (error) {
    console.error('Error recording cash sale:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record cash sale'
    });
  }
});

/**
 * POST /api/cash-reconciliation/record-expense
 * Record an expense during collection
 */
router.post('/record-expense', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { collection_id, expense_type, amount, description, receipt_photo } = req.body;

    if (!collection_id || !expense_type || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'collection_id, expense_type, and amount are required'
      });
    }

    const result = await cashReconciliationService.recordExpense(
      tenantId,
      collection_id,
      { expense_type, amount, description, receipt_photo }
    );

    res.json(result);
  } catch (error) {
    console.error('Error recording expense:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record expense'
    });
  }
});

/**
 * POST /api/cash-reconciliation/submit
 * Submit cash collection with denomination breakdown
 */
router.post('/submit', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { collection_id, denominations, notes } = req.body;

    if (!collection_id || !denominations || !Array.isArray(denominations)) {
      return res.status(400).json({
        success: false,
        message: 'collection_id and denominations array are required'
      });
    }

    const result = await cashReconciliationService.submitCashCollection(
      tenantId,
      collection_id,
      denominations,
      notes
    );

    res.json(result);
  } catch (error) {
    console.error('Error submitting cash collection:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit cash collection'
    });
  }
});

/**
 * POST /api/cash-reconciliation/approve/:collectionId
 * Approve cash collection (manager action)
 */
router.post('/approve/:collectionId', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { collectionId } = req.params;
    const approverId = req.user.userId;

    const result = await cashReconciliationService.approveCashCollection(
      tenantId,
      collectionId,
      approverId
    );

    res.json(result);
  } catch (error) {
    console.error('Error approving cash collection:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve cash collection'
    });
  }
});

/**
 * GET /api/cash-reconciliation/:collectionId
 * Get cash collection details
 */
router.get('/:collectionId', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { collectionId } = req.params;

    const collection = await cashReconciliationService.getCashCollection(
      tenantId,
      collectionId
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Cash collection not found'
      });
    }

    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Error getting cash collection:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get cash collection'
    });
  }
});

/**
 * GET /api/cash-reconciliation/agent/:agentId
 * Get agent's cash collections for a date range
 */
router.get('/agent/:agentId', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { agentId } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date query parameters are required'
      });
    }

    const collections = await cashReconciliationService.getAgentCashCollections(
      tenantId,
      agentId,
      start_date,
      end_date
    );

    res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error('Error getting agent cash collections:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get agent cash collections'
    });
  }
});

/**
 * GET /api/cash-reconciliation/summary
 * Get reconciliation summary for a date range
 */
router.get('/summary', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { start_date, end_date, agent_id, status } = req.query;

    const summary = await cashReconciliationService.getReconciliationSummary(
      tenantId,
      { start_date, end_date, agent_id, status }
    );

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting reconciliation summary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get reconciliation summary'
    });
  }
});

module.exports = router;
