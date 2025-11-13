const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all boards for tenant
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, board_type } = req.query;

    let query = 'SELECT * FROM boards WHERE tenant_id = $1';
    const params = [tenantId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (board_type) {
      query += ' AND board_type = ?';
      params.push(board_type);
    }

    query += ' ORDER BY created_at DESC';
    db.all(query, params, (err, boards) => {
      if (err) {
        console.error('Error fetching boards:', err);
        return res.status(500).json({ error: 'Failed to fetch boards' });
      }
      res.json(boards);
    });
  } catch (error) {
    console.error('Error in get boards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single board by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    db.get(
      'SELECT * FROM boards WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
      (err, board) => {
        if (err) {
          console.error('Error fetching board:', err);
          return res.status(500).json({ error: 'Failed to fetch board' });
        }
        if (!board) {
          return res.status(404).json({ error: 'Board not found' });
        }
        res.json(board);
      }
    );
  } catch (error) {
    console.error('Error in get board:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new board
router.post('/', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      board_name,
      board_type,
      width_cm,
      height_cm,
      cost_price,
      installation_cost,
      commission_rate,
      reference_image_url,
      description,
      status = 'active'
    } = req.body;

    // Validation
    if (!board_name || !board_type) {
      return res.status(400).json({ error: 'Board name and type are required' });
    }

    const boardId = uuidv4();

    db.run(
      `INSERT INTO boards (
        id, tenant_id, board_name, board_type, width_cm, height_cm,
        cost_price, installation_cost, commission_rate, reference_image_url,
        description, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        boardId,
        tenantId,
        board_name,
        board_type,
        width_cm || null,
        height_cm || null,
        cost_price || null,
        installation_cost || null,
        commission_rate || null,
        reference_image_url || null,
        description || null,
        status
      ],
      function(err) {
        if (err) {
          console.error('Error creating board:', err);
          return res.status(500).json({ error: 'Failed to create board' });
        }

        // Fetch the created board
        db.get(
          'SELECT * FROM boards WHERE id = $1',
          [boardId],
          (err, board) => {
            if (err) {
              console.error('Error fetching created board:', err);
              return res.status(500).json({ error: 'Board created but failed to fetch' });
            }
            res.status(201).json(board);
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in create board:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update board
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const {
      board_name,
      board_type,
      width_cm,
      height_cm,
      cost_price,
      installation_cost,
      commission_rate,
      reference_image_url,
      description,
      status
    } = req.body;

    // Check if board exists
    db.get(
      'SELECT id FROM boards WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
      (err, board) => {
        if (err) {
          console.error('Error checking board:', err);
          return res.status(500).json({ error: 'Failed to update board' });
        }
        if (!board) {
          return res.status(404).json({ error: 'Board not found' });
        }

        // Update board
        db.run(
          `UPDATE boards SET
            board_name = COALESCE(?, board_name),
            board_type = COALESCE(?, board_type),
            width_cm = COALESCE(?, width_cm),
            height_cm = COALESCE(?, height_cm),
            cost_price = COALESCE(?, cost_price),
            installation_cost = COALESCE(?, installation_cost),
            commission_rate = COALESCE(?, commission_rate),
            reference_image_url = COALESCE(?, reference_image_url),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND tenant_id = $2`,
          [
            board_name,
            board_type,
            width_cm,
            height_cm,
            cost_price,
            installation_cost,
            commission_rate,
            reference_image_url,
            description,
            status,
            id,
            tenantId
          ],
          function(err) {
            if (err) {
              console.error('Error updating board:', err);
              return res.status(500).json({ error: 'Failed to update board' });
            }

            // Fetch updated board
            db.get(
              'SELECT * FROM boards WHERE id = $1',
              [id],
              (err, updatedBoard) => {
                if (err) {
                  console.error('Error fetching updated board:', err);
                  return res.status(500).json({ error: 'Board updated but failed to fetch' });
                }
                res.json(updatedBoard);
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in update board:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete board
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    // Check if board exists
    db.get(
      'SELECT id FROM boards WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
      (err, board) => {
        if (err) {
          console.error('Error checking board:', err);
          return res.status(500).json({ error: 'Failed to delete board' });
        }
        if (!board) {
          return res.status(404).json({ error: 'Board not found' });
        }

        // Delete board
        db.run(
          'DELETE FROM boards WHERE id = $1 AND tenant_id = $2',
          [id, tenantId],
          function(err) {
            if (err) {
              console.error('Error deleting board:', err);
              return res.status(500).json({ error: 'Failed to delete board' });
            }
            res.json({ message: 'Board deleted successfully' });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in delete board:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign board to brand
router.post('/:id/assign-brand', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { brand_id, coverage_standard, visibility_standard } = req.body;

    if (!brand_id) {
      return res.status(400).json({ error: 'Brand ID is required' });
    }

    // Check if board exists
    db.get(
      'SELECT id FROM boards WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
      (err, board) => {
        if (err) {
          console.error('Error checking board:', err);
          return res.status(500).json({ error: 'Failed to assign board' });
        }
        if (!board) {
          return res.status(404).json({ error: 'Board not found' });
        }

        // Check if assignment already exists
        db.get(
          'SELECT id FROM brand_boards WHERE board_id = $1 AND brand_id = $2 AND tenant_id = $3',
          [id, brand_id, tenantId],
          (err, existing) => {
            if (err) {
              console.error('Error checking assignment:', err);
              return res.status(500).json({ error: 'Failed to assign board' });
            }

            if (existing) {
              // Update existing assignment
              db.run(
                `UPDATE brand_boards SET
                  coverage_standard = ?,
                  visibility_standard = ?,
                  is_active = 1
                WHERE id = $1`,
                [coverage_standard || null, visibility_standard || null, existing.id],
                function(err) {
                  if (err) {
                    console.error('Error updating assignment:', err);
                    return res.status(500).json({ error: 'Failed to update assignment' });
                  }
                  res.json({ message: 'Board assignment updated successfully', id: existing.id });
                }
              );
            } else {
              // Create new assignment
              const assignmentId = uuidv4();
              db.run(
                `INSERT INTO brand_boards (
                  id, tenant_id, brand_id, board_id,
                  coverage_standard, visibility_standard, is_active, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, 1, CURRENT_TIMESTAMP)`,
                [
                  assignmentId,
                  tenantId,
                  brand_id,
                  id,
                  coverage_standard || null,
                  visibility_standard || null
                ],
                function(err) {
                  if (err) {
                    console.error('Error creating assignment:', err);
                    return res.status(500).json({ error: 'Failed to assign board' });
                  }
                  res.status(201).json({ message: 'Board assigned successfully', id: assignmentId });
                }
              );
            }
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in assign board:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get boards for a specific brand
router.get('/brand/:brandId', authMiddleware, async (req, res) => {
  try {
    const { brandId } = req.params;
    const tenantId = req.user.tenantId;
    db.all(
      `SELECT b.*, bb.coverage_standard, bb.visibility_standard, bb.is_active as assigned
      FROM boards b
      INNER JOIN brand_boards bb ON b.id = bb.board_id
      WHERE bb.brand_id = $1 AND bb.tenant_id = $2 AND bb.is_active = 1 AND b.status = 'active'
      ORDER BY b.board_name`,
      [brandId, tenantId],
      (err, boards) => {
        if (err) {
          console.error('Error fetching brand boards:', err);
          return res.status(500).json({ error: 'Failed to fetch brand boards' });
        }
        res.json(boards);
      }
    );
  } catch (error) {
    console.error('Error in get brand boards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unassign board from brand
router.delete('/:id/assign-brand/:brandId', authMiddleware, async (req, res) => {
  try {
    const { id, brandId } = req.params;
    const tenantId = req.user.tenantId;
    db.run(
      'UPDATE brand_boards SET is_active = 0 WHERE board_id = $1 AND brand_id = $2 AND tenant_id = $3',
      [id, brandId, tenantId],
      function(err) {
        if (err) {
          console.error('Error unassigning board:', err);
          return res.status(500).json({ error: 'Failed to unassign board' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Board assignment not found' });
        }
        res.json({ message: 'Board unassigned successfully' });
      }
    );
  } catch (error) {
    console.error('Error in unassign board:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
