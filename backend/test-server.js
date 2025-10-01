const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 12001;

app.use(cors({
  origin: ['http://localhost:12000', 'https://work-1-drhntgqppzeokwjw.prod-runtime.all-hands.dev'],
  credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'demo@salessync.com' && password === 'demo123') {
    res.json({
      token: 'test-jwt-token',
      user: {
        id: 'user_1',
        email: 'demo@salessync.com',
        firstName: 'Demo',
        lastName: 'User',
        role: 'van_sales'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});