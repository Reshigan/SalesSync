const express = require('express');
const router = express.Router();
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    
    const response = await getOneQuery(`
      SELECT sr.*, s.title as survey_title, v.visit_date, c.name as customer_name
      FROM survey_responses sr
      LEFT JOIN surveys s ON sr.survey_id = s.id
      LEFT JOIN visits v ON sr.visit_id = v.id
      LEFT JOIN customers c ON v.customer_id = c.id
      WHERE sr.id = $1 AND sr.tenant_id = $2
    `, [id, tenantId]);
    
    res.json({ success: true, data: response || null });
  } catch (error) {
    console.error('Error fetching survey response:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:responseId/answers/:answerId', async (req, res) => {
  try {
    const { responseId, answerId } = req.params;
    const tenantId = req.user.tenantId;
    
    const answer = await getOneQuery(`
      SELECT sa.*, sq.question_text, sq.question_type
      FROM survey_answers sa
      LEFT JOIN survey_questions sq ON sa.question_id = sq.id
      WHERE sa.id = $1 AND sa.response_id = $2 AND sa.tenant_id = $3
    `, [answerId, responseId, tenantId]);
    
    res.json({ success: true, data: answer || null });
  } catch (error) {
    console.error('Error fetching survey answer:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:surveyId/analysis', async (req, res) => {
  try {
    const { surveyId } = req.params;
    const tenantId = req.user.tenantId;
    
    const analysis = await getQuery(`
      SELECT 
        COUNT(DISTINCT sr.id) as total_responses,
        COUNT(DISTINCT sr.visit_id) as total_visits,
        AVG(CASE WHEN sr.completion_status = 'completed' THEN 1 ELSE 0 END) as completion_rate
      FROM survey_responses sr
      WHERE sr.survey_id = $1 AND sr.tenant_id = $2
    `, [surveyId, tenantId]);
    
    res.json({ success: true, data: analysis[0] || {} });
  } catch (error) {
    console.error('Error fetching survey analysis:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:surveyId/comparison', async (req, res) => {
  try {
    const { surveyId } = req.params;
    const tenantId = req.user.tenantId;
    
    const responses = await getQuery(`
      SELECT sr.*, v.visit_date, c.name as customer_name
      FROM survey_responses sr
      LEFT JOIN visits v ON sr.visit_id = v.id
      LEFT JOIN customers c ON v.customer_id = c.id
      WHERE sr.survey_id = $1 AND sr.tenant_id = $2
      ORDER BY sr.created_at DESC
      LIMIT 100
    `, [surveyId, tenantId]);
    
    res.json({ success: true, data: { responses: responses || [] } });
  } catch (error) {
    console.error('Error fetching survey comparison:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
