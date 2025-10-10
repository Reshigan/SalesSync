#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fix service imports
function fixServiceImports() {
  console.log('🔧 Fixing service imports...');

  const serviceFiles = [
    'src/services/orders.service.ts',
    'src/services/products.service.ts',
    'src/services/inventory.service.ts',
    'src/services/van-sales.service.ts',
    'src/services/customers.service.ts',
    'src/services/auth.service.ts'
  ];

  serviceFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix import statement
      content = content.replace(
        /import apiService from '@\/lib\/api';?/g,
        "import { apiClient } from '../lib/api-client'"
      );
      content = content.replace(
        /import { apiService } from '@\/lib\/api';?/g,
        "import { apiClient } from '../lib/api-client'"
      );
      content = content.replace(
        /import apiService from '\.\.\/lib\/api';?/g,
        "import { apiClient } from '../lib/api-client'"
      );
      
      // Replace apiService with apiClient
      content = content.replace(/apiService\./g, 'apiClient.');
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${filePath}`);
    }
  });

  console.log('🎉 All service imports fixed!');
}

// Run the fixes
fixServiceImports();