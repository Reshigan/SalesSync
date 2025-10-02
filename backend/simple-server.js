const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 12001;

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:12000",
    "https://work-1-drhntgqppzeokwjw.prod-runtime.all-hands.dev"
  ],
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'SalesSync Backend API is running'
  });
});

// Mock login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password });
  
  // Mock authentication
  if (email && password) {
    res.json({
      success: true,
      data: {
        user: {
          id: '1',
          email: email,
          name: 'Demo User',
          role: 'admin',
          tenantId: 'default'
        },
        token: 'mock-jwt-token-12345',
        refreshToken: 'mock-refresh-token-67890'
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }
});

// Mock register endpoint
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  console.log('Register attempt:', { email, name });
  
  if (email && password && name) {
    res.json({
      success: true,
      data: {
        user: {
          id: '2',
          email: email,
          name: name,
          role: 'user',
          tenantId: 'default'
        },
        token: 'mock-jwt-token-54321',
        refreshToken: 'mock-refresh-token-09876'
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Email, password, and name are required'
    });
  }
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple SalesSync Backend API running on port ${PORT}`);
  console.log(`🔗 CORS enabled for frontend URLs`);
  console.log(`📊 Environment: development`);
});