const express = require('express');
const router = express.Router();
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware, requireFunction } = require('../middleware/authMiddleware');

// Get all surveys
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  // Lazy-load database functions
  const { getQuery, getOneQuery } = require('../database/init');
  
  const { page = 1, limit = 10, status, type, category } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT s.*,
           COUNT(DISTINCT sr.id) as response_count,
           COUNT(DISTINCT sa.id) as assignment_count
    FROM surveys s
    LEFT JOIN survey_responses sr ON s.id = sr.survey_id
    LEFT JOIN survey_assignments sa ON s.id = sa.survey_id
    WHERE s.tenant_id = ?
  `;
  
  const params = [req.tenantId];
  
  if (status) {
    query += ' AND s.status = ?';
    params.push(status);
  }
  
  if (type) {
    query += ' AND s.type = ?';
    params.push(type);
  }
  
  if (category) {
    query += ' AND s.category = ?';
    params.push(category);
  }
  
  query += ' GROUP BY s.id ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  const surveys = await getQuery(query, params);
  
  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM surveys s WHERE s.tenant_id = ?';
  const countParams = [req.tenantId];
  
  if (status) {
    countQuery += ' AND s.status = ?';
    countParams.push(status);
  }
  
  if (type) {
    countQuery += ' AND s.type = ?';
    countParams.push(type);
  }
  
  if (category) {
    countQuery += ' AND s.category = ?';
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

// Get survey by ID
router.get('/:id', requireFunction('surveys', 'view'), asyncHandler(async (req, res) => {
  // Lazy-load database functions
  const { getQuery, getOneQuery } = require('../database/init');
  
  const { id } = req.params;
  
  const survey = await getOneQuery(`
    SELECT s.*
    FROM surveys s
    WHERE s.id = ? AND s.tenant_id = ?
  `, [id, req.tenantId]);
  
  if (!survey) {
    throw new AppError('Survey not found', 404);
  }
  
  // Get survey questions
  const questions = getQuery(`
    SELECT * FROM survey_questions 
    WHERE survey_id = ? 
    ORDER BY question_order
  `, [id]);
  
  // Get survey assignments
  const assignments = getQuery(`
    SELECT sa.*, u.first_name || ' ' || u.last_name as assignee_name, u.phone as assignee_phone
    FROM survey_assignments sa
    LEFT JOIN users u ON sa.assignee_id = u.id
    WHERE sa.survey_id = ?
  `, [id]);
  
  // Get response summary
  const responseSummary = await getOneQuery(`
    SELECT 
      COUNT(*) as total_responses,
      COUNT(*) as completed_responses,
      0 as in_progress_responses,
      0 as avg_completion_time
    FROM survey_responses sr
    WHERE sr.survey_id = ?
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