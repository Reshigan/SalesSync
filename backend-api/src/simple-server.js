const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic API endpoints
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalCustomers: 1250,
    totalOrders: 3420,
    totalRevenue: 125000,
    activeAgents: 45
  });
});

app.get('/api/customers', (req, res) => {
  res.json([
    { id: 1, name: 'Customer 1', email: 'customer1@example.com' },
    { id: 2, name: 'Customer 2', email: 'customer2@example.com' }
  ]);
});

app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Product 1', price: 100 },
    { id: 2, name: 'Product 2', price: 200 }
  ]);
});

app.get('/api/orders', (req, res) => {
  res.json([
    { id: 1, customerId: 1, total: 100, status: 'completed' },
    { id: 2, customerId: 2, total: 200, status: 'pending' }
  ]);
});

// Catch all
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple SalesSync API server running on port ${PORT}`);
});

module.exports = app;