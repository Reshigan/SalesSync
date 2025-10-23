const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SalesSync API',
      version: '1.3.0',
      description: 'Enterprise Field Force & Van Sales Management Platform API',
      contact: {
        name: 'SalesSync Team',
        url: 'https://github.com/Reshigan/SalesSync',
        email: 'support@salessync.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://ss.gonxt.tech/api',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3001/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/login',
        },
        tenantId: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Tenant-ID',
          description: 'Tenant ID for multi-tenant isolation',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@demo.com',
            },
            name: {
              type: 'string',
              example: 'Admin User',
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'agent', 'viewer'],
              example: 'admin',
            },
            tenantId: {
              type: 'integer',
              example: 1,
            },
            active: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00.000Z',
            },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'ABC Corporation',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'contact@abc.com',
            },
            phone: {
              type: 'string',
              example: '+1234567890',
            },
            address: {
              type: 'string',
              example: '123 Main St, City, State 12345',
            },
            type: {
              type: 'string',
              enum: ['retail', 'wholesale', 'distributor'],
              example: 'retail',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended'],
              example: 'active',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Product Name',
            },
            sku: {
              type: 'string',
              example: 'SKU-001',
            },
            price: {
              type: 'number',
              format: 'float',
              example: 99.99,
            },
            stock: {
              type: 'integer',
              example: 100,
            },
            category: {
              type: 'string',
              example: 'Electronics',
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            orderNumber: {
              type: 'string',
              example: 'ORD-001',
            },
            customerId: {
              type: 'integer',
              example: 1,
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              example: 299.99,
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
              example: 'pending',
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'integer' },
                  quantity: { type: 'integer' },
                  price: { type: 'number' },
                },
              },
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Unauthorized - Token required',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Forbidden - Insufficient permissions',
                code: 'FORBIDDEN',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Resource not found',
                code: 'NOT_FOUND',
              },
            },
          },
        },
        BadRequest: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Invalid request parameters',
                code: 'BAD_REQUEST',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Customers',
        description: 'Customer management',
      },
      {
        name: 'Products',
        description: 'Product catalog management',
      },
      {
        name: 'Orders',
        description: 'Order processing and management',
      },
      {
        name: 'Inventory',
        description: 'Inventory tracking',
      },
      {
        name: 'Visits',
        description: 'Field visit management',
      },
      {
        name: 'Dashboard',
        description: 'Dashboard analytics and KPIs',
      },
      {
        name: 'Reports',
        description: 'Report generation',
      },
      {
        name: 'Health',
        description: 'System health check',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/server.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
