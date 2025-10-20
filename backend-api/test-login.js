#!/usr/bin/env node

const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login...');
    
    const response = await axios.post('http://localhost:12001/api/auth/login', {
      email: 'admin@afridistribute.co.za',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': 'DEMO'
      }
    });
    
    console.log('Login successful!');
    console.log('Token:', response.data.data.accessToken);
    
    // Save token to file
    require('fs').writeFileSync('token.txt', response.data.data.accessToken);
    
    // Test campaigns endpoint
    const campaignsResponse = await axios.get('http://localhost:12001/api/campaigns', {
      headers: {
        'Authorization': `Bearer ${response.data.data.accessToken}`,
        'X-Tenant-Code': 'DEMO'
      }
    });
    
    console.log('Campaigns API test successful!');
    console.log('Campaigns:', campaignsResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testLogin();