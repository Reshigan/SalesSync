const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BulkOperationsService = require('../services/bulk-operations.service');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize bulk operations service
let bulkService;

function initializeBulkService(db) {
  bulkService = new BulkOperationsService(db);
}

// Bulk import customers
router.post('/import/customers', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await bulkService.importCustomers(req.file.path, req.user.tenant_id);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    console.error('Bulk import error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Bulk export data
router.get('/export/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'excel' } = req.query;
    
    const result = await bulkService.exportData(type, req.user.tenant_id, format);
    
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (error) {
    console.error('Bulk export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get bulk operation templates
router.get('/templates/:type', authMiddleware, (req, res) => {
  try {
    const { type } = req.params;
    let template = {};
    
    switch (type) {
      case 'customers':
        template = {
          filename: 'customer_import_template.csv',
          headers: ['name', 'email', 'phone', 'address', 'business_type', 'credit_limit', 'status'],
          sample: {
            name: 'Sample Customer',
            email: 'customer@example.com',
            phone: '+27123456789',
            address: '123 Main St, Cape Town',
            business_type: 'retail',
            credit_limit: '10000',
            status: 'active'
          }
        };
        break;
        
      case 'products':
        template = {
          filename: 'product_import_template.csv',
          headers: ['name', 'sku', 'category', 'price', 'cost', 'stock_quantity', 'min_stock_level', 'status'],
          sample: {
            name: 'Sample Product',
            sku: 'SP001',
            category: 'Electronics',
            price: '99.99',
            cost: '50.00',
            stock_quantity: '100',
            min_stock_level: '10',
            status: 'active'
          }
        };
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid template type' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Template error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download template file
router.get('/templates/:type/download', authMiddleware, (req, res) => {
  try {
    const { type } = req.params;
    let headers = [];
    let filename = '';
    
    switch (type) {
      case 'customers':
        headers = ['name', 'email', 'phone', 'address', 'business_type', 'credit_limit', 'status'];
        filename = 'customer_import_template.csv';
        break;
        
      case 'products':
        headers = ['name', 'sku', 'category', 'price', 'cost', 'stock_quantity', 'min_stock_level', 'status'];
        filename = 'product_import_template.csv';
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid template type' });
    }
    
    const csv = headers.join(',') + '\n';
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, initializeBulkService };