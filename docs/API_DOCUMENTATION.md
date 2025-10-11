# SalesSync API Documentation

## Overview

The SalesSync API is a comprehensive RESTful API designed for van sales management systems. It provides endpoints for managing customers, products, orders, inventory, analytics, and more.

**Base URL:** `https://ss.gonxt.tech/api`  
**Version:** 1.0.0  
**Authentication:** JWT Bearer Token

## Table of Contents

1. [Authentication](#authentication)
2. [Core Endpoints](#core-endpoints)
3. [Van Sales Operations](#van-sales-operations)
4. [Analytics & Reporting](#analytics--reporting)
5. [Real-time Features](#real-time-features)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Security](#security)

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "tenantCode": "DEMO"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "sales_rep",
      "tenantId": 1
    }
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

## Core Endpoints

### Customers

#### Get All Customers
```http
GET /api/customers
Authorization: Bearer <token>
X-Tenant-Code: DEMO

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- search: string
- status: active|inactive
- area: string
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": 1,
        "name": "ABC Store",
        "email": "abc@store.com",
        "phone": "+1234567890",
        "address": "123 Main St",
        "area": "Downtown",
        "status": "active",
        "creditLimit": 5000.00,
        "outstandingBalance": 1250.50,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### Create Customer
```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Store",
  "email": "new@store.com",
  "phone": "+1234567890",
  "address": "456 Oak Ave",
  "area": "Uptown",
  "creditLimit": 3000.00
}
```

#### Update Customer
```http
PUT /api/customers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Store Name",
  "creditLimit": 4000.00
}
```

#### Delete Customer
```http
DELETE /api/customers/:id
Authorization: Bearer <token>
```

### Products

#### Get All Products
```http
GET /api/products
Authorization: Bearer <token>

Query Parameters:
- page: number
- limit: number
- search: string
- category: string
- brand: string
- status: active|inactive
```

#### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "sku": "SKU001",
  "barcode": "1234567890123",
  "categoryId": 1,
  "brandId": 1,
  "unitPrice": 25.99,
  "costPrice": 15.00,
  "unitOfMeasure": "piece",
  "minStockLevel": 10,
  "maxStockLevel": 100
}
```

### Orders

#### Get All Orders
```http
GET /api/orders
Authorization: Bearer <token>

Query Parameters:
- page: number
- limit: number
- status: pending|confirmed|delivered|cancelled
- customerId: number
- dateFrom: YYYY-MM-DD
- dateTo: YYYY-MM-DD
```

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": 1,
  "orderDate": "2024-01-15",
  "deliveryDate": "2024-01-16",
  "items": [
    {
      "productId": 1,
      "quantity": 10,
      "unitPrice": 25.99,
      "discount": 0.00
    }
  ],
  "notes": "Special delivery instructions"
}
```

#### Update Order Status
```http
PATCH /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Order confirmed by customer"
}
```

### Inventory

#### Get Inventory
```http
GET /api/inventory
Authorization: Bearer <token>

Query Parameters:
- warehouseId: number
- productId: number
- lowStock: boolean
```

#### Update Stock
```http
POST /api/inventory/stock-movement
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": 1,
  "warehouseId": 1,
  "movementType": "in|out|adjustment",
  "quantity": 50,
  "reason": "Stock replenishment",
  "referenceNumber": "PO-001"
}
```

## Van Sales Operations

### Van Sales Dashboard
```http
GET /api/van-sales/dashboard
Authorization: Bearer <token>

Response includes:
- Today's sales summary
- Route information
- Customer visits
- Inventory status
- Performance metrics
```

### Route Management
```http
GET /api/routes
POST /api/routes
PUT /api/routes/:id
DELETE /api/routes/:id
```

### Customer Visits
```http
POST /api/visits
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": 1,
  "visitDate": "2024-01-15T10:30:00Z",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "visitType": "sales|delivery|collection",
  "notes": "Customer feedback",
  "orders": [
    {
      "productId": 1,
      "quantity": 5,
      "unitPrice": 25.99
    }
  ]
}
```

### Cash Management
```http
GET /api/cash-management/summary
POST /api/cash-management/transaction
```

## Analytics & Reporting

### Sales Analytics
```http
GET /api/analytics/sales
Authorization: Bearer <token>

Query Parameters:
- period: daily|weekly|monthly|yearly
- dateFrom: YYYY-MM-DD
- dateTo: YYYY-MM-DD
- groupBy: product|customer|area|rep
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSales": 125000.00,
      "totalOrders": 450,
      "averageOrderValue": 277.78,
      "growth": 15.5
    },
    "breakdown": [
      {
        "period": "2024-01-01",
        "sales": 5000.00,
        "orders": 20,
        "customers": 15
      }
    ]
  }
}
```

### Performance Metrics
```http
GET /api/analytics/performance
Authorization: Bearer <token>

Includes:
- Sales rep performance
- Product performance
- Customer analysis
- Route efficiency
```

### Custom Reports
```http
POST /api/reports/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "reportType": "sales|inventory|customer|performance",
  "parameters": {
    "dateFrom": "2024-01-01",
    "dateTo": "2024-01-31",
    "format": "pdf|excel|csv"
  }
}
```

## Real-time Features

### WebSocket Connection
```javascript
const socket = io('https://ss.gonxt.tech', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for real-time updates
socket.on('order_update', (data) => {
  console.log('Order updated:', data);
});

socket.on('inventory_alert', (data) => {
  console.log('Inventory alert:', data);
});

socket.on('new_customer', (data) => {
  console.log('New customer added:', data);
});
```

### Push Notifications
```http
POST /api/notifications/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 1,
  "title": "New Order",
  "message": "You have a new order from ABC Store",
  "type": "order",
  "data": {
    "orderId": 123
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED` (401)
- `INSUFFICIENT_PERMISSIONS` (403)
- `RESOURCE_NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_SERVER_ERROR` (500)

## Rate Limiting

### Limits
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **File Upload**: 10 requests per hour per user

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Security

### Headers Required
```http
Authorization: Bearer <jwt-token>
X-Tenant-Code: <tenant-code>
Content-Type: application/json
```

### Security Features
- JWT authentication with refresh tokens
- Rate limiting per IP and user
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- CSRF protection
- HTTPS enforcement
- Security headers (HSTS, CSP, etc.)

### Data Encryption
- All data in transit encrypted with TLS 1.3
- Sensitive data encrypted at rest
- Password hashing with bcrypt
- JWT tokens with secure signing

## SDK Examples

### JavaScript/Node.js
```javascript
const SalesSyncAPI = require('@salessync/api-client');

const client = new SalesSyncAPI({
  baseURL: 'https://ss.gonxt.tech/api',
  tenantCode: 'DEMO'
});

// Authenticate
await client.auth.login('user@example.com', 'password');

// Get customers
const customers = await client.customers.list({
  page: 1,
  limit: 20,
  search: 'ABC'
});

// Create order
const order = await client.orders.create({
  customerId: 1,
  items: [
    { productId: 1, quantity: 10, unitPrice: 25.99 }
  ]
});
```

### Python
```python
from salessync import SalesSyncClient

client = SalesSyncClient(
    base_url='https://ss.gonxt.tech/api',
    tenant_code='DEMO'
)

# Authenticate
client.auth.login('user@example.com', 'password')

# Get customers
customers = client.customers.list(page=1, limit=20)

# Create order
order = client.orders.create({
    'customerId': 1,
    'items': [
        {'productId': 1, 'quantity': 10, 'unitPrice': 25.99}
    ]
})
```

## Testing

### Health Check
```http
GET /health
```

### API Status
```http
GET /api/health
Authorization: Bearer <token>
```

### Test Endpoints (Development Only)
```http
GET /api/test
POST /api/test/data
```

## Support

For API support and questions:
- Email: api-support@salessync.com
- Documentation: https://docs.salessync.com
- Status Page: https://status.salessync.com

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API release
- Core CRUD operations
- Authentication system
- Real-time features
- Analytics endpoints
- Mobile-first design
- Comprehensive security features