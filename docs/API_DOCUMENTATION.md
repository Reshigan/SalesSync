# SalesSync API Documentation

Comprehensive API documentation for the SalesSync field sales management system.

## 📋 Overview

The SalesSync API provides RESTful endpoints for managing field sales operations, including user management, customer relationships, order processing, and inventory tracking.

### Base URLs
- **Development**: `http://localhost:3001/api`
- **Production**: `https://ss.gonxt.tech/api`
- **API Documentation**: `https://ss.gonxt.tech/api/docs`

### API Version
Current API version: `v1`

## 🔐 Authentication

All API endpoints require authentication using JWT (JSON Web Tokens).

### Authentication Flow
1. **Login**: Obtain JWT token using credentials
2. **Authorization**: Include token in `Authorization` header
3. **Refresh**: Use refresh token to obtain new access token
4. **Logout**: Invalidate tokens on logout

### Login Endpoint
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "Field Agent",
      "tenant": "Company Name",
      "permissions": ["read:orders", "create:orders"]
    }
  }
}
```

### Token Refresh
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
Authorization: Bearer <access_token>
```

### Authorization Header
Include the JWT token in all authenticated requests:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 👥 User Management

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Get All Users
```http
GET /api/users
Authorization: Bearer <token>
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 10)
  - search: string
  - role: string
  - tenant: string
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "fullName": "John Doe",
        "role": "Field Agent",
        "tenant": "Company Name",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 177,
      "pages": 18
    }
  }
}
```

### Create User
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "fullName": "New User",
  "password": "securePassword123",
  "role": "Field Agent",
  "tenant": "Company Name",
  "phone": "+1234567890",
  "location": "Lagos, Nigeria"
}
```

### Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Updated Name",
  "role": "Sales Manager",
  "phone": "+1234567891",
  "isActive": true
}
```

### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

## 🏢 Customer Management

### Get All Customers
```http
GET /api/customers
Authorization: Bearer <token>
Query Parameters:
  - page: number
  - limit: number
  - search: string
  - customerType: string (Retail|Wholesale)
  - city: string
  - state: string
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "uuid",
        "name": "ABC Store",
        "email": "abc@store.com",
        "phone": "+234123456789",
        "address": "123 Main Street",
        "city": "Lagos",
        "state": "Lagos",
        "country": "Nigeria",
        "customerType": "Retail",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 89,
      "pages": 9
    }
  }
}
```

### Create Customer
```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Customer Store",
  "email": "customer@example.com",
  "phone": "+234123456789",
  "address": "456 Business Avenue",
  "city": "Abuja",
  "state": "FCT",
  "country": "Nigeria",
  "customerType": "Wholesale"
}
```

### Update Customer
```http
PUT /api/customers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Store Name",
  "phone": "+234987654321",
  "address": "New Address"
}
```

### Get Customer Details
```http
GET /api/customers/:id
Authorization: Bearer <token>
```

### Get Customer Orders
```http
GET /api/customers/:id/orders
Authorization: Bearer <token>
```

## 🛒 Order Management

### Get All Orders
```http
GET /api/orders
Authorization: Bearer <token>
Query Parameters:
  - page: number
  - limit: number
  - status: string (pending|confirmed|processing|shipped|delivered|cancelled)
  - customerId: string
  - salesAgentId: string
  - dateFrom: string (ISO date)
  - dateTo: string (ISO date)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-001",
        "customerId": "uuid",
        "customer": {
          "id": "uuid",
          "name": "ABC Store",
          "email": "abc@store.com"
        },
        "salesAgentId": "uuid",
        "salesAgent": {
          "id": "uuid",
          "fullName": "John Doe"
        },
        "items": [
          {
            "id": "uuid",
            "productId": "uuid",
            "product": {
              "name": "Product Name",
              "sku": "PROD-001"
            },
            "quantity": 2,
            "unitPrice": 1500,
            "totalPrice": 3000
          }
        ],
        "totalAmount": 15000,
        "status": "pending",
        "orderDate": "2024-01-15",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 156,
      "pages": 16
    }
  }
}
```

### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "unitPrice": 1500
    },
    {
      "productId": "uuid",
      "quantity": 1,
      "unitPrice": 2500
    }
  ],
  "notes": "Special delivery instructions"
}
```

### Update Order Status
```http
PUT /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Order confirmed by customer"
}
```

### Get Order Details
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

### Cancel Order
```http
DELETE /api/orders/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Customer requested cancellation"
}
```

## 📦 Product & Inventory Management

### Get All Products
```http
GET /api/products
Authorization: Bearer <token>
Query Parameters:
  - page: number
  - limit: number
  - search: string
  - category: string
  - inStock: boolean
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Premium Product",
        "description": "High-quality product description",
        "sku": "PROD-001",
        "category": "Electronics",
        "price": 2500,
        "stockQuantity": 150,
        "minStockLevel": 10,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Product",
  "description": "Product description",
  "sku": "PROD-002",
  "category": "Electronics",
  "price": 3000,
  "stockQuantity": 100,
  "minStockLevel": 15
}
```

### Update Product
```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Product Name",
  "price": 3500,
  "stockQuantity": 120
}
```

### Update Stock Level
```http
PUT /api/products/:id/stock
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 50,
  "type": "adjustment", // "adjustment" | "restock" | "sale"
  "notes": "Stock adjustment reason"
}
```

## 📊 Analytics & Reporting

### Dashboard Statistics
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
Query Parameters:
  - period: string (today|week|month|year)
  - salesAgentId: string (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 156,
    "todayOrders": 12,
    "totalCustomers": 89,
    "totalRevenue": 4560000,
    "pendingOrders": 8,
    "topProducts": [
      {
        "productId": "uuid",
        "name": "Product Name",
        "totalSold": 45,
        "revenue": 112500
      }
    ],
    "salesTrend": [
      {
        "date": "2024-01-01",
        "orders": 5,
        "revenue": 75000
      }
    ]
  }
}
```

### Sales Report
```http
GET /api/analytics/sales
Authorization: Bearer <token>
Query Parameters:
  - dateFrom: string (ISO date)
  - dateTo: string (ISO date)
  - salesAgentId: string
  - customerId: string
  - format: string (json|csv|pdf)
```

### Customer Analytics
```http
GET /api/analytics/customers
Authorization: Bearer <token>
Query Parameters:
  - period: string
  - customerType: string
```

## 🔧 System Management

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "connected",
    "cache": "connected",
    "external_apis": "connected"
  }
}
```

### System Information
```http
GET /api/system/info
Authorization: Bearer <token>
```

## 📱 Mobile API Endpoints

### Sync Data
```http
POST /api/mobile/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "lastSyncTimestamp": "2024-01-15T10:00:00Z",
  "deviceId": "device-uuid",
  "offlineData": {
    "orders": [],
    "customers": [],
    "products": []
  }
}
```

### Upload Location
```http
POST /api/mobile/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 6.5244,
  "longitude": 3.3792,
  "timestamp": "2024-01-15T10:30:00Z",
  "accuracy": 10
}
```

## 🚨 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "Email is required"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### HTTP Status Codes
- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid request data
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource already exists
- `422` - Unprocessable Entity: Validation error
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

### Common Error Codes
- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `VALIDATION_ERROR`: Request data validation failed
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `DUPLICATE_RESOURCE`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVER_ERROR`: Internal server error

## 🔒 Security

### Rate Limiting
- **Authentication endpoints**: 5 requests per minute
- **General API endpoints**: 100 requests per minute
- **Bulk operations**: 10 requests per minute

### Input Validation
- All inputs are validated and sanitized
- SQL injection protection
- XSS prevention
- CSRF protection for web requests

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

## 📋 API Testing

### Postman Collection
Import the Postman collection for easy API testing:
```
https://ss.gonxt.tech/api/postman-collection.json
```

### cURL Examples

**Login:**
```bash
curl -X POST https://ss.gonxt.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}'
```

**Get Users:**
```bash
curl -X GET https://ss.gonxt.tech/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create Order:**
```bash
curl -X POST https://ss.gonxt.tech/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"uuid","items":[{"productId":"uuid","quantity":2,"unitPrice":1500}]}'
```

## 📞 Support

For API support:
- **Documentation**: This comprehensive guide
- **Postman Collection**: Test endpoints interactively
- **Error Logs**: Check application logs for debugging
- **Contact**: development team for technical issues

---

**SalesSync API** - Powering field sales operations 🚀