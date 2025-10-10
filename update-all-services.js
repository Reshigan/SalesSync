#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Updating all frontend services to use real APIs...\n');

const servicesDir = path.join(__dirname, 'frontend/src/services');
const services = [
  'products.service.ts',
  'customers.service.ts', 
  'orders.service.ts',
  'inventory.service.ts',
  'van-sales.service.ts'
];

// Real API service template
const realApiTemplate = (serviceName, endpoints) => `
import apiService from '@/lib/api';

export const ${serviceName}Service = {
${endpoints.map(endpoint => `
  ${endpoint.name}: async (${endpoint.params || ''}) => {
    const response = await apiService.${endpoint.method}('${endpoint.path}'${endpoint.data ? ', ' + endpoint.data : ''});
    return response.data;
  },`).join('')}
};

export default ${serviceName}Service;
`;

// Service configurations
const serviceConfigs = {
  'products.service.ts': {
    name: 'products',
    endpoints: [
      { name: 'getAll', method: 'get', path: '/products' },
      { name: 'getById', method: 'get', path: '/products', params: 'id: string' },
      { name: 'create', method: 'post', path: '/products', params: 'data: any', data: 'data' },
      { name: 'update', method: 'put', path: '/products', params: 'id: string, data: any', data: 'data' },
      { name: 'delete', method: 'delete', path: '/products', params: 'id: string' }
    ]
  },
  'customers.service.ts': {
    name: 'customers',
    endpoints: [
      { name: 'getAll', method: 'get', path: '/customers' },
      { name: 'getById', method: 'get', path: '/customers', params: 'id: string' },
      { name: 'create', method: 'post', path: '/customers', params: 'data: any', data: 'data' },
      { name: 'update', method: 'put', path: '/customers', params: 'id: string, data: any', data: 'data' },
      { name: 'delete', method: 'delete', path: '/customers', params: 'id: string' }
    ]
  },
  'orders.service.ts': {
    name: 'orders',
    endpoints: [
      { name: 'getAll', method: 'get', path: '/orders' },
      { name: 'getById', method: 'get', path: '/orders', params: 'id: string' },
      { name: 'create', method: 'post', path: '/orders', params: 'data: any', data: 'data' },
      { name: 'updateStatus', method: 'put', path: '/orders', params: 'id: string, status: string', data: '{ status }' }
    ]
  },
  'inventory.service.ts': {
    name: 'inventory',
    endpoints: [
      { name: 'getStock', method: 'get', path: '/inventory/stock' },
      { name: 'updateStock', method: 'post', path: '/inventory/movements', params: 'data: any', data: 'data' },
      { name: 'getLowStock', method: 'get', path: '/inventory/low-stock' },
      { name: 'getMovements', method: 'get', path: '/inventory/movements' }
    ]
  },
  'van-sales.service.ts': {
    name: 'vanSales',
    endpoints: [
      { name: 'getRoutes', method: 'get', path: '/van-sales/routes' },
      { name: 'getDrivers', method: 'get', path: '/van-sales/drivers' },
      { name: 'trackVan', method: 'get', path: '/van-sales/tracking', params: 'vanId: string' },
      { name: 'updateLocation', method: 'post', path: '/van-sales/location', params: 'data: any', data: 'data' }
    ]
  }
};

// Update each service file
services.forEach(serviceFile => {
  const filePath = path.join(servicesDir, serviceFile);
  
  if (fs.existsSync(filePath)) {
    const config = serviceConfigs[serviceFile];
    if (config) {
      const newContent = realApiTemplate(config.name, config.endpoints);
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Updated ${serviceFile}`);
    }
  } else {
    console.log(`⚠️  ${serviceFile} not found`);
  }
});

console.log('\n🎉 All services updated to use real APIs!');