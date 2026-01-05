/**
 * Customer Routes - Main Entry Point
 * Combines all customer-related route modules
 */

const express = require('express');
const router = express.Router();

// Import sub-route modules
const coreRoutes = require('./core');
const statsRoutes = require('./stats');
const relatedRoutes = require('./related');
const bulkRoutes = require('./bulk');

// Mount sub-routes
router.use('/', coreRoutes);
router.use('/', statsRoutes);
router.use('/', relatedRoutes);
router.use('/', bulkRoutes);

module.exports = router;
