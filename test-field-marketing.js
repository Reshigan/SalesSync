#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:12001/api';

// Test configuration
const testConfig = {
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': '1'
  }
};

// Test user credentials
const testUser = {
  email: 'admin@test.com',
  password: 'admin123'
};

let authToken = null;

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      ...testConfig,
      method,
      url: endpoint,
      headers: {
        ...testConfig.headers,
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Test authentication
const testAuth = async () => {
  console.log('\n🔐 Testing Authentication...');
  
  // Try to login
  const loginResult = await makeRequest('POST', '/auth/login', testUser);
  
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    console.log('✅ Authentication successful');
    return true;
  } else {
    console.log('❌ Authentication failed:', loginResult.error);
    
    // Try to register if login fails
    console.log('🔄 Attempting to register test user...');
    const registerResult = await makeRequest('POST', '/auth/register', {
      ...testUser,
      firstName: 'Test',
      lastName: 'Admin',
      role: 'SUPER_ADMIN'
    });
    
    if (registerResult.success) {
      console.log('✅ Registration successful, trying login again...');
      const retryLogin = await makeRequest('POST', '/auth/login', testUser);
      if (retryLogin.success && retryLogin.data.token) {
        authToken = retryLogin.data.token;
        console.log('✅ Authentication successful after registration');
        return true;
      }
    }
    
    console.log('❌ Could not authenticate:', registerResult.error);
    return false;
  }
};

// Test Field Agents API
const testFieldAgents = async () => {
  console.log('\n👥 Testing Field Agents API...');
  
  // Get all field agents
  const getResult = await makeRequest('GET', '/field-agent');
  console.log('GET /field-agent:', getResult.success ? '✅' : '❌', 
    getResult.success ? `Found ${getResult.data.fieldAgents?.length || 0} agents` : getResult.error);
  
  // Create a test field agent
  const createData = {
    userId: 1, // Assuming user ID 1 exists
    employeeId: 'FA001',
    territoryIds: ['TERRITORY_1'],
    status: 'ACTIVE',
    commissionRate: 5.0,
    targetSales: 10000
  };
  
  const createResult = await makeRequest('POST', '/field-agent', createData);
  console.log('POST /field-agent:', createResult.success ? '✅' : '❌', 
    createResult.success ? 'Agent created' : createResult.error);
  
  let agentId = null;
  if (createResult.success && createResult.data.id) {
    agentId = createResult.data.id;
    
    // Get specific field agent
    const getOneResult = await makeRequest('GET', `/field-agent/${agentId}`);
    console.log(`GET /field-agent/${agentId}:`, getOneResult.success ? '✅' : '❌',
      getOneResult.success ? 'Agent retrieved' : getOneResult.error);
    
    // Update field agent
    const updateResult = await makeRequest('PUT', `/field-agent/${agentId}`, {
      commissionRate: 6.0,
      targetSales: 12000
    });
    console.log(`PUT /field-agent/${agentId}:`, updateResult.success ? '✅' : '❌',
      updateResult.success ? 'Agent updated' : updateResult.error);
  }
  
  return agentId;
};

// Test Visits API
const testVisits = async (agentId) => {
  console.log('\n📍 Testing Visits API...');
  
  // Get all visits
  const getResult = await makeRequest('GET', '/visits');
  console.log('GET /visits:', getResult.success ? '✅' : '❌',
    getResult.success ? `Found ${getResult.data.visits?.length || 0} visits` : getResult.error);
  
  if (agentId) {
    // Create a test visit
    const createData = {
      fieldAgentId: agentId,
      customerId: 1, // Assuming customer ID 1 exists
      scheduledDate: new Date().toISOString(),
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Test Street, New York, NY'
      },
      purpose: 'SALES_VISIT',
      status: 'SCHEDULED'
    };
    
    const createResult = await makeRequest('POST', '/visits', createData);
    console.log('POST /visits:', createResult.success ? '✅' : '❌',
      createResult.success ? 'Visit created' : createResult.error);
    
    if (createResult.success && createResult.data.id) {
      const visitId = createResult.data.id;
      
      // Check-in to visit
      const checkinResult = await makeRequest('POST', `/visits/${visitId}/checkin`, {
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        },
        notes: 'Arrived at customer location'
      });
      console.log(`POST /visits/${visitId}/checkin:`, checkinResult.success ? '✅' : '❌',
        checkinResult.success ? 'Check-in successful' : checkinResult.error);
    }
  }
};

// Test Boards API
const testBoards = async (agentId) => {
  console.log('\n📋 Testing Boards API...');
  
  // Get all boards
  const getResult = await makeRequest('GET', '/boards');
  console.log('GET /boards:', getResult.success ? '✅' : '❌',
    getResult.success ? `Found ${getResult.data.boards?.length || 0} boards` : getResult.error);
  
  if (agentId) {
    // Create a test board
    const createData = {
      fieldAgentId: agentId,
      customerId: 1,
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Test Street, New York, NY'
      },
      boardType: 'PROMOTIONAL',
      size: 'LARGE',
      status: 'ACTIVE',
      installationDate: new Date().toISOString()
    };
    
    const createResult = await makeRequest('POST', '/boards', createData);
    console.log('POST /boards:', createResult.success ? '✅' : '❌',
      createResult.success ? 'Board created' : createResult.error);
  }
};

// Test Product Distribution API
const testProductDistribution = async (agentId) => {
  console.log('\n📦 Testing Product Distribution API...');
  
  // Get all distributions
  const getResult = await makeRequest('GET', '/product-distribution');
  console.log('GET /product-distribution:', getResult.success ? '✅' : '❌',
    getResult.success ? `Found ${getResult.data.distributions?.length || 0} distributions` : getResult.error);
  
  if (agentId) {
    // Create a test distribution
    const createData = {
      fieldAgentId: agentId,
      customerId: 1,
      productId: 1, // Assuming product ID 1 exists
      quantity: 100,
      distributionDate: new Date().toISOString(),
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Test Street, New York, NY'
      },
      status: 'COMPLETED'
    };
    
    const createResult = await makeRequest('POST', '/product-distribution', createData);
    console.log('POST /product-distribution:', createResult.success ? '✅' : '❌',
      createResult.success ? 'Distribution created' : createResult.error);
  }
};

// Test Commissions API
const testCommissions = async (agentId) => {
  console.log('\n💰 Testing Commissions API...');
  
  // Get all commissions
  const getResult = await makeRequest('GET', '/commissions');
  console.log('GET /commissions:', getResult.success ? '✅' : '❌',
    getResult.success ? `Found ${getResult.data.commissions?.length || 0} commissions` : getResult.error);
  
  if (agentId) {
    // Calculate commissions for agent
    const calculateResult = await makeRequest('POST', `/commissions/calculate/${agentId}`, {
      period: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        endDate: new Date().toISOString()
      }
    });
    console.log(`POST /commissions/calculate/${agentId}:`, calculateResult.success ? '✅' : '❌',
      calculateResult.success ? 'Commission calculated' : calculateResult.error);
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Field Marketing API Tests...');
  console.log('='.repeat(50));
  
  // Test authentication first
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Test all field marketing APIs
  const agentId = await testFieldAgents();
  await testVisits(agentId);
  await testBoards(agentId);
  await testProductDistribution(agentId);
  await testCommissions(agentId);
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Field Marketing API Tests Complete!');
};

// Run the tests
runTests().catch(console.error);