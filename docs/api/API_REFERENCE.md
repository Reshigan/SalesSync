# SalesSync API Reference

## Overview
The SalesSync API is a RESTful API that provides access to all SalesSync functionality including authentication, user management, field operations, business data, and analytics.

## Base URL
- **Production**: `https://api.salessync.com/v1`
- **Staging**: `https://staging-api.salessync.com/v1`
- **Development**: `http://localhost:3001/api/v1`

## Authentication
All API requests require authentication using JWT tokens.

### Authentication Flow
1. **Login**: POST `/auth/login` with credentials
2. **Receive Token**: Get JWT access token and refresh token
3. **Use Token**: Include `Authorization: Bearer <token>` header
4. **Refresh Token**: Use refresh token to get new access token

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/login
Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "user@salessync.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@salessync.com",
      "role": "field_agent",
      "first_name": "John",
      "last_name": "Doe"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600
    }
  }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

#### POST /auth/logout
Logout user and invalidate tokens.

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

#### POST /auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@salessync.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### User Management Endpoints

#### GET /users
Get list of users (Admin only).

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20)
- `role` (string): Filter by role
- `search` (string): Search by name or email

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "email": "user@salessync.com",
        "role": "field_agent",
        "first_name": "John",
        "last_name": "Doe",
        "status": "active",
        "created_at": "2024-01-15T10:30:00Z"
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

#### GET /users/:id
Get specific user details.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@salessync.com",
      "role": "field_agent",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+44 20 1234 5678",
      "department": "Sales",
      "manager_id": "mgr_456",
      "status": "active",
      "last_login": "2024-10-17T09:15:00Z",
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### POST /users
Create new user (Admin only).

**Request Body:**
```json
{
  "email": "newuser@salessync.com",
  "password": "tempPassword123",
  "role": "field_agent",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+44 20 9876 5432",
  "department": "Sales"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_789",
      "email": "newuser@salessync.com",
      "role": "field_agent",
      "first_name": "Jane",
      "last_name": "Smith",
      "status": "active",
      "created_at": "2024-10-17T10:30:00Z"
    }
  }
}
```

### Field Operations Endpoints

#### POST /field/location
Update field agent location.

**Request Body:**
```json
{
  "latitude": 51.5074,
  "longitude": -0.1278,
  "accuracy": 5,
  "timestamp": "2024-10-17T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "location_id": "loc_123",
    "agent_id": "user_123",
    "latitude": 51.5074,
    "longitude": -0.1278,
    "accuracy": 5,
    "timestamp": "2024-10-17T10:30:00Z"
  }
}
```

#### GET /field/locations
Get field agent locations (Manager/Admin only).

**Query Parameters:**
- `agent_id` (string): Filter by specific agent
- `start_date` (string): Start date (ISO format)
- `end_date` (string): End date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "location_id": "loc_123",
        "agent_id": "user_123",
        "agent_name": "John Doe",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "accuracy": 5,
        "timestamp": "2024-10-17T10:30:00Z"
      }
    ]
  }
}
```

#### POST /field/board-placement
Record board placement.

**Request Body:**
```json
{
  "board_type": "Premium Billboard",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "photo_url": "https://storage.salessync.com/photos/board_123.jpg",
  "notes": "Placed at main street corner, high visibility",
  "placement_date": "2024-10-17T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "placement_id": "placement_123",
    "agent_id": "user_123",
    "board_type": "Premium Billboard",
    "latitude": 51.5074,
    "longitude": -0.1278,
    "photo_url": "https://storage.salessync.com/photos/board_123.jpg",
    "commission_earned": 50.00,
    "status": "completed",
    "created_at": "2024-10-17T10:30:00Z"
  }
}
```

#### POST /field/product-distribution
Record product distribution.

**Request Body:**
```json
{
  "customer_id": "cust_123",
  "products": [
    {
      "product_id": "prod_456",
      "quantity": 10,
      "unit_price": 25.00
    }
  ],
  "signature_url": "https://storage.salessync.com/signatures/sig_123.png",
  "distribution_date": "2024-10-17T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "distribution_id": "dist_123",
    "agent_id": "user_123",
    "customer_id": "cust_123",
    "total_value": 250.00,
    "commission_earned": 12.50,
    "status": "completed",
    "created_at": "2024-10-17T10:30:00Z"
  }
}
```

### Customer Management Endpoints

#### GET /customers
Get list of customers.

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `search` (string): Search by name or email
- `category` (string): Filter by customer category

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "cust_123",
        "company_name": "ABC Retail Ltd",
        "contact_person": "John Smith",
        "email": "john@abcretail.com",
        "phone": "+44 20 1234 5678",
        "category": "Premium",
        "credit_limit": 50000,
        "status": "active"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "pages": 25
    }
  }
}
```

#### GET /customers/:id
Get specific customer details.

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "cust_123",
      "company_name": "ABC Retail Ltd",
      "contact_person": "John Smith",
      "email": "john@abcretail.com",
      "phone": "+44 20 1234 5678",
      "address": {
        "street": "123 High Street",
        "city": "London",
        "postal_code": "SW1A 1AA",
        "country": "UK"
      },
      "category": "Premium",
      "credit_limit": 50000,
      "payment_terms": "Net 30",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### POST /customers
Create new customer.

**Request Body:**
```json
{
  "company_name": "XYZ Store Chain",
  "contact_person": "Jane Doe",
  "email": "jane@xyzstore.com",
  "phone": "+44 20 9876 5432",
  "address": {
    "street": "456 Market Street",
    "city": "Manchester",
    "postal_code": "M1 1AA",
    "country": "UK"
  },
  "category": "Standard",
  "credit_limit": 25000,
  "payment_terms": "Net 30"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "cust_789",
      "company_name": "XYZ Store Chain",
      "contact_person": "Jane Doe",
      "email": "jane@xyzstore.com",
      "status": "active",
      "created_at": "2024-10-17T10:30:00Z"
    }
  }
}
```

### Product Management Endpoints

#### GET /products
Get list of products.

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `category` (string): Filter by category
- `search` (string): Search by name or SKU

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_123",
        "name": "Premium Widget A",
        "sku": "PWA001",
        "category": "Widgets",
        "price": 25.00,
        "cost": 15.00,
        "stock_quantity": 100,
        "status": "active"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 200,
      "pages": 10
    }
  }
}
```

#### GET /products/:id
Get specific product details.

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod_123",
      "name": "Premium Widget A",
      "description": "High-quality widget for professional use",
      "sku": "PWA001",
      "category": "Widgets",
      "price": 25.00,
      "cost": 15.00,
      "weight": 0.5,
      "dimensions": {
        "length": 10,
        "width": 5,
        "height": 2
      },
      "stock_quantity": 100,
      "reorder_level": 20,
      "images": [
        "https://storage.salessync.com/products/prod_123_1.jpg"
      ],
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Order Management Endpoints

#### GET /orders
Get list of orders.

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `status` (string): Filter by order status
- `customer_id` (string): Filter by customer
- `start_date` (string): Start date filter
- `end_date` (string): End date filter

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_123",
        "customer_id": "cust_123",
        "customer_name": "ABC Retail Ltd",
        "total": 375.00,
        "status": "pending",
        "order_date": "2024-10-17T10:30:00Z",
        "items_count": 2
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1000,
      "pages": 50
    }
  }
}
```

#### POST /orders
Create new order.

**Request Body:**
```json
{
  "customer_id": "cust_123",
  "items": [
    {
      "product_id": "prod_123",
      "quantity": 10,
      "unit_price": 25.00,
      "discount": 0.05
    }
  ],
  "notes": "Urgent delivery required"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_789",
      "customer_id": "cust_123",
      "subtotal": 237.50,
      "tax": 47.50,
      "total": 285.00,
      "status": "pending",
      "created_at": "2024-10-17T10:30:00Z"
    }
  }
}
```

### Analytics Endpoints

#### GET /analytics/dashboard
Get dashboard analytics data.

**Query Parameters:**
- `period` (string): Time period (day, week, month, year)
- `start_date` (string): Custom start date
- `end_date` (string): Custom end date

**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "total_sales": 125000,
      "active_agents": 45,
      "orders_count": 150,
      "avg_order_value": 833.33
    },
    "sales_trend": [
      {"date": "2024-10-01", "sales": 4500},
      {"date": "2024-10-02", "sales": 5200}
    ],
    "top_products": [
      {"product_id": "prod_123", "name": "Premium Widget A", "sales": 15000}
    ],
    "agent_performance": [
      {"agent_id": "user_123", "name": "John Doe", "commission": 1250}
    ]
  }
}
```

#### GET /analytics/sales
Get detailed sales analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "sales_by_period": [
      {"period": "2024-10", "sales": 125000, "orders": 150}
    ],
    "sales_by_region": [
      {"region": "London", "sales": 45000, "percentage": 36}
    ],
    "sales_by_product": [
      {"product_id": "prod_123", "sales": 25000, "quantity": 1000}
    ]
  }
}
```

### Commission Endpoints

#### GET /commissions
Get commission data.

**Query Parameters:**
- `agent_id` (string): Filter by agent (optional for agents)
- `period` (string): Time period
- `status` (string): Commission status (pending, paid)

**Response:**
```json
{
  "success": true,
  "data": {
    "commissions": [
      {
        "id": "comm_123",
        "agent_id": "user_123",
        "agent_name": "John Doe",
        "type": "board_placement",
        "amount": 50.00,
        "status": "pending",
        "earned_date": "2024-10-17T10:30:00Z"
      }
    ],
    "summary": {
      "total_pending": 1250.00,
      "total_paid": 5000.00,
      "current_month": 750.00
    }
  }
}
```

### File Upload Endpoints

#### POST /upload/photo
Upload photo file.

**Request:** Multipart form data with file

**Response:**
```json
{
  "success": true,
  "data": {
    "file_id": "file_123",
    "url": "https://storage.salessync.com/photos/file_123.jpg",
    "filename": "board_placement.jpg",
    "size": 2048576,
    "mime_type": "image/jpeg"
  }
}
```

#### POST /upload/signature
Upload signature image.

**Request:** Base64 encoded image data

**Request Body:**
```json
{
  "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "signature_id": "sig_123",
    "url": "https://storage.salessync.com/signatures/sig_123.png"
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
    "details": {
      "email": ["Email is required"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_REQUIRED` - Authentication token required
- `INVALID_TOKEN` - JWT token invalid or expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `RATE_LIMIT_EXCEEDED` - API rate limit exceeded
- `INTERNAL_ERROR` - Server internal error

## Rate Limiting
- **Authenticated requests**: 1000 requests per hour per user
- **Authentication endpoints**: 10 requests per minute per IP
- **File uploads**: 100 requests per hour per user

Rate limit headers included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1634567890
```

## Pagination
List endpoints support pagination with the following parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

Pagination response format:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

## Filtering and Sorting
Many endpoints support filtering and sorting:
- `search` - Text search
- `sort` - Sort field (e.g., `created_at`, `name`)
- `order` - Sort order (`asc` or `desc`)
- Custom filters vary by endpoint

## WebSocket API
Real-time updates available via WebSocket connection:

**Connection:** `wss://api.salessync.com/ws`

**Authentication:** Send JWT token after connection
```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Event Types:**
- `location_update` - Agent location updates
- `board_placement` - New board placements
- `product_distribution` - Product distributions
- `order_update` - Order status changes

## SDK and Libraries
Official SDKs available for:
- JavaScript/TypeScript
- React Native
- Python
- PHP

## API Versioning
- Current version: `v1`
- Version specified in URL: `/api/v1/`
- Backward compatibility maintained within major versions
- Deprecation notices provided 6 months before removal

## Support and Documentation
- **API Documentation**: https://docs.salessync.com/api
- **Postman Collection**: Available for download
- **OpenAPI Spec**: Available at `/api/v1/openapi.json`
- **Support**: api-support@salessync.com