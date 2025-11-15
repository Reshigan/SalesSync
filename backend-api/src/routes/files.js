const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { insertRow, selectMany, selectOne, updateRow, deleteRow } = require('../utils/pg-helpers');
const { getQuery, getOneQuery } = require('../utils/database');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create subdirectories for organization
    const subDir = path.join(uploadDir, req.user?.id?.toString() || 'temp');
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
    }

    cb(null, subDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and archives are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// POST /api/files/upload - Upload single file
router.post('/upload', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const fileData = {
      tenant_id: tenantId,
      user_id: userId,
      original_name: req.file.originalname,
      filename: req.file.filename,
      filepath: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      resource_type: req.body.resource_type || null,
      resource_id: req.body.resource_id || null,
      description: req.body.description || null
    };

    const file = await insertRow('files', fileData);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: file.id,
        ...fileData,
        url: `/api/files/${file.id}`
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/files/upload-multiple - Upload multiple files
router.post('/upload-multiple', authenticateToken, upload.array('files', 10), (req, res) => {
  const db = req.app.locals.db;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const uploadedFiles = [];
  let processed = 0;

  req.files.forEach(file => {
    const fileData = {
      user_id: req.user.id,
      original_name: file.originalname,
      filename: file.filename,
      filepath: file.path,
      mimetype: file.mimetype,
      size: file.size,
      resource_type: req.body.resource_type || null,
      resource_id: req.body.resource_id || null
    };

    db.run(
      `INSERT INTO files (user_id, original_name, filename, filepath, mimetype, size, resource_type, resource_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [fileData.user_id, fileData.original_name, fileData.filename, fileData.filepath,
       fileData.mimetype, fileData.size, fileData.resource_type, fileData.resource_id],
      function(err) {
        if (!err) {
          uploadedFiles.push({
            id: this.lastID,
            ...fileData,
            url: `/api/files/${this.lastID}`
          });
        }

        processed++;
        if (processed === req.files.length) {
          res.status(201).json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
            files: uploadedFiles
          });
        }
      }
    );
  });
});

// GET /api/files - List all files (with pagination)
router.get('/', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const resource_type = req.query.resource_type;
  const resource_id = req.query.resource_id;

  let query = `
    SELECT f.*, u.username as uploaded_by_name
    FROM files f
    LEFT JOIN users u ON u.id = f.user_id
    WHERE 1=1
  `;
  const params = [];

  // Filter by resource
  if (resource_type) {
    query += ' AND f.resource_type = ?';
    params.push(resource_type);
  }
  if (resource_id) {
    query += ' AND f.resource_id = ?';
    params.push(resource_id);
  }

  // Filter by user if not admin
  if (req.user.role !== 'admin') {
    query += ' AND f.user_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  db.all(query, params, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM files WHERE 1=1';
    const countParams = [];

    if (resource_type) {
      countQuery += ' AND resource_type = ?';
      countParams.push(resource_type);
    }
    if (resource_id) {
      countQuery += ' AND resource_id = ?';
      countParams.push(resource_id);
    }
    if (req.user.role !== 'admin') {
      countQuery += ' AND user_id = ?';
      countParams.push(req.user.id);
    }

    db.get(countQuery, countParams, (err, row) => {
      res.json({
        success: true,
        files: files.map(f => ({
          ...f,
          url: `/api/files/${f.id}`
        })),
        pagination: {
          page,
          limit,
          total: row ? row.total : 0,
          pages: row ? Math.ceil(row.total / limit) : 0
        }
      });
    });
  });
});

// GET /api/files/:id - Get file metadata
router.get('/:id', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  db.get(
    'SELECT * FROM files WHERE id = ?',
    [id],
    (err, file) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Check permissions
      if (req.user.role !== 'admin' && file.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        success: true,
        file: {
          ...file,
          url: `/api/files/${file.id}/download`
        }
      });
    }
  );
});

// GET /api/files/:id/download - Download file
router.get('/:id/download', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  db.get(
    'SELECT * FROM files WHERE id = ?',
    [id],
    (err, file) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Check permissions
      if (req.user.role !== 'admin' && file.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if file exists
      if (!fs.existsSync(file.filepath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }

      // Update download count
      db.run('UPDATE files SET download_count = download_count + 1 WHERE id = ?', [id]);

      // Log file download
      db.run(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'file_downloaded', 'file', id, JSON.stringify({ filename: file.original_name })]
      );

      // Send file
      res.download(file.filepath, file.original_name);
    }
  );
});

// DELETE /api/files/:id - Delete file
router.delete('/:id', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  db.get(
    'SELECT * FROM files WHERE id = ?',
    [id],
    (err, file) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Check permissions
      if (req.user.role !== 'admin' && file.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Delete file from disk
      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }

      // Delete from database
      db.run('DELETE FROM files WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error deleting file' });
        }

        // Log file deletion
        db.run(
          'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, 'file_deleted', 'file', id, JSON.stringify({ filename: file.original_name })]
        );

        res.json({
          success: true,
          message: 'File deleted successfully'
        });
      });
    }
  );
});

// PUT /api/files/:id - Update file metadata
router.put('/:id', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { description, resource_type, resource_id } = req.body;

  db.get('SELECT * FROM files WHERE id = ?', [id], (err, file) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && file.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.run(
      'UPDATE files SET description = ?, resource_type = ?, resource_id = ? WHERE id = ?',
      [description, resource_type, resource_id, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error updating file' });
        }

        res.json({
          success: true,
          message: 'File metadata updated successfully'
        });
      }
    );
  });
});

// GET /api/files/stats - Get file statistics
router.get('/statistics/overview', authenticateToken, (req, res) => {
  const db = req.app.locals.db;

  let query = 'SELECT COUNT(*) as total_files, SUM(size) as total_size FROM files';
  const params = [];

  if (req.user.role !== 'admin') {
    query += ' WHERE user_id = ?';
    params.push(req.user.id);
  }

  db.get(query, params, (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      success: true,
      stats: {
        total_files: stats.total_files || 0,
        total_size: stats.total_size || 0,
        total_size_mb: ((stats.total_size || 0) / (1024 * 1024)).toFixed(2)
      }
    });
  });
});

module.exports = router;
