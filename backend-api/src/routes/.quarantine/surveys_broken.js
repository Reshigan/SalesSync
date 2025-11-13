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
    SELECT s.*, u.first_name || ' ' || u.last_name as created_by_name,
           COUNT(DISTINCT sr.id) as response_count,
           COUNT(DISTINCT sa.id) as assignment_count
    FROM surveys s
    LEFT JOIN users u ON s.created_by = u.id
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
  
  const surveys = getQuery(query, params);
    
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
  
  const totalResult = getOneQuery(countQuery, countParams);
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
});

// Get survey by ID
router.get('/:id', requireFunction, async (req, res) => {
  try {
    const { id } = req.params;
    
    const survey = db.prepare(`
      SELECT s.*, u.name as created_by_name
      FROM surveys s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `).get(id);
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    // Get survey questions
    const questions = db.prepare(`
      SELECT * FROM survey_questions 
      WHERE survey_id = ? 
      ORDER BY question_order
    `).all(id);
    
    // Get survey assignments
    const assignments = db.prepare(`
      SELECT sa.*, u.name as assignee_name, u.phone as assignee_phone
      FROM survey_assignments sa
      LEFT JOIN users u ON sa.assignee_id = u.id
      WHERE sa.survey_id = ?
    `).all(id);
    
    // Get response summary
    const responseSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_responses,
        COUNT(CASE WHEN sr.status = 'completed' THEN 1 END) as completed_responses,
        COUNT(CASE WHEN sr.status = 'in_progress' THEN 1 END) as in_progress_responses,
        ROUND(AVG(sr.completion_time_minutes), 2) as avg_completion_time
      FROM survey_responses sr
      WHERE sr.survey_id = ?
    `).get(id);
    
    res.json({
      ...survey,
      questions,
      assignments,
      response_summary: responseSummary
    });
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// Create new survey
router.post('/', requireFunction, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      start_date,
      end_date,
      is_mandatory,
      target_audience,
      questions
    } = req.body;
    
    // Validate required fields
    if (!title || !type || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Title, type, and questions are required' });
    }
    
    // Validate dates
    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }
    
    // Create survey
    const result = db.prepare(`
      INSERT INTO surveys (
        title, description, type, category, start_date, end_date,
        is_mandatory, target_audience, status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      title, description, type, category, start_date, end_date,
      is_mandatory || false, target_audience, 'draft', req.user.id
    );
    
    const surveyId = result.lastInsertRowid;
    
    // Create survey questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      db.prepare(`
        INSERT INTO survey_questions (
          survey_id, question_text, question_type, is_required,
          question_order, options, validation_rules, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        surveyId, question.text, question.type, question.required || false,
        i + 1, JSON.stringify(question.options || []), 
        JSON.stringify(question.validation || {})
      );
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

// Update survey
router.put('/:id', requireFunction, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      category,
      start_date,
      end_date,
      is_mandatory,
      target_audience,
      status
    } = req.body;
    
    const survey = db.prepare('SELECT * FROM surveys WHERE id = ?').get(id);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    // Update survey
    db.prepare(`
      UPDATE surveys 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          type = COALESCE(?, type),
          category = COALESCE(?, category),
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date),
          is_mandatory = COALESCE(?, is_mandatory),
          target_audience = COALESCE(?, target_audience),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, description, type, category, start_date, end_date,
      is_mandatory, target_audience, status, id
    );
    
    res.json({ message: 'Survey updated successfully' });
  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).json({ error: 'Failed to update survey' });
  }
});

// Assign survey to users
router.post('/:id/assign', requireFunction, async (req, res) => {
  try {
    const { id } = req.params;
    const { assignee_ids, due_date, notes } = req.body;
    
    if (!assignee_ids || assignee_ids.length === 0) {
      return res.status(400).json({ error: 'Assignee IDs are required' });
    }
    
    // Check if survey exists
    const survey = db.prepare('SELECT * FROM surveys WHERE id = ?').get(id);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    // Assign survey to each user
    const assignments = [];
    for (const assigneeId of assignee_ids) {
      // Check if already assigned
      const existing = db.prepare(`
        SELECT * FROM survey_assignments WHERE survey_id = ? AND assignee_id = ?
      `).get(id, assigneeId);
      
      if (!existing) {
        const result = db.prepare(`
          INSERT INTO survey_assignments (
            survey_id, assignee_id, due_date, notes, status, assigned_at
          ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(id, assigneeId, due_date, notes, 'assigned');
        
        assignments.push({ id: result.lastInsertRowid, assignee_id: assigneeId });
      }
    }
    
    res.status(201).json({
      assignments,
      message: `Survey assigned to ${assignments.length} users`
    });
  } catch (error) {
    console.error('Error assigning survey:', error);
    res.status(500).json({ error: 'Failed to assign survey' });
  }
});

// Submit survey response
router.post('/:id/responses', requireFunction, async (req, res) => {
  try {
    const { id } = req.params;
    const { responses, completion_time_minutes } = req.body;
    
    if (!responses || Object.keys(responses).length === 0) {
      return res.status(400).json({ error: 'Survey responses are required' });
    }
    
    // Check if survey exists and is active
    const survey = db.prepare(`
      SELECT * FROM surveys 
      WHERE id = ? AND status = 'active'
    `).get(id);
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or not active' });
    }
    
    // Check if user already responded
    const existingResponse = db.prepare(`
      SELECT * FROM survey_responses 
      WHERE survey_id = ? AND respondent_id = ?
    `).get(id, req.user.id);
    
    if (existingResponse) {
      return res.status(400).json({ error: 'You have already responded to this survey' });
    }
    
    // Create survey response
    const result = db.prepare(`
      INSERT INTO survey_responses (
        survey_id, respondent_id, responses, completion_time_minutes,
        status, submitted_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      id, req.user.id, JSON.stringify(responses), 
      completion_time_minutes, 'completed'
    );
    
    // Update assignment status if exists
    db.prepare(`
      UPDATE survey_assignments 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE survey_id = ? AND assignee_id = ?
    `).run(id, req.user.id);
    
    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Survey response submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting survey response:', error);
    res.status(500).json({ error: 'Failed to submit survey response' });
  }
});

// Get survey responses
router.get('/:id/responses', requireFunction, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const responses = db.prepare(`
      SELECT sr.*, u.name as respondent_name, u.phone as respondent_phone
      FROM survey_responses sr
      LEFT JOIN users u ON sr.respondent_id = u.id
      WHERE sr.survey_id = ?
      ORDER BY sr.submitted_at DESC
      LIMIT ? OFFSET ?
    `).all(id, parseInt(limit), offset);
    
    // Get total count
    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM survey_responses WHERE survey_id = ?
    `).get(id);
    
    res.json({
      responses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    res.status(500).json({ error: 'Failed to fetch survey responses' });
  }
});

// Get survey analytics
router.get('/:id/analytics', requireFunction, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Survey overview
    const overview = db.prepare(`
      SELECT 
        s.title,
        s.type,
        s.category,
        COUNT(DISTINCT sa.id) as total_assignments,
        COUNT(DISTINCT sr.id) as total_responses,
        COUNT(DISTINCT CASE WHEN sr.status = 'completed' THEN sr.id END) as completed_responses,
        ROUND(AVG(sr.completion_time_minutes), 2) as avg_completion_time,
        ROUND((COUNT(DISTINCT sr.id) * 100.0 / NULLIF(COUNT(DISTINCT sa.id), 0)), 2) as response_rate
      FROM surveys s
      LEFT JOIN survey_assignments sa ON s.id = sa.survey_id
      LEFT JOIN survey_responses sr ON s.id = sr.survey_id
      WHERE s.id = ?
      GROUP BY s.id
    `).get(id);
    
    if (!overview) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    // Question analytics
    const questions = db.prepare(`
      SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY question_order
    `).all(id);
    
    const questionAnalytics = [];
    for (const question of questions) {
      const responses = db.prepare(`
        SELECT sr.responses
        FROM survey_responses sr
        WHERE sr.survey_id = ? AND sr.status = 'completed'
      `).all(id);
      
      const questionResponses = responses
        .map(r => JSON.parse(r.responses)[question.id])
        .filter(r => r !== undefined && r !== null);
      
      let analytics = {
        question_id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        total_responses: questionResponses.length
      };
      
      if (question.question_type === 'multiple_choice' || question.question_type === 'single_choice') {
        const options = JSON.parse(question.options || '[]');
        const optionCounts = {};
        options.forEach(option => optionCounts[option] = 0);
        
        questionResponses.forEach(response => {
          if (Array.isArray(response)) {
            response.forEach(r => optionCounts[r] = (optionCounts[r] || 0) + 1);
          } else {
            optionCounts[response] = (optionCounts[response] || 0) + 1;
          }
        });
        
        analytics.option_breakdown = optionCounts;
      } else if (question.question_type === 'rating') {
        const ratings = questionResponses.map(r => parseInt(r)).filter(r => !isNaN(r));
        analytics.average_rating = ratings.length > 0 ? 
          (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2) : 0;
        analytics.rating_distribution = {};
        for (let i = 1; i <= 5; i++) {
          analytics.rating_distribution[i] = ratings.filter(r => r === i).length;
        }
      }
      
      questionAnalytics.push(analytics);
    }
    
    res.json({
      overview,
      question_analytics: questionAnalytics
    });
  } catch (error) {
    console.error('Error fetching survey analytics:', error);
    res.status(500).json({ error: 'Failed to fetch survey analytics' });
  }
});

// Get survey templates
router.get('/templates/list', requireFunction, async (req, res) => {
  try {
    const templates = {
      'customer_satisfaction': {
        title: 'Customer Satisfaction Survey',
        description: 'Measure customer satisfaction with products and services',
        questions: [
          {
            text: 'How satisfied are you with our product/service?',
            type: 'rating',
            required: true,
            options: ['1', '2', '3', '4', '5']
          },
          {
            text: 'What do you like most about our product/service?',
            type: 'text',
            required: false
          },
          {
            text: 'How likely are you to recommend us to others?',
            type: 'rating',
            required: true,
            options: ['1', '2', '3', '4', '5']
          },
          {
            text: 'Which areas need improvement?',
            type: 'multiple_choice',
            required: false,
            options: ['Product Quality', 'Customer Service', 'Pricing', 'Delivery', 'Other']
          }
        ]
      },
      'market_research': {
        title: 'Market Research Survey',
        description: 'Gather market insights and customer preferences',
        questions: [
          {
            text: 'What is your age group?',
            type: 'single_choice',
            required: true,
            options: ['18-25', '26-35', '36-45', '46-55', '55+']
          },
          {
            text: 'Which products do you use regularly?',
            type: 'multiple_choice',
            required: true,
            options: ['Product A', 'Product B', 'Product C', 'Product D']
          },
          {
            text: 'What influences your purchase decisions?',
            type: 'multiple_choice',
            required: true,
            options: ['Price', 'Quality', 'Brand', 'Recommendations', 'Advertising']
          },
          {
            text: 'Additional comments or suggestions',
            type: 'text',
            required: false
          }
        ]
      },
      'employee_feedback': {
        title: 'Employee Feedback Survey',
        description: 'Collect feedback from field agents and staff',
        questions: [
          {
            text: 'How satisfied are you with your current role?',
            type: 'rating',
            required: true,
            options: ['1', '2', '3', '4', '5']
          },
          {
            text: 'What challenges do you face in your daily work?',
            type: 'text',
            required: true
          },
          {
            text: 'Which tools or resources would help you perform better?',
            type: 'multiple_choice',
            required: false,
            options: ['Better Mobile App', 'Training', 'Equipment', 'Support', 'Other']
          },
          {
            text: 'How can we improve your work experience?',
            type: 'text',
            required: false
          }
        ]
      }
    };
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching survey templates:', error);
    res.status(500).json({ error: 'Failed to fetch survey templates' });
  }
});

module.exports = router;