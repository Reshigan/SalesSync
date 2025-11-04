/**
 * Survey Service
 * Service for managing surveys, instances, and responses
 */

const { getDatabase } = require('../database/init');
const { v4: uuidv4 } = require('uuid');

class SurveyService {
  /**
   * Create survey instance from definition
   * @param {string} visitId - Visit ID
   * @param {string} surveyId - Survey definition ID
   * @param {string} brandId - Brand ID (optional, for brand-specific surveys)
   * @returns {Promise<object>} Created survey instance
   */
  async createInstance(visitId, surveyId, brandId = null) {
    const db = getDatabase();
    const id = uuidv4();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO survey_instances (
          id, visit_id, survey_id, brand_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [id, visitId, surveyId, brandId, 'pending'],
        function(err) {
          if (err) {
            console.error('Error creating survey instance:', err);
            return reject(err);
          }

          db.get(
            'SELECT * FROM survey_instances WHERE id = ?',
            [id],
            (err, instance) => {
              if (err) return reject(err);
              resolve(instance);
            }
          );
        }
      );
    });
  }

  /**
   * Validate responses against survey schema
   * @param {string} surveyId - Survey definition ID
   * @param {object} responses - Response data
   * @returns {Promise<object>} Validation result
   */
  async validateResponses(surveyId, responses) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.get(
        'SELECT questions FROM surveys WHERE id = ?',
        [surveyId],
        (err, survey) => {
          if (err) return reject(err);
          if (!survey) return reject(new Error('Survey not found'));

          try {
            const questions = JSON.parse(survey.questions);
            const errors = [];

            questions.forEach(question => {
              const response = responses[question.id];

              if (question.required && !response) {
                errors.push({
                  questionId: question.id,
                  message: `${question.text} is required`
                });
              }

              if (response) {
                switch (question.type) {
                  case 'number':
                    if (isNaN(response)) {
                      errors.push({
                        questionId: question.id,
                        message: `${question.text} must be a number`
                      });
                    }
                    break;

                  case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(response)) {
                      errors.push({
                        questionId: question.id,
                        message: `${question.text} must be a valid email`
                      });
                    }
                    break;

                  case 'choice':
                    if (question.options && !question.options.includes(response)) {
                      errors.push({
                        questionId: question.id,
                        message: `${question.text} must be one of: ${question.options.join(', ')}`
                      });
                    }
                    break;
                }
              }
            });

            resolve({
              valid: errors.length === 0,
              errors
            });
          } catch (error) {
            reject(new Error('Invalid survey schema'));
          }
        }
      );
    });
  }

  /**
   * Submit survey responses
   * @param {string} instanceId - Survey instance ID
   * @param {object} responses - Response data
   * @returns {Promise<object>} Updated survey instance
   */
  async submitResponses(instanceId, responses) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM survey_instances WHERE id = ?',
        [instanceId],
        async (err, instance) => {
          if (err) return reject(err);
          if (!instance) return reject(new Error('Survey instance not found'));

          try {
            const validation = await this.validateResponses(instance.survey_id, responses);
            if (!validation.valid) {
              return reject(new Error(`Validation failed: ${JSON.stringify(validation.errors)}`));
            }
          } catch (error) {
            return reject(error);
          }

          db.run(
            `UPDATE survey_instances 
             SET status = 'completed', 
                 completed_at = datetime('now')
             WHERE id = ?`,
            [instanceId],
            function(err) {
              if (err) return reject(err);

              db.run(
                `INSERT INTO survey_responses (
                  id, tenant_id, survey_id, customer_id, agent_id, responses, submitted_at
                ) SELECT 
                  ?, v.tenant_id, si.survey_id, v.customer_id, v.agent_id, ?, datetime('now')
                FROM survey_instances si
                JOIN visits v ON si.visit_id = v.id
                WHERE si.id = ?`,
                [uuidv4(), JSON.stringify(responses), instanceId],
                (err) => {
                  if (err) console.error('Error storing survey responses:', err);
                }
              );

              db.get(
                'SELECT * FROM survey_instances WHERE id = ?',
                [instanceId],
                (err, updatedInstance) => {
                  if (err) return reject(err);
                  resolve(updatedInstance);
                }
              );
            }
          );
        }
      );
    });
  }

  /**
   * Get survey results
   * @param {string} tenantId - Tenant ID
   * @param {object} filters - Optional filters (survey_id, from_date, to_date)
   * @returns {Promise<array>} Survey results
   */
  async getResults(tenantId, filters = {}) {
    const db = getDatabase();

    let sql = `
      SELECT sr.*, s.title as survey_title, c.name as customer_name,
             u.first_name || ' ' || u.last_name as agent_name
      FROM survey_responses sr
      JOIN surveys s ON sr.survey_id = s.id
      LEFT JOIN customers c ON sr.customer_id = c.id
      LEFT JOIN agents a ON sr.agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE sr.tenant_id = ?
    `;
    const params = [tenantId];

    if (filters.survey_id) {
      sql += ' AND sr.survey_id = ?';
      params.push(filters.survey_id);
    }

    if (filters.from_date) {
      sql += ' AND date(sr.submitted_at) >= date(?)';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND date(sr.submitted_at) <= date(?)';
      params.push(filters.to_date);
    }

    sql += ' ORDER BY sr.submitted_at DESC LIMIT 1000';

    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, results) => {
        if (err) return reject(err);

        const parsedResults = results.map(result => ({
          ...result,
          responses: JSON.parse(result.responses || '{}')
        }));

        resolve(parsedResults);
      });
    });
  }

  /**
   * Get surveys for visit (based on brands selected)
   * @param {string} visitId - Visit ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<array>} Applicable surveys
   */
  async getSurveysForVisit(visitId, tenantId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM visits WHERE id = ? AND tenant_id = ?',
        [visitId, tenantId],
        (err, visit) => {
          if (err) return reject(err);
          if (!visit) return reject(new Error('Visit not found'));

          db.all(
            `SELECT * FROM surveys 
             WHERE tenant_id = ? AND status = 'active'
             ORDER BY is_mandatory DESC, title ASC`,
            [tenantId],
            (err, surveys) => {
              if (err) return reject(err);

              resolve(surveys || []);
            }
          );
        }
      );
    });
  }
}

module.exports = new SurveyService();
