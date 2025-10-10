#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:12001/api';
const FRONTEND_BASE = 'http://localhost:12000';

async function testAPIIntegration() {
  console.log('🚀 Testing SalesSync API Integration...\n');
  
  try {
    // Test 1: Backend Health
    console.log('1. Testing Backend Connection...');
    try {
      const response = await axios.get(`${API_BASE}/users`);
      console.log('✅ Backend is responding');
    } catch (error) {
      console.log('❌ Backend connection failed:', error.message);
      return;
    }

    // Test 2: Create Test User
    console.log('\n2. Creating Test User...');
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        email: 'test@company.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN'
      });
      console.log('✅ Test user created');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Test user already exists');
      } else {
        console.log('⚠️ User creation failed:', error.response?.data?.message || error.message);
      }
    }

    // Test 3: Login
    console.log('\n3. Testing Login...');
    let token;
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: 'test@company.com',
        password: 'password123'
      });
      token = response.data.token;
      console.log('✅ Login successful');
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Test 4: Core API Endpoints
    const endpoints = [
      '/products',
      '/customers', 
      '/orders',
      '/inventory/stock',
      '/analytics/dashboard',
      '/users'
    ];

    console.log('\n4. Testing Core API Endpoints...');
    for (const endpoint of endpoints) {
      try {
        await axios.get(`${API_BASE}${endpoint}`, { headers });
        console.log(`✅ ${endpoint}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status || error.message}`);
      }
    }

    // Test 5: Frontend Accessibility
    console.log('\n5. Testing Frontend...');
    try {
      const response = await axios.get(FRONTEND_BASE);
      console.log('✅ Frontend is accessible');
    } catch (error) {
      console.log('❌ Frontend not accessible:', error.message);
    }

    console.log('\n🎉 API Integration Test Complete!');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testAPIIntegration();