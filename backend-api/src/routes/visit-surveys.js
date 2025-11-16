/**
 * Visit Surveys Routes
 * Manages survey assignment to visits for field operations
 * Allows agents to assign different surveys to spaza shops (businesses) vs individuals
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * GET /api/visit-surveys/available
 * Get available surveys for assignment (filtered by target_type)
 */
router.get('/available', asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const { target_type, brand_id, survey_type } = req.query;

  let query = `
    SELECT 
      s.id, 
      s.title, 
      s.description, 
      s.type, 
      s.category, 
      s.target_type,
      s.brand_id,
      s.survey_type,
      s.status,
      b.name as brand_name,
      COUNT(DISTINCT sr.id) as response_count
    FROM surveys s
    LEFT JOIN brands b ON s.brand_id = b.id
    LEFT JOIN survey_responses sr ON s.id = sr.survey_id
    WHERE s.tenant_id = $1 
      AND s.status = 'active'
  `;
  
  const params = [tenantId];
  let paramIndex = 1;

  if (target_type && target_type !== 'both') {
    query += ` AND (s.target_type = $${++paramIndex} OR s.target_type = 'both')`;
    params.push(target_type);
  }

  if (brand_id) {
    query += ` AND (s.brand_id = $${++paramIndex} OR s.brand_id IS NULL)`;
    params.push(brand_id);
  }

  if (survey_type && ['mandatory', 'adhoc', 'feedback', 'audit', 'brand_specific'].includes(survey_type)) {
    query += ` AND s.survey_type = $${++paramIndex}`;
    params.push(survey_type);
  }

  query += ` GROUP BY s.id, b.name ORDER BY s.survey_type DESC, s.title`;

  const surveys = await getQuery(query, params);

  res.json({
    success: true,
    data: { surveys }
  });
}));

/**
 * POST /api/visit-surveys/assign
 * Assign surveys to a visit
 * Body: { visit_id, surveys: [{ survey_id, subject_type, subject_id, required }] }
 */
router.post('/assign', asyncHandler(async (req, res) => {
  const { getQuery, runQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const userId = req.user?.id || req.userId;
  const { visit_id, surveys } = req.body;

  if (!visit_id || !surveys || !Array.isArray(surveys) || surveys.length === 0) {
    throw new AppError('visit_id and surveys array are required', 400);
  }

  const visit = await getQuery(
    'SELECT id FROM visits WHERE id = $1 AND tenant_id = $2',
    [visit_id, tenantId]
  );

  if (!visit || visit.length === 0) {
    throw new AppError('Visit not found', 404);
  }

  const insertPromises = surveys.map(survey => {
    const { survey_id, subject_type, subject_id, required = false } = survey;

    if (!survey_id || !subject_type) {
      throw new AppError('survey_id and subject_type are required for each survey', 400);
    }

    return runQuery(
      `INSERT INTO visit_surveys 
        (tenant_id, visit_id, survey_id, subject_type, subject_id, required, assigned_by, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'assigned')
       RETURNING *`,
      [tenantId, visit_id, survey_id, subject_type, subject_id, required, userId]
    );
  });

  const results = await Promise.all(insertPromises);

  res.json({
    success: true,
    data: {
      message: 'Surveys assigned successfully',
      assigned_count: results.length
    }
  });
}));

/**
 * GET /api/visit-surveys/:visitId
 * Get all surveys assigned to a visit
 */
router.get('/:visitId', asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const { visitId } = req.params;

  const visitSurveys = await getQuery(
    `SELECT 
      vs.id as visit_survey_id,
      vs.visit_id,
      vs.survey_id,
      vs.subject_type,
      vs.subject_id,
      vs.required,
      vs.status,
      vs.skip_reason,
      vs.assigned_at,
      vs.completed_at,
      s.title as survey_title,
      s.description as survey_description,
      s.type as survey_type,
      s.target_type,
      CASE 
        WHEN vs.subject_type = 'business' THEN c.name
        WHEN vs.subject_type = 'individual' THEN i.name
        ELSE NULL
      END as subject_name
    FROM visit_surveys vs
    INNER JOIN surveys s ON vs.survey_id = s.id
    LEFT JOIN customers c ON vs.subject_type = 'business' AND vs.subject_id = c.id
    LEFT JOIN individuals i ON vs.subject_type = 'individual' AND vs.subject_id = i.id
    WHERE vs.visit_id = $1 AND vs.tenant_id = $2
    ORDER BY vs.required DESC, vs.assigned_at ASC`,
    [visitId, tenantId]
  );

  res.json({
    success: true,
    data: { visit_surveys: visitSurveys }
  });
}));

/**
 * PUT /api/visit-surveys/:visitSurveyId/status
 * Update survey assignment status
 * Body: { status, skip_reason }
 */
router.put('/:visitSurveyId/status', asyncHandler(async (req, res) => {
  const { getQuery, runQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const { visitSurveyId } = req.params;
  const { status, skip_reason } = req.body;

  if (!status) {
    throw new AppError('status is required', 400);
  }

  const validStatuses = ['assigned', 'in_progress', 'completed', 'skipped'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  const existing = await getQuery(
    'SELECT id FROM visit_surveys WHERE id = $1 AND tenant_id = $2',
    [visitSurveyId, tenantId]
  );

  if (!existing || existing.length === 0) {
    throw new AppError('Visit survey assignment not found', 404);
  }

  let query = 'UPDATE visit_surveys SET status = $1, updated_at = CURRENT_TIMESTAMP';
  const params = [status];
  let paramIndex = 1;

  if (status === 'completed') {
    query += `, completed_at = CURRENT_TIMESTAMP`;
  }

  if (status === 'skipped' && skip_reason) {
    query += `, skip_reason = $${++paramIndex}`;
    params.push(skip_reason);
  }

  query += ` WHERE id = $${++paramIndex} AND tenant_id = $${++paramIndex} RETURNING *`;
  params.push(visitSurveyId, tenantId);

  const result = await runQuery(query, params);

  res.json({
    success: true,
    data: {
      message: 'Survey status updated successfully'
    }
  });
}));

/**
 * DELETE /api/visit-surveys/:visitSurveyId
 * Remove survey assignment from visit
 */
router.delete('/:visitSurveyId', asyncHandler(async (req, res) => {
  const { getQuery, runQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const { visitSurveyId } = req.params;

  const existing = await getQuery(
    'SELECT id FROM visit_surveys WHERE id = $1 AND tenant_id = $2',
    [visitSurveyId, tenantId]
  );

  if (!existing || existing.length === 0) {
    throw new AppError('Visit survey assignment not found', 404);
  }

  await runQuery(
    'DELETE FROM visit_surveys WHERE id = $1 AND tenant_id = $2',
    [visitSurveyId, tenantId]
  );

  res.json({
    success: true,
    data: {
      message: 'Survey assignment removed successfully'
    }
  });
}));

/**
 * GET /api/visit-surveys/:visitSurveyId/questions
 * Get survey questions for filling out
 */
router.get('/:visitSurveyId/questions', asyncHandler(async (req, res) => {
  const { getQuery, getOneQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const { visitSurveyId } = req.params;

  const visitSurvey = await getOneQuery(
    `SELECT vs.*, s.title, s.description, s.type
     FROM visit_surveys vs
     INNER JOIN surveys s ON vs.survey_id = s.id
     WHERE vs.id = $1 AND vs.tenant_id = $2`,
    [visitSurveyId, tenantId]
  );

  if (!visitSurvey) {
    throw new AppError('Visit survey assignment not found', 404);
  }

  const questions = await getQuery(
    `SELECT 
      sq.id,
      sq.question_text,
      sq.question_type,
      sq.options,
      sq.is_required,
      sq.sequence_order
     FROM survey_questions sq
     INNER JOIN survey_templates st ON sq.survey_template_id = st.id
     WHERE st.tenant_id = $1
     ORDER BY sq.sequence_order ASC`,
    [tenantId]
  );

  res.json({
    success: true,
    data: {
      visit_survey: visitSurvey,
      questions: questions
    }
  });
}));

/**
 * POST /api/visit-surveys/:visitSurveyId/responses
 * Submit survey responses
 * Body: { answers: [{ question_id, question_text, answer_value }] }
 */
router.post('/:visitSurveyId/responses', asyncHandler(async (req, res) => {
  const { getQuery, getOneQuery, runQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const userId = req.user?.id || req.userId;
  const { visitSurveyId } = req.params;
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    throw new AppError('answers array is required', 400);
  }

  const visitSurvey = await getOneQuery(
    `SELECT vs.*, v.customer_id
     FROM visit_surveys vs
     INNER JOIN visits v ON vs.visit_id = v.id
     WHERE vs.id = $1 AND vs.tenant_id = $2`,
    [visitSurveyId, tenantId]
  );

  if (!visitSurvey) {
    throw new AppError('Visit survey assignment not found', 404);
  }

  const responseResult = await runQuery(
    `INSERT INTO survey_responses 
      (survey_id, customer_id, user_id, visit_survey_id, subject_type, subject_id, survey_version) 
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      visitSurvey.survey_id,
      visitSurvey.customer_id,
      userId,
      visitSurveyId,
      visitSurvey.subject_type,
      visitSurvey.subject_id,
      visitSurvey.survey_version
    ]
  );

  const responseId = responseResult.lastID || responseResult.rows?.[0]?.id;

  if (answers.length > 0) {
    const answerPromises = answers.map(answer => {
      const { question_id, question_text, answer_value } = answer;
      
      return runQuery(
        `INSERT INTO survey_answers 
          (survey_response_id, question_id, question_text, answer_value) 
         VALUES ($1, $2, $3, $4)`,
        [responseId, question_id, question_text, JSON.stringify(answer_value)]
      );
    });

    await Promise.all(answerPromises);
  }

  await runQuery(
    `UPDATE visit_surveys 
     SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND tenant_id = $2`,
    [visitSurveyId, tenantId]
  );

  res.json({
    success: true,
    data: {
      message: 'Survey responses submitted successfully',
      response_id: responseId
    }
  });
}));

/**
 * GET /api/visit-surveys/:visitSurveyId/responses
 * Get survey responses for a visit survey
 */
router.get('/:visitSurveyId/responses', asyncHandler(async (req, res) => {
  const { getQuery, getOneQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const { visitSurveyId } = req.params;

  const response = await getOneQuery(
    `SELECT sr.*
     FROM survey_responses sr
     INNER JOIN visit_surveys vs ON sr.visit_survey_id = vs.id
     WHERE vs.id = $1 AND vs.tenant_id = $2`,
    [visitSurveyId, tenantId]
  );

  if (!response) {
    res.json({
      success: true,
      data: {
        response: null,
        answers: []
      }
    });
    return;
  }

  const answers = await getQuery(
    `SELECT * FROM survey_answers WHERE survey_response_id = $1 ORDER BY created_at ASC`,
    [response.id]
  );

  res.json({
    success: true,
    data: {
      response,
      answers
    }
  });
}));

module.exports = router;
