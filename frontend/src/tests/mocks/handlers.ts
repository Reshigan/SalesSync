// MSW handlers for API mocking
import { rest } from 'msw'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const handlers = [
  // Authentication endpoints
  rest.post(`${API_URL}/api/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'FIELD_AGENT',
          status: 'ACTIVE',
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      })
    )
  }),

  rest.post(`${API_URL}/api/auth/refresh`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: 'new-mock-jwt-token',
        refreshToken: 'new-mock-refresh-token',
      })
    )
  }),

  rest.post(`${API_URL}/api/auth/logout`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }))
  }),

  // Customer endpoints
  rest.get(`${API_URL}/api/customers`, (req, res, ctx) => {
    const page = req.url.searchParams.get('page') || '1'
    const limit = req.url.searchParams.get('limit') || '20'
    
    return res(
      ctx.status(200),
      ctx.json({
        customers: [
          {
            id: 'customer-1',
            name: 'Test Customer 1',
            email: 'customer1@example.com',
            phone: '+1234567890',
            address: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            customerType: 'RETAIL',
            status: 'ACTIVE',
            latitude: 40.7128,
            longitude: -74.0060,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'customer-2',
            name: 'Test Customer 2',
            email: 'customer2@example.com',
            phone: '+1234567891',
            address: '456 Test Ave',
            city: 'Test City',
            state: 'TS',
            zipCode: '12346',
            customerType: 'WHOLESALE',
            status: 'ACTIVE',
            latitude: 40.7589,
            longitude: -73.9851,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 2,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 1,
      })
    )
  }),

  rest.get(`${API_URL}/api/customers/nearby`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 'customer-1',
          name: 'Nearby Customer',
          email: 'nearby@example.com',
          phone: '+1234567890',
          address: '123 Nearby St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          customerType: 'RETAIL',
          status: 'ACTIVE',
          latitude: 40.7128,
          longitude: -74.0060,
          distance: 50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
    )
  }),

  rest.post(`${API_URL}/api/customers`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'new-customer-id',
        name: 'New Customer',
        email: 'new@example.com',
        phone: '+1234567892',
        address: '789 New St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12347',
        customerType: 'RETAIL',
        status: 'ACTIVE',
        latitude: 40.7128,
        longitude: -74.0060,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    )
  }),

  rest.get(`${API_URL}/api/customers/:id`, (req, res, ctx) => {
    const { id } = req.params
    return res(
      ctx.status(200),
      ctx.json({
        id,
        name: 'Test Customer',
        email: 'customer@example.com',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        customerType: 'RETAIL',
        status: 'ACTIVE',
        latitude: 40.7128,
        longitude: -74.0060,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    )
  }),

  // Visit endpoints
  rest.get(`${API_URL}/api/visits`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        visits: [
          {
            id: 'visit-1',
            customerId: 'customer-1',
            agentId: 'user-1',
            scheduledDate: new Date().toISOString(),
            status: 'SCHEDULED',
            visitType: 'SALES',
            purpose: 'Product demonstration',
            notes: 'Test visit notes',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      })
    )
  }),

  rest.post(`${API_URL}/api/visits`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'new-visit-id',
        customerId: 'customer-1',
        agentId: 'user-1',
        scheduledDate: new Date().toISOString(),
        status: 'SCHEDULED',
        visitType: 'SALES',
        purpose: 'New visit',
        notes: 'New visit notes',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    )
  }),

  rest.post(`${API_URL}/api/visits/:id/checkin`, (req, res, ctx) => {
    const { id } = req.params
    return res(
      ctx.status(200),
      ctx.json({
        id,
        status: 'IN_PROGRESS',
        checkinTime: new Date().toISOString(),
        checkinLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
      })
    )
  }),

  rest.post(`${API_URL}/api/visits/:id/checkout`, (req, res, ctx) => {
    const { id } = req.params
    return res(
      ctx.status(200),
      ctx.json({
        id,
        status: 'COMPLETED',
        checkoutTime: new Date().toISOString(),
        checkoutLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
      })
    )
  }),

  // Board endpoints
  rest.get(`${API_URL}/api/boards`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        boards: [
          {
            id: 'board-1',
            customerId: 'customer-1',
            agentId: 'user-1',
            boardType: 'BANNER',
            size: '4x8',
            brand: 'Test Brand',
            status: 'ACTIVE',
            placementDate: new Date().toISOString(),
            photos: ['photo1.jpg', 'photo2.jpg'],
            coverageScore: 85,
            commissionAmount: 100,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      })
    )
  }),

  rest.post(`${API_URL}/api/boards/placements`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'new-board-id',
        customerId: 'customer-1',
        agentId: 'user-1',
        boardType: 'BANNER',
        size: '4x8',
        brand: 'Test Brand',
        status: 'PENDING_APPROVAL',
        placementDate: new Date().toISOString(),
        photos: ['new-photo.jpg'],
        coverageScore: 0,
        commissionAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    )
  }),

  rest.post(`${API_URL}/api/boards/:id/analyze`, (req, res, ctx) => {
    const { id } = req.params
    return res(
      ctx.status(200),
      ctx.json({
        id,
        coverageScore: 85,
        analysis: {
          visibility: 'GOOD',
          positioning: 'OPTIMAL',
          lighting: 'ADEQUATE',
          obstructions: 'MINIMAL',
        },
        recommendations: [
          'Consider adjusting angle for better visibility',
          'Ensure regular cleaning for optimal appearance',
        ],
      })
    )
  }),

  // Product endpoints
  rest.get(`${API_URL}/api/products`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        products: [
          {
            id: 'product-1',
            name: 'Test Product',
            category: 'SIM_CARD',
            brand: 'Test Brand',
            price: 29.99,
            commissionRate: 0.1,
            status: 'ACTIVE',
            description: 'Test product description',
            specifications: { color: 'blue', size: 'standard' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      })
    )
  }),

  rest.post(`${API_URL}/api/products/distributions`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'new-distribution-id',
        productId: 'product-1',
        customerId: 'customer-1',
        agentId: 'user-1',
        quantity: 10,
        distributionDate: new Date().toISOString(),
        status: 'COMPLETED',
        recipientInfo: {
          name: 'John Doe',
          signature: 'signature-data',
          idVerification: 'id-photo.jpg',
        },
        commissionAmount: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    )
  }),

  // Commission endpoints
  rest.get(`${API_URL}/api/commissions`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        commissions: [
          {
            id: 'commission-1',
            agentId: 'user-1',
            type: 'BOARD_PLACEMENT',
            amount: 100,
            status: 'PENDING',
            description: 'Board placement commission',
            referenceId: 'board-1',
            calculatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      })
    )
  }),

  rest.get(`${API_URL}/api/commissions/summary`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        totalEarnings: 1500,
        pendingCommissions: 300,
        paidCommissions: 1200,
        thisMonthEarnings: 500,
        lastMonthEarnings: 400,
        averageMonthlyEarnings: 450,
        commissionsByType: {
          BOARD_PLACEMENT: 800,
          PRODUCT_DISTRIBUTION: 400,
          VISIT_BONUS: 200,
          PERFORMANCE_BONUS: 100,
        },
      })
    )
  }),

  // Survey endpoints
  rest.get(`${API_URL}/api/surveys`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        surveys: [
          {
            id: 'survey-1',
            title: 'Customer Satisfaction Survey',
            description: 'Collect customer feedback',
            status: 'ACTIVE',
            questions: [
              {
                id: 'q1',
                type: 'RATING',
                question: 'How satisfied are you with our service?',
                required: true,
                options: ['1', '2', '3', '4', '5'],
              },
              {
                id: 'q2',
                type: 'TEXT',
                question: 'Any additional comments?',
                required: false,
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      })
    )
  }),

  rest.post(`${API_URL}/api/surveys/:id/responses`, (req, res, ctx) => {
    const { id } = req.params
    return res(
      ctx.status(201),
      ctx.json({
        id: 'new-response-id',
        surveyId: id,
        customerId: 'customer-1',
        agentId: 'user-1',
        responses: {
          q1: '5',
          q2: 'Great service!',
        },
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    )
  }),

  // Analytics endpoints
  rest.get(`${API_URL}/api/analytics/dashboard`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        activeAgents: 25,
        visitsToday: 45,
        totalCustomers: 1250,
        boardPlacements: 180,
        productDistributions: 320,
        totalCommissions: 15000,
        completedVisits: 890,
        pendingVisits: 45,
        averageVisitDuration: 35,
        customerSatisfactionScore: 4.2,
      })
    )
  }),

  // File upload endpoints
  rest.post(`${API_URL}/api/upload`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        url: 'https://example.com/uploaded-file.jpg',
        filename: 'uploaded-file.jpg',
        size: 1024000,
        type: 'image/jpeg',
      })
    )
  }),

  // Error handlers for testing error scenarios
  rest.get(`${API_URL}/api/error/500`, (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Internal server error' }))
  }),

  rest.get(`${API_URL}/api/error/401`, (req, res, ctx) => {
    return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }))
  }),

  rest.get(`${API_URL}/api/error/404`, (req, res, ctx) => {
    return res(ctx.status(404), ctx.json({ error: 'Not found' }))
  }),

  // Catch-all handler for unhandled requests
  rest.all('*', (req, res, ctx) => {
    console.warn(`Unhandled ${req.method} request to ${req.url}`)
    return res(
      ctx.status(404),
      ctx.json({ error: `Unhandled ${req.method} request to ${req.url}` })
    )
  }),
]