const express = require('express');
const router = express.Router();

// Lazy load database functions to avoid circular dependencies
const getDatabase = () => require('../database/database');
const { getQuery, getOneQuery, insertQuery, updateQuery, deleteQuery } = (() => {
  try {
    return require('../database/queries');
  } catch (error) {
    console.warn('Queries module not found, using fallback functions');
    return {
      getQuery: (table, conditions = {}, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            params.push(conditions[key]);
          });
          
          db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      },
      getOneQuery: (table, conditions, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            params.push(conditions[key]);
          });
          
          sql += ' LIMIT 1';
          
          db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      insertQuery: (table, data) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          const keys = Object.keys(data);
          const values = Object.values(data);
          const placeholders = keys.map(() => '?').join(', ');
          
          const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
          
          db.run(sql, values, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
          });
        });
      },
      updateQuery: (table, data, conditions, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
          const values = Object.values(data);
          
          let sql = `UPDATE ${table} SET ${setClause}`;
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
            values.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            values.push(conditions[key]);
          });
          
          db.run(sql, values, function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          });
        });
      },
      deleteQuery: (table, conditions, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          let sql = `DELETE FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            params.push(conditions[key]);
          });
          
          db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          });
        });
      }
    };
  }
})();

// Get all surveys
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { survey_type, status } = req.query;
    
    const db = getDatabase();
    let sql = `
      SELECT s.*, COUNT(sr.id) as response_count
      FROM surveys s
      LEFT JOIN survey_responses sr ON s.id = sr.survey_id
      WHERE s.tenant_id = ?
    `;
    const params = [tenantId];
    
    if (survey_type) {
      sql += ' AND s.survey_type = ?';
      params.push(survey_type);
    }
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    
    sql += ' GROUP BY s.id ORDER BY s.created_at DESC';
    
    const surveys = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          questions: row.questions ? JSON.parse(row.questions) : [],
          target_audience: row.target_audience ? JSON.parse(row.target_audience) : null
        })));
      });
    });
    
    res.json({
      success: true,
      data: { surveys }
    });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new survey
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      title,
      description,
      survey_type = 'adhoc',
      questions,
      target_audience,
      status = 'active'
    } = req.body;
    
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and questions are required' 
      });
    }
    
    const surveyData = {
      tenant_id: tenantId,
      title,
      description,
      survey_type,
      questions: JSON.stringify(questions),
      target_audience: target_audience ? JSON.stringify(target_audience) : null,
      status
    };
    
    await insertQuery('surveys', surveyData);
    
    const newSurvey = await getOneQuery('surveys', { title }, tenantId);
    
    res.status(201).json({
      success: true,
      data: { survey: newSurvey },
      message: 'Survey created successfully'
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get survey by ID
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    
    const survey = await getOneQuery('surveys', { id }, tenantId);
    
    if (!survey) {
      return res.status(404).json({ 
        success: false, 
        message: 'Survey not found' 
      });
    }
    
    // Parse JSON fields
    survey.questions = survey.questions ? JSON.parse(survey.questions) : [];
    survey.target_audience = survey.target_audience ? JSON.parse(survey.target_audience) : null;
    
    // Get responses
    const db = getDatabase();
    const responses = await new Promise((resolve, reject) => {
      db.all(`
        SELECT sr.*, c.name as customer_name, u.first_name || ' ' || u.last_name as agent_name
        FROM survey_responses sr
        LEFT JOIN customers c ON sr.customer_id = c.id
        LEFT JOIN agents a ON sr.agent_id = a.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE sr.survey_id = ? AND sr.tenant_id = ?
        ORDER BY sr.submitted_at DESC
      `, [id, tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          responses: row.responses ? JSON.parse(row.responses) : {}
        })));
      });
    });
    
    res.json({
      success: true,
      data: { 
        survey,
        responses
      }
    });
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update survey
router.put('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const {
      title,
      description,
      survey_type,
      questions,
      target_audience,
      status
    } = req.body;
    
    const existingSurvey = await getOneQuery('surveys', { id }, tenantId);
    if (!existingSurvey) {
      return res.status(404).json({ 
        success: false, 
        message: 'Survey not found' 
      });
    }
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (survey_type) updateData.survey_type = survey_type;
    if (questions) updateData.questions = JSON.stringify(questions);
    if (target_audience !== undefined) updateData.target_audience = target_audience ? JSON.stringify(target_audience) : null;
    if (status) updateData.status = status;
    
    await updateQuery('surveys', updateData, { id }, tenantId);
    
    const updatedSurvey = await getOneQuery('surveys', { id }, tenantId);
    
    res.json({
      success: true,
      data: { survey: updatedSurvey },
      message: 'Survey updated successfully'
    });
  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete survey
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    
    const existingSurvey = await getOneQuery('surveys', { id }, tenantId);
    if (!existingSurvey) {
      return res.status(404).json({ 
        success: false, 
        message: 'Survey not found' 
      });
    }
    
    // Check if survey has responses
    const db = getDatabase();
    const responseCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM survey_responses WHERE survey_id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    if (responseCount > 0) {
      // Soft delete - mark as inactive
      await updateQuery('surveys', { status: 'inactive' }, { id }, tenantId);
      res.json({
        success: true,
        message: 'Survey marked as inactive (has responses)'
      });
    } else {
      // Hard delete
      await deleteQuery('surveys', { id }, tenantId);
      res.json({
        success: true,
        message: 'Survey deleted successfully'
      });
    }
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Submit survey response
router.post('/:id/responses', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const {
      customer_id,
      agent_id,
      responses
    } = req.body;
    
    if (!customer_id || !agent_id || !responses) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer ID, agent ID, and responses are required' 
      });
    }
    
    // Validate survey exists
    const survey = await getOneQuery('surveys', { id }, tenantId);
    if (!survey) {
      return res.status(404).json({ 
        success: false, 
        message: 'Survey not found' 
      });
    }
    
    // Validate customer exists
    const customer = await getOneQuery('customers', { id: customer_id }, tenantId);
    if (!customer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    // Validate agent exists
    const agent = await getOneQuery('agents', { id: agent_id }, tenantId);
    if (!agent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Agent not found' 
      });
    }
    
    const responseData = {
      tenant_id: tenantId,
      survey_id: id,
      customer_id,
      agent_id,
      responses: JSON.stringify(responses)
    };
    
    await insertQuery('survey_responses', responseData);
    
    res.status(201).json({
      success: true,
      message: 'Survey response submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting survey response:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get survey responses
router.get('/:id/responses', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { agent_id, customer_id } = req.query;
    
    const db = getDatabase();
    let sql = `
      SELECT sr.*, c.name as customer_name, u.first_name || ' ' || u.last_name as agent_name
      FROM survey_responses sr
      LEFT JOIN customers c ON sr.customer_id = c.id
      LEFT JOIN agents a ON sr.agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE sr.survey_id = ? AND sr.tenant_id = ?
    `;
    const params = [id, tenantId];
    
    if (agent_id) {
      sql += ' AND sr.agent_id = ?';
      params.push(agent_id);
    }
    if (customer_id) {
      sql += ' AND sr.customer_id = ?';
      params.push(customer_id);
    }
    
    sql += ' ORDER BY sr.submitted_at DESC';
    
    const responses = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          responses: row.responses ? JSON.parse(row.responses) : {}
        })));
      });
    });
    
    res.json({
      success: true,
      data: { responses }
    });
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get survey analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    
    const survey = await getOneQuery('surveys', { id }, tenantId);
    if (!survey) {
      return res.status(404).json({ 
        success: false, 
        message: 'Survey not found' 
      });
    }
    
    const db = getDatabase();
    
    // Get response statistics
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_responses,
          COUNT(DISTINCT customer_id) as unique_customers,
          COUNT(DISTINCT agent_id) as unique_agents,
          MIN(submitted_at) as first_response,
          MAX(submitted_at) as last_response
        FROM survey_responses 
        WHERE survey_id = ? AND tenant_id = ?
      `, [id, tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Get all responses for analysis
    const responses = await new Promise((resolve, reject) => {
      db.all(`
        SELECT responses FROM survey_responses 
        WHERE survey_id = ? AND tenant_id = ?
      `, [id, tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => JSON.parse(row.responses)));
      });
    });
    
    // Analyze responses by question
    const questions = JSON.parse(survey.questions);
    const analytics = questions.map(question => {
      const questionResponses = responses.map(r => r[question.id]).filter(r => r !== undefined);
      
      if (question.type === 'multiple_choice' || question.type === 'single_choice') {
        const counts = {};
        questionResponses.forEach(response => {
          if (Array.isArray(response)) {
            response.forEach(option => {
              counts[option] = (counts[option] || 0) + 1;
            });
          } else {
            counts[response] = (counts[response] || 0) + 1;
          }
        });
        
        return {
          question_id: question.id,
          question_text: question.text,
          type: question.type,
          total_responses: questionResponses.length,
          option_counts: counts
        };
      } else if (question.type === 'rating') {
        const ratings = questionResponses.map(r => parseInt(r)).filter(r => !isNaN(r));
        const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        
        return {
          question_id: question.id,
          question_text: question.text,
          type: question.type,
          total_responses: ratings.length,
          average_rating: average.toFixed(2),
          rating_distribution: ratings.reduce((acc, rating) => {
            acc[rating] = (acc[rating] || 0) + 1;
            return acc;
          }, {})
        };
      } else {
        return {
          question_id: question.id,
          question_text: question.text,
          type: question.type,
          total_responses: questionResponses.length,
          sample_responses: questionResponses.slice(0, 5)
        };
      }
    });
    
    res.json({
      success: true,
      data: {
        survey: {
          ...survey,
          questions: JSON.parse(survey.questions)
        },
        stats,
        analytics
      }
    });
  } catch (error) {
    console.error('Error fetching survey analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
