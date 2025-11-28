const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getOneQuery } = require('../utils/database');

// GET /api/db/health - Database health check (no auth required)
router.get('/health', asyncHandler(async (req, res) => {
  const dbInfo = await getOneQuery(`
    SELECT 
      version() as version,
      current_database() as database,
      current_user as user,
      inet_server_addr() as server_address,
      inet_server_port() as server_port
  `);
  
  const isPostgreSQL = dbInfo.version.toLowerCase().includes('postgresql');
  
  res.json({
    success: true,
    database: {
      type: isPostgreSQL ? 'PostgreSQL' : 'Unknown',
      version: dbInfo.version,
      database_name: dbInfo.database,
      user: dbInfo.user,
      server_address: dbInfo.server_address,
      server_port: dbInfo.server_port,
      verified_postgresql: isPostgreSQL
    },
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
