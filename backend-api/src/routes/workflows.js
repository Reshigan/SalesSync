const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireFunction, requireRole } = require('../middleware/authMiddleware');

// Get custom workflows
router.get('/', requireFunction('workflows', 'view'), async (req, res) => {
  try {
    const { status, workflow_type, category } = req.query;
    
    let query = `
      SELECT 
        cw.*,
        u.name as created_by_name,
        COUNT(we.id) as execution_count,
        MAX(we.executed_at) as last_executed
      FROM custom_workflows cw
      LEFT JOIN users u ON cw.created_by = u.id
      LEFT JOIN workflow_executions we ON cw.id = we.workflow_id
      WHERE cw.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (status) {
      query += ' AND cw.status = ?';
      params.push(status);
    }
    
    if (workflow_type) {
      query += ' AND cw.workflow_type = ?';
      params.push(workflow_type);
    }
    
    if (category) {
      query += ' AND cw.category = ?';
      params.push(category);
    }
    
    query += ' GROUP BY cw.id ORDER BY cw.created_at DESC';
    
    const workflows = await db.all(query, params);
    
    res.json({
      success: true,
      data: workflows.map(workflow => ({
        ...workflow,
        workflow_steps: workflow.workflow_steps ? JSON.parse(workflow.workflow_steps) : [],
        trigger_conditions: workflow.trigger_conditions ? JSON.parse(workflow.trigger_conditions) : {},
        configuration: workflow.configuration ? JSON.parse(workflow.configuration) : {}
      }))
    });
  } catch (error) {
    console.error('Error fetching custom workflows:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get workflow by ID
router.get('/:id', requireFunction('workflows', 'view'), async (req, res) => {
  try {
    const workflow = await db.get(`
      SELECT 
        cw.*,
        u.name as created_by_name
      FROM custom_workflows cw
      LEFT JOIN users u ON cw.created_by = u.id
      WHERE cw.id = ? AND cw.tenant_id = ?
    `, [req.params.id, req.user.tenantId]);
    
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    
    // Get execution history
    const executions = await db.all(`
      SELECT 
        we.*,
        u.name as executed_by_name
      FROM workflow_executions we
      LEFT JOIN users u ON we.executed_by = u.id
      WHERE we.workflow_id = ?
      ORDER BY we.executed_at DESC
      LIMIT 10
    `, [req.params.id]);
    
    res.json({
      success: true,
      data: {
        ...workflow,
        workflow_steps: workflow.workflow_steps ? JSON.parse(workflow.workflow_steps) : [],
        trigger_conditions: workflow.trigger_conditions ? JSON.parse(workflow.trigger_conditions) : {},
        configuration: workflow.configuration ? JSON.parse(workflow.configuration) : {},
        recent_executions: executions.map(exec => ({
          ...exec,
          execution_result: exec.execution_result ? JSON.parse(exec.execution_result) : {},
          error_details: exec.error_details ? JSON.parse(exec.error_details) : null
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create custom workflow
router.post('/', requireFunction('workflows', 'create'), async (req, res) => {
  try {
    const {
      name,
      description,
      workflow_type,
      category,
      workflow_steps,
      trigger_conditions,
      configuration,
      is_active = true
    } = req.body;
    
    if (!name || !workflow_type || !workflow_steps) {
      return res.status(400).json({
        success: false,
        error: 'Name, workflow type, and workflow steps are required'
      });
    }
    
    const workflowId = require('crypto').randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO custom_workflows (
        id, tenant_id, name, description, workflow_type, category,
        workflow_steps, trigger_conditions, configuration, is_active,
        created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      workflowId,
      req.user.tenantId,
      name,
      description,
      workflow_type,
      category,
      JSON.stringify(workflow_steps),
      JSON.stringify(trigger_conditions || {}),
      JSON.stringify(configuration || {}),
      is_active ? 1 : 0,
      req.user.userId,
      'draft'
    ]);
    
    const newWorkflow = await db.get(`
      SELECT * FROM custom_workflows WHERE id = ?
    `, [workflowId]);
    
    res.status(201).json({
      success: true,
      data: {
        ...newWorkflow,
        workflow_steps: JSON.parse(newWorkflow.workflow_steps),
        trigger_conditions: JSON.parse(newWorkflow.trigger_conditions),
        configuration: JSON.parse(newWorkflow.configuration)
      },
      message: 'Custom workflow created successfully'
    });
  } catch (error) {
    console.error('Error creating custom workflow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update custom workflow
router.put('/:id', requireFunction('workflows', 'edit'), async (req, res) => {
  try {
    const {
      name,
      description,
      workflow_type,
      category,
      workflow_steps,
      trigger_conditions,
      configuration,
      is_active,
      status
    } = req.body;
    
    const updateFields = [];
    const params = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    
    if (workflow_type !== undefined) {
      updateFields.push('workflow_type = ?');
      params.push(workflow_type);
    }
    
    if (category !== undefined) {
      updateFields.push('category = ?');
      params.push(category);
    }
    
    if (workflow_steps !== undefined) {
      updateFields.push('workflow_steps = ?');
      params.push(JSON.stringify(workflow_steps));
    }
    
    if (trigger_conditions !== undefined) {
      updateFields.push('trigger_conditions = ?');
      params.push(JSON.stringify(trigger_conditions));
    }
    
    if (configuration !== undefined) {
      updateFields.push('configuration = ?');
      params.push(JSON.stringify(configuration));
    }
    
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }
    
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    params.push(req.params.id, req.user.tenantId);
    
    await db.run(`
      UPDATE custom_workflows 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND tenant_id = ?
    `, params);
    
    const updatedWorkflow = await db.get(`
      SELECT * FROM custom_workflows WHERE id = ? AND tenant_id = ?
    `, [req.params.id, req.user.tenantId]);
    
    if (!updatedWorkflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    
    res.json({
      success: true,
      data: {
        ...updatedWorkflow,
        workflow_steps: JSON.parse(updatedWorkflow.workflow_steps),
        trigger_conditions: JSON.parse(updatedWorkflow.trigger_conditions),
        configuration: JSON.parse(updatedWorkflow.configuration)
      },
      message: 'Custom workflow updated successfully'
    });
  } catch (error) {
    console.error('Error updating custom workflow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute workflow
router.post('/:id/execute', requireFunction('workflows', 'execute'), async (req, res) => {
  try {
    const { execution_context = {} } = req.body;
    
    const workflow = await db.get(`
      SELECT * FROM custom_workflows 
      WHERE id = ? AND tenant_id = ? AND is_active = 1
    `, [req.params.id, req.user.tenantId]);
    
    if (!workflow) {
      return res.status(404).json({ 
        success: false, 
        error: 'Active workflow not found' 
      });
    }
    
    const executionId = require('crypto').randomBytes(16).toString('hex');
    
    // Start execution record
    await db.run(`
      INSERT INTO workflow_executions (
        id, workflow_id, tenant_id, executed_by, execution_context,
        status, started_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      executionId,
      req.params.id,
      req.user.tenantId,
      req.user.userId,
      JSON.stringify(execution_context),
      'running'
    ]);
    
    try {
      // Execute workflow steps
      const steps = JSON.parse(workflow.workflow_steps);
      const results = [];
      
      for (const step of steps) {
        const stepResult = await executeWorkflowStep(step, execution_context, req.user);
        results.push(stepResult);
        
        if (!stepResult.success && step.stop_on_error) {
          break;
        }
      }
      
      // Update execution record
      await db.run(`
        UPDATE workflow_executions 
        SET status = ?, execution_result = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, ['completed', JSON.stringify({ steps: results }), executionId]);
      
      res.json({
        success: true,
        data: {
          execution_id: executionId,
          workflow_id: req.params.id,
          status: 'completed',
          results: results
        },
        message: 'Workflow executed successfully'
      });
      
    } catch (executionError) {
      // Update execution record with error
      await db.run(`
        UPDATE workflow_executions 
        SET status = ?, error_details = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, ['failed', JSON.stringify({ error: executionError.message }), executionId]);
      
      throw executionError;
    }
    
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get workflow execution history
router.get('/:id/executions', requireFunction('workflows', 'view'), async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const executions = await db.all(`
      SELECT 
        we.*,
        u.name as executed_by_name
      FROM workflow_executions we
      LEFT JOIN users u ON we.executed_by = u.id
      WHERE we.workflow_id = ? AND we.tenant_id = ?
      ORDER BY we.started_at DESC
      LIMIT ? OFFSET ?
    `, [req.params.id, req.user.tenantId, parseInt(limit), parseInt(offset)]);
    
    res.json({
      success: true,
      data: executions.map(exec => ({
        ...exec,
        execution_context: exec.execution_context ? JSON.parse(exec.execution_context) : {},
        execution_result: exec.execution_result ? JSON.parse(exec.execution_result) : {},
        error_details: exec.error_details ? JSON.parse(exec.error_details) : null
      }))
    });
  } catch (error) {
    console.error('Error fetching workflow executions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete workflow
router.delete('/:id', requireFunction('workflows', 'delete'), async (req, res) => {
  try {
    const result = await db.run(`
      DELETE FROM custom_workflows 
      WHERE id = ? AND tenant_id = ?
    `, [req.params.id, req.user.tenantId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    
    res.json({
      success: true,
      message: 'Custom workflow deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to execute workflow steps
async function executeWorkflowStep(step, context, user) {
  try {
    switch (step.type) {
      case 'send_email':
        return await executeSendEmailStep(step, context, user);
      case 'create_task':
        return await executeCreateTaskStep(step, context, user);
      case 'update_record':
        return await executeUpdateRecordStep(step, context, user);
      case 'send_notification':
        return await executeSendNotificationStep(step, context, user);
      case 'wait':
        return await executeWaitStep(step, context, user);
      default:
        return {
          success: false,
          step_name: step.name,
          error: `Unknown step type: ${step.type}`
        };
    }
  } catch (error) {
    return {
      success: false,
      step_name: step.name,
      error: error.message
    };
  }
}

async function executeSendEmailStep(step, context, user) {
  // Mock email sending - in production this would integrate with email service
  return {
    success: true,
    step_name: step.name,
    result: {
      action: 'email_sent',
      recipient: step.config.recipient || context.email,
      subject: step.config.subject || 'Workflow Notification'
    }
  };
}

async function executeCreateTaskStep(step, context, user) {
  // Mock task creation - in production this would create actual tasks
  return {
    success: true,
    step_name: step.name,
    result: {
      action: 'task_created',
      task_id: require('crypto').randomBytes(8).toString('hex'),
      title: step.config.title || 'Workflow Task',
      assigned_to: step.config.assigned_to || user.userId
    }
  };
}

async function executeUpdateRecordStep(step, context, user) {
  // Mock record update - in production this would update actual records
  return {
    success: true,
    step_name: step.name,
    result: {
      action: 'record_updated',
      record_type: step.config.record_type,
      record_id: step.config.record_id || context.record_id,
      fields_updated: step.config.fields || {}
    }
  };
}

async function executeSendNotificationStep(step, context, user) {
  // Mock notification sending
  return {
    success: true,
    step_name: step.name,
    result: {
      action: 'notification_sent',
      recipient: step.config.recipient || user.userId,
      message: step.config.message || 'Workflow notification'
    }
  };
}

async function executeWaitStep(step, context, user) {
  // Mock wait step - in production this might schedule delayed execution
  return {
    success: true,
    step_name: step.name,
    result: {
      action: 'wait_completed',
      duration: step.config.duration || '1 minute'
    }
  };
}

module.exports = router;