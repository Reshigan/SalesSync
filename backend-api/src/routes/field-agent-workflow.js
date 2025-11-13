const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// Get field agent dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const agentId = req.user.userId;

    const db = getDatabase();
    
    // Get today's scheduled visits
    const today = new Date().toISOString().split('T')[0];
    
    db.all(
      `SELECT v.*, c.name as customer_name, c.phone as customer_phone,
              c.latitude, c.longitude, c.address
       FROM visits v
       LEFT JOIN customers c ON v.customer_id = c.id
       WHERE v.agent_id = ? AND v.tenant_id = ? AND date(v.scheduled_date) = date(?)
       ORDER BY v.scheduled_date`,
      [agentId, tenantId, today],
      (err, visits) => {
        if (err) {
          console.error('Error fetching visits:', err);
          return res.status(500).json({ error: 'Failed to fetch dashboard data' });
        }

        // Get pending tasks count
        db.get(
          `SELECT COUNT(*) as pending_tasks
           FROM visit_tasks vt
           INNER JOIN visits v ON vt.visit_id = v.id
           WHERE v.agent_id = ? AND v.tenant_id = ? AND vt.status = 'pending'`,
          [agentId, tenantId],
          (err, taskCount) => {
            if (err) {
              console.error('Error fetching task count:', err);
              // Continue with null task count
            }

            // Get commission summary for current month
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            firstDayOfMonth.setHours(0, 0, 0, 0);

            db.get(
              `SELECT 
                SUM(CASE WHEN status = 'approved' OR status = 'paid' THEN total_amount ELSE 0 END) as earned,
                SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid
               FROM commission_transactions
               WHERE agent_id = ? AND tenant_id = ? AND created_at >= ?`,
              [agentId, tenantId, firstDayOfMonth.toISOString()],
              (err, commissions) => {
                if (err) {
                  console.error('Error fetching commissions:', err);
                  // Continue with null commissions
                }

                // Get today's activity stats
                db.get(
                  `SELECT 
                    (SELECT COUNT(*) FROM visits WHERE agent_id = ? AND tenant_id = ? AND date(check_in_time) = CURRENT_DATE) as visits_completed,
                    (SELECT COUNT(*) FROM board_installations WHERE agent_id = ? AND tenant_id = ? AND date(installation_date) = CURRENT_DATE) as boards_installed,
                    (SELECT COUNT(*) FROM product_distributions WHERE agent_id = ? AND tenant_id = ? AND date(distribution_date) = CURRENT_DATE) as products_distributed`,
                  [agentId, tenantId, agentId, tenantId, agentId, tenantId],
                  (err, stats) => {
                    if (err) {
                      console.error('Error fetching stats:', err);
                      // Continue with null stats
                    }

                    res.json({
                      today_visits: visits,
                      pending_tasks: taskCount?.pending_tasks || 0,
                      commission_summary: {
                        earned: commissions?.earned || 0,
                        pending: commissions?.pending || 0,
                        paid: commissions?.paid || 0
                      },
                      today_stats: {
                        visits_completed: stats?.visits_completed || 0,
                        boards_installed: stats?.boards_installed || 0,
                        products_distributed: stats?.products_distributed || 0
                      },
                      gps_status: 'active' // Would be determined by recent GPS logs in real implementation
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in get dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check in at customer location
router.post('/check-in', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const agentId = req.user.userId;
    const { customer_id, latitude, longitude, accuracy, brands } = req.body;

    if (!customer_id || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Customer ID, latitude, and longitude are required' 
      });
    }

    const db = getDatabase();

    // Create or update visit
    const visitId = uuidv4();
    
    db.run(
      `INSERT INTO visits (
        id, tenant_id, agent_id, customer_id, visit_type, scheduled_date,
        check_in_time, check_in_latitude, check_in_longitude, status, created_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [visitId, tenantId, agentId, customer_id, 'field_visit', latitude, longitude, 'in_progress'],
      function(err) {
        if (err) {
          console.error('Error creating visit:', err);
          return res.status(500).json({ error: 'Failed to check in' });
        }

        // Log GPS
        const gpsLogId = uuidv4();
        db.run(
          `INSERT INTO agent_gps_logs (
            id, tenant_id, agent_id, latitude, longitude, accuracy,
            timestamp, activity_type, reference_type, reference_id
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`,
          [gpsLogId, tenantId, agentId, latitude, longitude, accuracy, 
           'check_in', 'visit', visitId],
          (err) => {
            if (err) {
              console.error('Error logging GPS:', err);
              // Continue anyway
            }
          }
        );

        res.status(201).json({
          visit_id: visitId,
          message: 'Checked in successfully',
          timestamp: new Date().toISOString()
        });
      }
    );
  } catch (error) {
    console.error('Error in check-in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate visit task list
router.get('/visit-list/:visitId', authMiddleware, async (req, res) => {
  try {
    const { visitId } = req.params;
    const tenantId = req.user.tenantId;
    const { brand_ids } = req.query; // Comma-separated brand IDs

    const db = getDatabase();

    // Get visit details
    db.get(
      `SELECT v.*, c.name as customer_name, c.type as customer_type
       FROM visits v
       LEFT JOIN customers c ON v.customer_id = c.id
       WHERE v.id = ? AND v.tenant_id = ?`,
      [visitId, tenantId],
      async (err, visit) => {
        if (err) {
          console.error('Error fetching visit:', err);
          return res.status(500).json({ error: 'Failed to fetch visit' });
        }
        if (!visit) {
          return res.status(404).json({ error: 'Visit not found' });
        }

        // Get existing tasks for this visit
        db.all(
          `SELECT * FROM visit_tasks WHERE visit_id = ? AND tenant_id = ? ORDER BY sequence_order, is_mandatory DESC`,
          [visitId, tenantId],
          (err, existingTasks) => {
            if (err) {
              console.error('Error fetching tasks:', err);
              return res.status(500).json({ error: 'Failed to fetch visit tasks' });
            }

            // If tasks already exist, return them
            if (existingTasks && existingTasks.length > 0) {
              return res.json({
                visit: visit,
                tasks: existingTasks
              });
            }

            // Generate new task list based on brands
            const tasks = [];
            const brands = brand_ids ? brand_ids.split(',') : [];

            // Get mandatory surveys for selected brands
            if (brands.length > 0) {
              const placeholders = brands.map(() => '?').join(',');
              db.all(
                `SELECT * FROM surveys 
                 WHERE tenant_id = ? AND brand_id IN (${placeholders}) AND is_mandatory = 1 AND status = 'active'`,
                [tenantId, ...brands],
                (err, surveys) => {
                  if (err) {
                    console.error('Error fetching surveys:', err);
                    // Continue without surveys
                  }

                  let sequenceOrder = 0;

                  // Add mandatory surveys as tasks
                  if (surveys) {
                    surveys.forEach(survey => {
                      const taskId = uuidv4();
                      tasks.push({
                        id: taskId,
                        tenant_id: tenantId,
                        visit_id: visitId,
                        task_type: 'survey',
                        task_name: survey.title || 'Mandatory Survey',
                        task_description: survey.description,
                        is_mandatory: 1,
                        sequence_order: sequenceOrder++,
                        brand_id: survey.brand_id,
                        survey_id: survey.id,
                        status: 'pending'
                      });
                    });
                  }

                  // Add board placement task
                  const boardTaskId = uuidv4();
                  tasks.push({
                    id: boardTaskId,
                    tenant_id: tenantId,
                    visit_id: visitId,
                    task_type: 'board_placement',
                    task_name: 'Board Placement',
                    task_description: 'Install promotional board at customer location',
                    is_mandatory: 0,
                    sequence_order: sequenceOrder++,
                    status: 'pending'
                  });

                  // Add product distribution task
                  const productTaskId = uuidv4();
                  tasks.push({
                    id: productTaskId,
                    tenant_id: tenantId,
                    visit_id: visitId,
                    task_type: 'product_distribution',
                    task_name: 'Product Distribution',
                    task_description: 'Distribute products to customers',
                    is_mandatory: 0,
                    sequence_order: sequenceOrder++,
                    status: 'pending'
                  });

                  // Add photo documentation task
                  const photoTaskId = uuidv4();
                  tasks.push({
                    id: photoTaskId,
                    tenant_id: tenantId,
                    visit_id: visitId,
                    task_type: 'photo_documentation',
                    task_name: 'Photo Documentation',
                    task_description: 'Take photos of store and products',
                    is_mandatory: 0,
                    sequence_order: sequenceOrder++,
                    status: 'pending'
                  });

                  // Insert all tasks
                  const insertPromises = tasks.map(task => {
                    return new Promise((resolve, reject) => {
                      db.run(
                        `INSERT INTO visit_tasks (
                          id, tenant_id, visit_id, task_type, task_name, task_description,
                          is_mandatory, sequence_order, brand_id, survey_id, board_id, product_id,
                          status, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [
                          task.id, task.tenant_id, task.visit_id, task.task_type,
                          task.task_name, task.task_description, task.is_mandatory,
                          task.sequence_order, task.brand_id || null, task.survey_id || null,
                          task.board_id || null, task.product_id || null, task.status
                        ],
                        (err) => {
                          if (err) reject(err);
                          else resolve();
                        }
                      );
                    });
                  });

                  Promise.all(insertPromises)
                    .then(() => {
                      res.json({
                        visit: visit,
                        tasks: tasks
                      });
                    })
                    .catch(err => {
                      console.error('Error inserting tasks:', err);
                      res.status(500).json({ error: 'Failed to create visit tasks' });
                    });
                }
              );
            } else {
              // No brands selected, return basic task list
              res.json({
                visit: visit,
                tasks: tasks
              });
            }
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in get visit list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete visit task
router.post('/visit-task/complete', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const agentId = req.user.userId;
    const { task_id, result_data } = req.body;

    if (!task_id) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    const db = getDatabase();

    db.run(
      `UPDATE visit_tasks SET
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        completed_by = ?,
        result_data = ?
      WHERE id = ? AND tenant_id = ?`,
      [agentId, result_data ? JSON.stringify(result_data) : null, task_id, tenantId],
      function(err) {
        if (err) {
          console.error('Error completing task:', err);
          return res.status(500).json({ error: 'Failed to complete task' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }

        // Fetch updated task
        db.get(
          'SELECT * FROM visit_tasks WHERE id = ?',
          [task_id],
          (err, task) => {
            if (err) {
              console.error('Error fetching task:', err);
              return res.status(500).json({ error: 'Task completed but failed to fetch' });
            }
            res.json({
              message: 'Task completed successfully',
              task: task
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in complete task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check out from visit
router.post('/check-out', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const agentId = req.user.userId;
    const { visit_id, latitude, longitude, accuracy, notes, rating } = req.body;

    if (!visit_id) {
      return res.status(400).json({ error: 'Visit ID is required' });
    }

    const db = getDatabase();

    // Check if all mandatory tasks are completed
    db.get(
      `SELECT COUNT(*) as incomplete_mandatory
       FROM visit_tasks
       WHERE visit_id = ? AND tenant_id = ? AND is_mandatory = 1 AND status != 'completed'`,
      [visit_id, tenantId],
      (err, result) => {
        if (err) {
          console.error('Error checking tasks:', err);
          return res.status(500).json({ error: 'Failed to check out' });
        }

        if (result.incomplete_mandatory > 0) {
          return res.status(400).json({ 
            error: 'Cannot check out. Mandatory tasks are not completed.',
            incomplete_tasks: result.incomplete_mandatory
          });
        }

        // Update visit
        db.run(
          `UPDATE visits SET
            check_out_time = CURRENT_TIMESTAMP,
            check_out_latitude = ?,
            check_out_longitude = ?,
            status = 'completed',
            notes = COALESCE(?, notes),
            rating = ?
          WHERE id = ? AND tenant_id = ? AND agent_id = ?`,
          [latitude, longitude, notes, rating, visit_id, tenantId, agentId],
          function(err) {
            if (err) {
              console.error('Error checking out:', err);
              return res.status(500).json({ error: 'Failed to check out' });
            }
            if (this.changes === 0) {
              return res.status(404).json({ error: 'Visit not found or already completed' });
            }

            // Log GPS
            if (latitude && longitude) {
              const gpsLogId = uuidv4();
              db.run(
                `INSERT INTO agent_gps_logs (
                  id, tenant_id, agent_id, latitude, longitude, accuracy,
                  timestamp, activity_type, reference_type, reference_id
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`,
                [gpsLogId, tenantId, agentId, latitude, longitude, accuracy, 
                 'check_out', 'visit', visit_id],
                (err) => {
                  if (err) {
                    console.error('Error logging GPS:', err);
                    // Continue anyway
                  }
                }
              );
            }

            res.json({
              message: 'Checked out successfully',
              visit_id: visit_id,
              timestamp: new Date().toISOString()
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in check-out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get agent's visits
router.get('/my-visits', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const agentId = req.user.userId;
    const { status, from_date, to_date } = req.query;

    let query = `
      SELECT v.*, c.name as customer_name, c.phone as customer_phone, c.address
      FROM visits v
      LEFT JOIN customers c ON v.customer_id = c.id
      WHERE v.agent_id = ? AND v.tenant_id = ?
    `;
    const params = [agentId, tenantId];

    if (status) {
      query += ' AND v.status = ?';
      params.push(status);
    }
    if (from_date) {
      query += ' AND date(v.scheduled_date) >= date(?)';
      params.push(from_date);
    }
    if (to_date) {
      query += ' AND date(v.scheduled_date) <= date(?)';
      params.push(to_date);
    }

    query += ' ORDER BY v.scheduled_date DESC';

    const db = getDatabase();
    db.all(query, params, (err, visits) => {
      if (err) {
        console.error('Error fetching visits:', err);
        return res.status(500).json({ error: 'Failed to fetch visits' });
      }
      res.json(visits);
    });
  } catch (error) {
    console.error('Error in get visits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
