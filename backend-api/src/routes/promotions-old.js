const express = require('express');
const router = express.Router();
const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Campaign:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         campaign_type:
 *           type: string
 *           enum: [sampling, activation, display, education]
 *         start_date:
 *           type: string
 *           format: date
 *         end_date:
 *           type: string
 *           format: date
 *         budget:
 *           type: number
 *         target_activations:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [planned, active, paused, completed, cancelled]
 *     PromoterActivity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         promoter_id:
 *           type: string
 *         campaign_id:
 *           type: string
 *         customer_id:
 *           type: string
 *         activity_date:
 *           type: string
 *           format: date
 *         activity_type:
 *           type: string
 *           enum: [sampling, demo, display_setup, survey]
 *         samples_distributed:
 *           type: integer
 *         contacts_made:
 *           type: integer
 *         surveys_completed:
 *           type: integer
 */

// Apply authentication middleware to all routes
router.use(authTenantMiddleware);
          
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

// Get all promotional campaigns
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, campaign_type, page = 1, limit = 50 } = req.query;
    
    const db = getDatabase();
    let sql = `
      SELECT pc.*, 
             COUNT(pa.id) as activity_count,
             SUM(pa.samples_distributed) as total_samples,
             SUM(pa.contacts_made) as total_contacts
      FROM promotional_campaigns pc
      LEFT JOIN promoter_activities pa ON pc.id = pa.campaign_id
      WHERE pc.tenant_id = ?
    `;
    const params = [tenantId];
    
    if (status) {
      sql += ' AND pc.status = ?';
      params.push(status);
    }
    if (campaign_type) {
      sql += ' AND pc.campaign_type = ?';
      params.push(campaign_type);
    }
    
    sql += ` 
      GROUP BY pc.id 
      ORDER BY pc.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const campaigns = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Get total count
    const totalCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM promotional_campaigns WHERE tenant_id = ?', [tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    // Get summary stats
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_campaigns,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_campaigns,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_campaigns,
          SUM(budget) as total_budget,
          SUM(target_activations) as total_targets
        FROM promotional_campaigns 
        WHERE tenant_id = ?
      `, [tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    res.json({
      success: true,
      data: {
        campaigns,
        total: totalCount,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new promotional campaign
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      name,
      campaign_type,
      start_date,
      end_date,
      budget,
      target_activations,
      status = 'planned'
    } = req.body;
    
    if (!name || !campaign_type || !start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, campaign type, start date, and end date are required' 
      });
    }
    
    const campaignData = {
      tenant_id: tenantId,
      name,
      campaign_type,
      start_date,
      end_date,
      budget: budget ? parseFloat(budget) : null,
      target_activations: target_activations ? parseInt(target_activations) : null,
      status
    };
    
    await insertQuery('promotional_campaigns', campaignData);
    
    const newCampaign = await getOneQuery('promotional_campaigns', { name }, tenantId);
    
    res.status(201).json({
      success: true,
      data: { campaign: newCampaign },
      message: 'Campaign created successfully'
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    
    const campaign = await getOneQuery('promotional_campaigns', { id }, tenantId);
    
    if (!campaign) {
      return res.status(404).json({ 
        success: false, 
        message: 'Campaign not found' 
      });
    }
    
    // Get campaign activities
    const db = getDatabase();
    const activities = await new Promise((resolve, reject) => {
      db.all(`
        SELECT pa.*, u.first_name || ' ' || u.last_name as promoter_name,
               c.name as customer_name
        FROM promoter_activities pa
        LEFT JOIN agents a ON pa.promoter_id = a.id
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN customers c ON pa.customer_id = c.id
        WHERE pa.campaign_id = ? AND pa.tenant_id = ?
        ORDER BY pa.activity_date DESC
      `, [id, tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: { 
        campaign,
        activities
      }
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update campaign
router.put('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const {
      name,
      campaign_type,
      start_date,
      end_date,
      budget,
      target_activations,
      status
    } = req.body;
    
    const existingCampaign = await getOneQuery('promotional_campaigns', { id }, tenantId);
    if (!existingCampaign) {
      return res.status(404).json({ 
        success: false, 
        message: 'Campaign not found' 
      });
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (campaign_type) updateData.campaign_type = campaign_type;
    if (start_date) updateData.start_date = start_date;
    if (end_date) updateData.end_date = end_date;
    if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null;
    if (target_activations !== undefined) updateData.target_activations = target_activations ? parseInt(target_activations) : null;
    if (status) updateData.status = status;
    
    await updateQuery('promotional_campaigns', updateData, { id }, tenantId);
    
    const updatedCampaign = await getOneQuery('promotional_campaigns', { id }, tenantId);
    
    res.json({
      success: true,
      data: { campaign: updatedCampaign },
      message: 'Campaign updated successfully'
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    
    const existingCampaign = await getOneQuery('promotional_campaigns', { id }, tenantId);
    if (!existingCampaign) {
      return res.status(404).json({ 
        success: false, 
        message: 'Campaign not found' 
      });
    }
    
    // Check if campaign has activities
    const db = getDatabase();
    const activityCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM promoter_activities WHERE campaign_id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    if (activityCount > 0) {
      // Soft delete - mark as cancelled
      await updateQuery('promotional_campaigns', { status: 'cancelled' }, { id }, tenantId);
      res.json({
        success: true,
        message: 'Campaign cancelled (has activity history)'
      });
    } else {
      // Hard delete
      await deleteQuery('promotional_campaigns', { id }, tenantId);
      res.json({
        success: true,
        message: 'Campaign deleted successfully'
      });
    }
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get promoter activities
router.get('/activities/list', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { campaign_id, promoter_id, date_from, date_to, page = 1, limit = 50 } = req.query;
    
    const db = getDatabase();
    let sql = `
      SELECT pa.*, u.first_name || ' ' || u.last_name as promoter_name,
             c.name as customer_name, pc.name as campaign_name
      FROM promoter_activities pa
      LEFT JOIN agents a ON pa.promoter_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN customers c ON pa.customer_id = c.id
      LEFT JOIN promotional_campaigns pc ON pa.campaign_id = pc.id
      WHERE pa.tenant_id = ?
    `;
    const params = [tenantId];
    
    if (campaign_id) {
      sql += ' AND pa.campaign_id = ?';
      params.push(campaign_id);
    }
    if (promoter_id) {
      sql += ' AND pa.promoter_id = ?';
      params.push(promoter_id);
    }
    if (date_from) {
      sql += ' AND pa.activity_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      sql += ' AND pa.activity_date <= ?';
      params.push(date_to);
    }
    
    sql += ` ORDER BY pa.activity_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const activities = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create promoter activity
router.post('/activities', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      promoter_id,
      campaign_id,
      customer_id,
      activity_date,
      activity_type,
      samples_distributed = 0,
      contacts_made = 0,
      surveys_completed = 0,
      photos,
      survey_data,
      status = 'completed'
    } = req.body;
    
    if (!promoter_id || !activity_date || !activity_type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Promoter ID, activity date, and activity type are required' 
      });
    }
    
    const activityData = {
      tenant_id: tenantId,
      promoter_id,
      campaign_id,
      customer_id,
      activity_date,
      activity_type,
      samples_distributed: parseInt(samples_distributed),
      contacts_made: parseInt(contacts_made),
      surveys_completed: parseInt(surveys_completed),
      photos: photos ? JSON.stringify(photos) : null,
      survey_data: survey_data ? JSON.stringify(survey_data) : null,
      status
    };
    
    await insertQuery('promoter_activities', activityData);
    
    res.status(201).json({
      success: true,
      message: 'Activity recorded successfully'
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
