const fs = require('fs');
const csv = require('csv-parser');
const ExcelJS = require('exceljs');

class BulkOperationsService {
  constructor(db) {
    this.db = db;
  }

  // Bulk import customers from CSV/Excel
  async importCustomers(filePath, tenantId) {
    const results = [];
    const errors = [];
    
    try {
      const customers = await this.parseFile(filePath);
      
      for (const customer of customers) {
        try {
          const stmt = this.db.prepare(`
            INSERT INTO customers (
              tenant_id, name, email, phone, address, 
              business_type, credit_limit, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `);
          
          const result = stmt.run(
            tenantId,
            customer.name,
            customer.email,
            customer.phone,
            customer.address,
            customer.business_type || 'retail',
            customer.credit_limit || 0,
            customer.status || 'active'
          );
          
          results.push({ id: result.lastInsertRowid, ...customer });
        } catch (error) {
          errors.push({ customer, error: error.message });
        }
      }
      
      return {
        success: true,
        imported: results.length,
        errors: errors.length,
        results,
        errors
      };
    } catch (error) {
      throw new Error(`Bulk import failed: ${error.message}`);
    }
  }

  // Bulk export data
  async exportData(type, tenantId, format = 'excel') {
    try {
      let data = [];
      let filename = '';
      
      switch (type) {
        case 'customers':
          data = this.db.prepare(`
            SELECT name, email, phone, address, business_type, 
                   credit_limit, status, created_at
            FROM customers 
            WHERE tenant_id = ?
          `).all(tenantId);
          filename = `customers_export_${Date.now()}`;
          break;
          
        case 'products':
          data = this.db.prepare(`
            SELECT name, sku, category, price, cost, 
                   stock_quantity, min_stock_level, status, created_at
            FROM products 
            WHERE tenant_id = ?
          `).all(tenantId);
          filename = `products_export_${Date.now()}`;
          break;
          
        default:
          throw new Error('Invalid export type');
      }
      
      if (format === 'excel') {
        return await this.generateExcel(data, filename);
      } else {
        return await this.generateCSV(data, filename);
      }
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  // Parse uploaded file (CSV or Excel)
  async parseFile(filePath) {
    const extension = filePath.split('.').pop().toLowerCase();
    
    if (extension === 'csv') {
      return this.parseCSV(filePath);
    } else {
      throw new Error('Unsupported file format. Please use CSV files.');
    }
  }

  // Parse CSV file
  parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  // Generate Excel export
  async generateExcel(data, filename) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Export');
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      data.forEach(row => {
        worksheet.addRow(Object.values(row));
      });
      
      // Style headers
      worksheet.getRow(1).font = { bold: true };
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      filename: `${filename}.xlsx`,
      buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  // Generate CSV export
  async generateCSV(data, filename) {
    if (data.length === 0) {
      return {
        filename: `${filename}.csv`,
        buffer: Buffer.from(''),
        contentType: 'text/csv'
      };
    }
    
    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      });
      csv += values.join(',') + '\n';
    });
    
    return {
      filename: `${filename}.csv`,
      buffer: Buffer.from(csv),
      contentType: 'text/csv'
    };
  }
}

module.exports = BulkOperationsService;