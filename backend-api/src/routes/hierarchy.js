/**
 * Hierarchy Routes
 * Handles drill-down analytics for customers, vans, and products
 */

const express = require('express');
const router = express.Router();
const hierarchyService = require('../services/hierarchy.service');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

/**
 * GET /api/hierarchy/customers
 * Get customer hierarchy with drill-down
 * Query params: level (region|area|route|customer), parent_id
 */
router.get('/customers', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { level, parent_id } = req.query;

    const hierarchy = await hierarchyService.getCustomerHierarchy(
      tenantId,
      { level, parentId: parent_id }
    );

    res.json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    console.error('Error getting customer hierarchy:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get customer hierarchy'
    });
  }
});

/**
 * GET /api/hierarchy/products
 * Get product hierarchy with drill-down
 * Query params: level (category|brand|product), parent_id
 */
router.get('/products', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { level, parent_id } = req.query;

    const hierarchy = await hierarchyService.getProductHierarchy(
      tenantId,
      { level, parentId: parent_id }
    );

    res.json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    console.error('Error getting product hierarchy:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get product hierarchy'
    });
  }
});

/**
 * GET /api/hierarchy/vans
 * Get van hierarchy with drill-down
 * Query params: level (fleet|van|route), parent_id
 */
router.get('/vans', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { level, parent_id } = req.query;

    const hierarchy = await hierarchyService.getVanHierarchy(
      tenantId,
      { level, parentId: parent_id }
    );

    res.json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    console.error('Error getting van hierarchy:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get van hierarchy'
    });
  }
});

/**
 * GET /api/hierarchy/breadcrumbs/:type/:id
 * Get breadcrumb trail for navigation
 * Params: type (customer|product|van), id (entity ID)
 */
router.get('/breadcrumbs/:type/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { type, id } = req.params;

    if (!['customer', 'product', 'van'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be customer, product, or van'
      });
    }

    const breadcrumbs = await hierarchyService.getBreadcrumbs(
      tenantId,
      type,
      id
    );

    res.json({
      success: true,
      data: breadcrumbs
    });
  } catch (error) {
    console.error('Error getting breadcrumbs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get breadcrumbs'
    });
  }
});

module.exports = router;
