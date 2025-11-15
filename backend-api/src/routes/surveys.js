const express = require('express');
const router = express.Router();
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware, requireFunction } = require('../middleware/authMiddleware');

// Get all surveys
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  // Lazy-load database functions
  const { getQuery, getOneQuery } = require('../utils/database');
  
  const { page = 1, limit = 10, status, type, category } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT s.*,
           COUNT(DISTINCT sr.id) as response_count,
           COUNT(DISTINCT sa.id) as assignment_count
    FROM surveys s
    LEFT JOIN survey_responses sr ON s.id = sr.survey_id
    LEFT JOIN survey_assignments sa ON s.id = sa.survey_id
    WHERE s.tenant_id = $1
  `;
  
  const params = [req.tenantId];
  let paramIndex = 1;
  
  if (status) {
    query += ` AND s.status = $${++paramIndex}`;
    params.push(status);
  }
  
  if (type) {
    query += ` AND s.type = $${++paramIndex}`;
    params.push(type);
  }
  
  if (category) {
    query += ` AND s.category = $${++paramIndex}`;
    params.push(category);
  }
  
  query += ` GROUP BY s.id ORDER BY s.created_at DESC LIMIT $${++paramIndex} OFFSET $${++paramIndex}`;
  params.push(parseInt(limit), offset);
  
  const surveys = await getQuery(query, params);
  
  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM surveys s WHERE s.tenant_id = $1';
  const countParams = [req.tenantId];
  let countParamIndex = 1;
  
  if (status) {
    countQuery += ` AND s.status = $${++countParamIndex}`;
    countParams.push(status);
  }
  
  if (type) {
    countQuery += ` AND s.type = $${++countParamIndex}`;
    countParams.push(type);
  }
  
  if (category) {
    countQuery += ` AND s.category = $${++countParamIndex}`;
    countParams.push(category);
  }
  
  const totalResult = await getOneQuery(countQuery, countParams);
  const total = totalResult ? totalResult.total : 0;
  
  res.json({
    success: true,
    data: {
      surveys,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// GET /api/surveys/stats - Survey statistics (MUST be before /:id route)
router.get('/stats', asyncHandler(async (req, res) => {
  // Lazy-load database functions
  const { getQuery, getOneQuery } = require('../utils/database');
  
  const tenantId = req.tenantId;
  
  const [surveyCounts, responseCounts, topSurveys] = await Promise.all([
    getOneQuery(`
      SELECT 
        COUNT(*) as total_surveys,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_surveys,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_surveys
      FROM surveys WHERE tenant_id = $1
    `, [tenantId]).then(row => row || {}),
    
    getOneQuery(`
      SELECT 
        COUNT(DISTINCT sr.id) as total_responses,
        COUNT(DISTINCT sr.customer_id) as unique_respondents,
        AVG(CASE WHEN sr.completion_time IS NOT NULL THEN sr.completion_time END) as avg_completion_time
      FROM survey_responses sr
      INNER JOIN surveys s ON sr.survey_id = s.id
      WHERE s.tenant_id = $1
    `, [tenantId]).then(row => row || {}),
    
    getQuery(`
      SELECT 
        s.id, s.title, s.status,
        COUNT(sr.id) as response_count
      FROM surveys s
      LEFT JOIN survey_responses sr ON s.id = sr.survey_id
      WHERE s.tenant_id = $1
      GROUP BY s.id, s.title, s.status
      ORDER BY response_count DESC
      LIMIT 10
    `, [tenantId]).then(rows => rows || [])
  ]);

  res.json({
    success: true,
    data: {
      surveys: surveyCounts,
      responses: {
        ...responseCounts,
        avg_completion_time: parseFloat((responseCounts.avg_completion_time || 0).toFixed(2))
      },
      topSurveys
    }
  });
}));

// GET /api/surveys/trends - Survey trends (MUST be before /:id route)
router.get('/trends', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      trends: []
    }
  });
}));

// GET /api/surveys/all/analytics - Survey analytics (MUST be before /:id route)
router.get('/all/analytics', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      analytics: []
    }
  });
}));

// Get survey by ID
router.get('/:id', requireFunction('surveys', 'view'), asyncHandler(async (req, res) => {
  // Lazy-load database functions
  const { getQuery, getOneQuery } = require('../utils/database');
  
  const { id } = req.params;
  
  const survey = await getOneQuery(`
    SELECT s.*
    FROM surveys s
    WHERE s.id = $1 AND s.tenant_id = $2
  `, [id, req.tenantId]);
  
  if (!survey) {
    throw new AppError('Survey not found', 404);
  }
  
  // Get survey questions
  const questions = await getQuery(`
    SELECT * FROM survey_questions 
    WHERE survey_id = $1 
    ORDER BY question_order
  `, [id]);
  
  // Get survey assignments
  const assignments = await getQuery(`
    SELECT sa.*, u.first_name || ' ' || u.last_name as assignee_name, u.phone as assignee_phone
    FROM survey_assignments sa
    LEFT JOIN users u ON sa.assignee_id = u.id
    WHERE sa.survey_id = $1
  `, [id]);
  
  // Get response summary
  const responseSummary = await getOneQuery(`
    SELECT 
      COUNT(*) as total_responses,
      COUNT(*) as completed_responses,
      0 as in_progress_responses,
      0 as avg_completion_time
    FROM survey_responses sr
    WHERE sr.survey_id = $1
  `, [id]);
  
  res.json({
    success: true,
    data: {
      ...survey,
      questions,
      assignments,
      response_summary: responseSummary || {
        total_responses: 0,
        completed_responses: 0,
        in_progress_responses: 0,
        avg_completion_time: 0
      }
    }
  });
}));

module.exports = router;
