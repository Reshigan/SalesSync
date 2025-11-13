const express = require('express');
const router = express.Router();
const { requireFunction } = require('../middleware/authMiddleware');

// Get all surveys
router.get('/', requireFunction('surveys', 'view'), async (req, res) => {
  try {
    const { getQuery } = require('../database/init');
    
    const surveys = await getQuery(`
      SELECT s.*, u.name as created_by_name
      FROM surveys s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.tenant_id = ?
      ORDER BY s.created_at DESC
    `, [req.tenantId]);
    
    res.json({ surveys });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// Get survey by ID
router.get('/:id', requireFunction('surveys', 'view'), async (req, res) => {
  try {
    const { getOneQuery, getQuery } = require('../database/init');
    const { id } = req.params;
    
    const survey = await getOneQuery(`
      SELECT s.*, u.name as created_by_name
      FROM surveys s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ? AND s.tenant_id = ?
    `, [id, req.tenantId]);
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    // Get survey questions
    const questions = await getQuery(`
      SELECT * FROM survey_questions 
      WHERE survey_id = ? AND tenant_id = ?
      ORDER BY question_order
    `, [id, req.tenantId]);
    
    res.json({ ...survey, questions });
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// Create new survey
router.post('/', requireFunction('surveys', 'create'), async (req, res) => {
  try {
    const { runQuery } = require('../database/init');
    const { title, description, type, category, questions } = req.body;
    
    if (!title || !type || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Title, type, and questions are required' });
    }
    
    // Create survey
    const result = await runQuery(`
      INSERT INTO surveys (
        tenant_id, title, description, type, category, 
        status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [req.tenantId, title, description, type, category, 'draft', req.user.id]);
    
    const surveyId = result.lastInsertRowid;
    
    // Create survey questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      await runQuery(`
        INSERT INTO survey_questions (
          tenant_id, survey_id, question_text, question_type, 
          is_required, question_order, options, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        req.tenantId, surveyId, question.text, question.type, 
        question.required || false, i + 1, JSON.stringify(question.options || [])
      ]);
    }
    
    res.status(201).json({
      id: surveyId,
      message: 'Survey created successfully'
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

// Submit survey response
router.post('/:id/responses', requireFunction('surveys', 'create'), async (req, res) => {
  try {
    const { getOneQuery, runQuery } = require('../database/init');
    const { id } = req.params;
    const { responses } = req.body;
    
    if (!responses || Object.keys(responses).length === 0) {
      return res.status(400).json({ error: 'Survey responses are required' });
    }
    
    // Check if survey exists and is active
    const survey = await getOneQuery(`
      SELECT * FROM surveys 
      WHERE id = ? AND tenant_id = ? AND status = 'active'
    `, [id, req.tenantId]);
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or not active' });
    }
    
    // Create survey response
    const result = await runQuery(`
      INSERT INTO survey_responses (
        tenant_id, survey_id, respondent_id, responses, 
        status, submitted_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [req.tenantId, id, req.user.id, JSON.stringify(responses), 'completed']);
    
    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Survey response submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting survey response:', error);
    res.status(500).json({ error: 'Failed to submit survey response' });
  }
});

module.exports = router;