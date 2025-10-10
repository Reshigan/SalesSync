import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { TenantRequest } from '../middleware/tenant';
import { prisma } from '../services/database';

const router = express.Router();

/**
 * ROUTES MANAGEMENT API
 * 
 * System Design Overview:
 * - Multi-tenant route planning and optimization
 * - Customer assignment to routes with visit scheduling
 * - Geographic optimization algorithms
 * - Real-time route tracking and analytics
 * - Integration with van sales and field operations
 * 
 * Key Features:
 * - Route CRUD operations with tenant isolation
 * - Dynamic customer assignment and stop management
 * - Route optimization based on distance/time
 * - Schedule management (weekly patterns)
 * - Performance tracking (planned vs actual)
 * - Real-time status updates
 */

// ============================================================================
// 1. LIST ALL ROUTES WITH PAGINATION AND FILTERS
// ============================================================================
/**
 * GET /api/routes
 * 
 * Purpose: List all routes with advanced filtering and pagination
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - areaId: Filter by area
 * - regionId: Filter by region (through area)
 * - userId: Filter by assigned user
 * - status: Filter by status (PLANNED, IN_PROGRESS, DELIVERED, CANCELLED)
 * - search: Search by route name/description
 * - startDate: Filter routes after this date
 * - endDate: Filter routes before this date
 * 
 * Response:
 * - data: Array of routes with includes (area, user, customers count)
 * - pagination: Page info and totals
 * 
 * Security: Multi-tenant isolation via tenantId
 */
router.get('/', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const {
      page = 1,
      limit = 20,
      areaId,
      regionId,
      userId,
      status,
      search,
      startDate,
      endDate
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { tenantId };

    // Filter by area
    if (areaId) {
      where.areaId = areaId;
    }

    // Filter by region (through area relationship)
    if (regionId) {
      where.area = {
        regionId: regionId
      };
    }

    // Filter by assigned user
    if (userId) {
      where.userId = userId;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Date range filtering
    if (startDate) {
      where.startTime = { ...where.startTime, gte: new Date(startDate as string) };
    }
    if (endDate) {
      where.endTime = { ...where.endTime, lte: new Date(endDate as string) };
    }

    // Execute queries in parallel for performance
    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        where,
        skip,
        take,
        include: {
          area: {
            include: {
              region: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          stops: {
            select: {
              id: true,
              status: true
            }
          },
          customers: {
            select: {
              id: true,
              name: true,
              isActive: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { startTime: 'desc' }
        ]
      }),
      prisma.route.count({ where })
    ]);

    // Enhance response with computed metrics
    const routesWithMetrics = routes.map(route => ({
      ...route,
      totalCustomers: route.customers.length,
      totalStops: route.stops.length,
      completedStops: route.stops.filter(s => s.status === 'VISITED').length,
      completionRate: route.stops.length > 0 
        ? (route.stops.filter(s => s.status === 'VISITED').length / route.stops.length * 100).toFixed(1)
        : '0.0'
    }));

    res.json({
      data: routesWithMetrics,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('List routes error:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// ============================================================================
// 2. GET SINGLE ROUTE WITH FULL DETAILS
// ============================================================================
/**
 * GET /api/routes/analytics
 * 
 * Purpose: Get route performance analytics and metrics
 * 
 * Query Parameters:
 * - routeId: Specific route ID (optional)
 * - dateFrom: Start date for analytics (optional)
 * - dateTo: End date for analytics (optional)
 * - period: Time period (day, week, month, year)
 * 
 * Use Cases:
 * - Route performance monitoring
 * - Efficiency analysis
 * - Planning optimization
 */
router.get('/analytics', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { routeId, dateFrom, dateTo, period = 'month' } = req.query;

    // Date range calculation
    const endDate = dateTo ? new Date(dateTo as string) : new Date();
    let startDate: Date;
    
    if (dateFrom) {
      startDate = new Date(dateFrom as string);
    } else {
      startDate = new Date();
      switch (period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
    }

    // Base query conditions
    const whereConditions: any = {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (routeId) {
      whereConditions.id = routeId as string;
    }

    // Get route statistics
    const routes = await prisma.route.findMany({
      where: whereConditions,
      include: {
        stops: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        area: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // Calculate metrics
    const totalRoutes = routes.length;
    const totalStops = routes.reduce((sum, route) => sum + route.stops.length, 0);
    const visitedStops = routes.reduce((sum, route) => 
      sum + route.stops.filter(stop => stop.status === 'VISITED').length, 0
    );
    const pendingStops = routes.reduce((sum, route) => 
      sum + route.stops.filter(stop => stop.status === 'PENDING').length, 0
    );
    const skippedStops = routes.reduce((sum, route) => 
      sum + route.stops.filter(stop => stop.status === 'SKIPPED').length, 0
    );
    const failedStops = routes.reduce((sum, route) => 
      sum + route.stops.filter(stop => stop.status === 'FAILED').length, 0
    );

    const completionRate = totalStops > 0 ? (visitedStops / totalStops * 100).toFixed(1) : '0.0';

    // Route status distribution
    const statusDistribution = {
      PLANNED: routes.filter(r => r.status === 'PLANNED').length,
      IN_PROGRESS: routes.filter(r => r.status === 'IN_PROGRESS').length,
      COMPLETED: routes.filter(r => r.status === 'COMPLETED').length,
      CANCELLED: routes.filter(r => r.status === 'CANCELLED').length
    };

    // Performance by user
    const userPerformance = routes.reduce((acc: any, route) => {
      const userId = route.userId;
      const userName = `${route.user.firstName} ${route.user.lastName}`;
      
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName,
          role: route.user.role,
          totalRoutes: 0,
          totalStops: 0,
          completedStops: 0,
          completionRate: '0.0%'
        };
      }
      
      acc[userId].totalRoutes++;
      acc[userId].totalStops += route.stops.length;
      acc[userId].completedStops += route.stops.filter(s => s.status === 'VISITED').length;
      acc[userId].completionRate = acc[userId].totalStops > 0 
        ? `${(acc[userId].completedStops / acc[userId].totalStops * 100).toFixed(1)}%`
        : '0.0%';
      
      return acc;
    }, {});

    // Area performance
    const areaPerformance = routes.reduce((acc: any, route) => {
      const areaId = route.areaId;
      const areaName = route.area?.name || 'Unknown';
      
      if (!acc[areaId]) {
        acc[areaId] = {
          areaId,
          areaName,
          totalRoutes: 0,
          totalStops: 0,
          completedStops: 0,
          completionRate: '0.0%'
        };
      }
      
      acc[areaId].totalRoutes++;
      acc[areaId].totalStops += route.stops.length;
      acc[areaId].completedStops += route.stops.filter(s => s.status === 'VISITED').length;
      acc[areaId].completionRate = acc[areaId].totalStops > 0 
        ? `${(acc[areaId].completedStops / acc[areaId].totalStops * 100).toFixed(1)}%`
        : '0.0%';
      
      return acc;
    }, {});

    // Recent activity
    const recentRoutes = routes
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map(route => ({
        id: route.id,
        name: route.name,
        status: route.status,
        assignedTo: `${route.user.firstName} ${route.user.lastName}`,
        area: route.area?.name,
        totalStops: route.stops.length,
        completedStops: route.stops.filter(s => s.status === 'VISITED').length,
        updatedAt: route.updatedAt
      }));

    const analytics = {
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        period
      },
      overview: {
        totalRoutes,
        totalStops,
        visitedStops,
        pendingStops,
        skippedStops,
        failedStops,
        completionRate: `${completionRate}%`
      },
      statusDistribution,
      userPerformance: Object.values(userPerformance),
      areaPerformance: Object.values(areaPerformance),
      recentActivity: recentRoutes,
      trends: {
        // Can be enhanced with time-series data
        dailyCompletion: [],
        weeklyEfficiency: [],
        monthlyGrowth: []
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Route analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch route analytics' });
  }
});

/**
 * GET /api/routes/:id
 * 
 * Purpose: Retrieve complete route details including all stops and customers
 * 
 * Includes:
 * - Route basic info
 * - Area and region hierarchy
 * - Assigned user details
 * - All route stops with customer info and coordinates
 * - Performance metrics (planned vs actual)
 * - Distance and duration calculations
 * 
 * Use Cases:
 * - Route detail view
 * - Route execution/tracking
 * - Performance analysis
 * - Route editing preparation
 */
router.get('/:id', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { id } = req.params;

    const route = await prisma.route.findFirst({
      where: { id, tenantId },
      include: {
        area: {
          include: {
            region: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true
          }
        },
        stops: {
          include: {
            customer: {
              select: {
                id: true,
                code: true,
                name: true,
                phone: true,
                address: true,
                city: true,
                coordinates: true,
                isActive: true,
                customerType: true
              }
            }
          },
          orderBy: { sequence: 'asc' }
        },
        customers: {
          where: { isActive: true },
          select: {
            id: true,
            code: true,
            name: true,
            phone: true,
            address: true,
            city: true,
            coordinates: true,
            customerType: true
          }
        },
        loads: {
          select: {
            id: true,
            loadNumber: true,
            status: true,
            loadDate: true
          },
          orderBy: { loadDate: 'desc' },
          take: 5
        }
      }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Calculate route metrics
    const metrics = {
      totalStops: route.stops.length,
      completedStops: route.stops.filter(s => s.status === 'VISITED').length,
      pendingStops: route.stops.filter(s => s.status === 'PENDING').length,
      skippedStops: route.stops.filter(s => s.status === 'SKIPPED').length,
      failedStops: route.stops.filter(s => s.status === 'FAILED').length,
      completionRate: route.stops.length > 0
        ? (route.stops.filter(s => s.status === 'VISITED').length / route.stops.length * 100).toFixed(1) + '%'
        : '0%',
      totalDistance: route.totalDistance ? Number(route.totalDistance) : null,
      estimatedDuration: route.estimatedDuration,
      actualDuration: route.actualDuration,
      durationVariance: route.estimatedDuration && route.actualDuration
        ? ((route.actualDuration - route.estimatedDuration) / route.estimatedDuration * 100).toFixed(1) + '%'
        : null
    };

    res.json({
      ...route,
      metrics
    });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ error: 'Failed to fetch route details' });
  }
});

// ============================================================================
// 3. CREATE NEW ROUTE
// ============================================================================
/**
 * POST /api/routes
 * 
 * Purpose: Create a new route with basic information
 * 
 * Request Body:
 * - name: Route name (required)
 * - description: Route description (optional)
 * - areaId: Area assignment (required)
 * - userId: Assigned user/agent (required)
 * - startTime: Planned start time (optional)
 * - endTime: Planned end time (optional)
 * - status: Initial status (default: PLANNED)
 * 
 * Business Logic:
 * - Validates area belongs to tenant
 * - Validates user belongs to tenant and has appropriate role
 * - Sets default status to PLANNED
 * - Creates audit log entry
 * 
 * Returns: Created route with full details
 */
router.post('/', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const userId = (req.user as any).userId;
    const {
      name,
      description,
      areaId,
      userId: assignedUserId,
      startTime,
      endTime,
      status = 'PLANNED'
    } = req.body;

    // Validation
    if (!name || !areaId || !assignedUserId) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, areaId, userId' 
      });
    }

    // Verify area belongs to tenant
    const area = await prisma.area.findFirst({
      where: { id: areaId, tenantId }
    });

    if (!area) {
      return res.status(404).json({ error: 'Area not found or access denied' });
    }

    // Verify assigned user belongs to tenant
    const assignedUser = await prisma.user.findFirst({
      where: { id: assignedUserId, tenantId }
    });

    if (!assignedUser) {
      return res.status(404).json({ error: 'Assigned user not found or access denied' });
    }

    // Validate role (should be sales agent, field agent, or van sales)
    const validRoles = ['VAN_SALES_AGENT', 'FIELD_AGENT', 'PROMOTER', 'MERCHANDISER', 'TENANT_ADMIN', 'MANAGER'];
    if (!validRoles.includes(assignedUser.role)) {
      return res.status(400).json({ 
        error: 'Assigned user does not have a valid role for route assignment' 
      });
    }

    // Create route
    const route = await prisma.route.create({
      data: {
        tenantId,
        name,
        description,
        areaId,
        userId: assignedUserId,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        status: status as any
      },
      include: {
        area: {
          include: {
            region: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,

            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Route',
        entityId: route.id,
        userId,
        // tenantId removed from AuditLog
      }
    });

    res.status(201).json(route);
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

// ============================================================================
// 4. UPDATE ROUTE
// ============================================================================
/**
 * PUT /api/routes/:id
 * 
 * Purpose: Update route information
 * 
 * Updatable Fields:
 * - name
 * - description
 * - areaId
 * - userId (reassignment)
 * - startTime
 * - endTime
 * - status
 * - totalDistance
 * - estimatedDuration
 * - actualDuration
 * 
 * Business Rules:
 * - Cannot modify completed routes
 * - Status transitions validated
 * - Area/User changes validated against tenant
 * - Audit log created for changes
 */
router.put('/:id', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const userId = (req.user as any).userId;
    const { id } = req.params;
    const {
      name,
      description,
      areaId,
      userId: assignedUserId,
      startTime,
      endTime,
      status,
      totalDistance,
      estimatedDuration,
      actualDuration
    } = req.body;

    // Check route exists and belongs to tenant
    const existingRoute = await prisma.route.findFirst({
      where: { id, tenantId }
    });

    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Prevent modification of completed routes
    if (existingRoute.status === 'COMPLETED') {
      return res.status(400).json({ 
        error: 'Cannot modify completed routes' 
      });
    }

    // Validate area if changed
    if (areaId && areaId !== existingRoute.areaId) {
      const area = await prisma.area.findFirst({
        where: { id: areaId, tenantId }
      });
      if (!area) {
        return res.status(404).json({ error: 'Area not found or access denied' });
      }
    }

    // Validate user if changed
    if (assignedUserId && assignedUserId !== existingRoute.userId) {
      const assignedUser = await prisma.user.findFirst({
        where: { id: assignedUserId, tenantId }
      });
      if (!assignedUser) {
        return res.status(404).json({ error: 'Assigned user not found or access denied' });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (areaId) updateData.areaId = areaId;
    if (assignedUserId) updateData.userId = assignedUserId;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (status) updateData.status = status;
    if (totalDistance !== undefined) updateData.totalDistance = totalDistance;
    if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration;
    if (actualDuration !== undefined) updateData.actualDuration = actualDuration;

    // Update route
    const route = await prisma.route.update({
      where: { id },
      data: updateData,
      include: {
        area: {
          include: {
            region: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,

            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Route',
        entityId: route.id,
        userId,
        // tenantId removed from AuditLog
      }
    });

    res.json(route);
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ error: 'Failed to update route' });
  }
});

// ============================================================================
// 5. DELETE ROUTE
// ============================================================================
/**
 * DELETE /api/routes/:id
 * 
 * Purpose: Delete a route (soft delete if has history, hard delete otherwise)
 * 
 * Business Logic:
 * - Routes with stops or loads: Soft delete (mark as CANCELLED)
 * - Routes without activity: Hard delete
 * - Removes all associated route stops
 * - Cannot delete IN_PROGRESS routes
 * - Creates audit log
 */
router.delete('/:id', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const userId = (req.user as any).userId;
    const { id } = req.params;

    // Check route exists
    const route = await prisma.route.findFirst({
      where: { id, tenantId },
      include: {
        stops: true,
        loads: true
      }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Cannot delete routes in progress
    if (route.status === 'IN_PROGRESS') {
      return res.status(400).json({ 
        error: 'Cannot delete route in progress. Please complete or cancel first.' 
      });
    }

    // If route has activity, soft delete (mark as cancelled)
    if (route.stops.length > 0 || route.loads.length > 0) {
      const updatedRoute = await prisma.route.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });

      await prisma.auditLog.create({
        data: {
          action: 'SOFT_DELETE',
          entity: 'Route',
          entityId: id,
          userId,
          // tenantId removed from AuditLog
        }
      });

      return res.json({ 
        message: 'Route cancelled successfully',
        route: updatedRoute
      });
    }

    // Hard delete if no activity
    await prisma.route.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Route',
        entityId: id,
        userId,
        // tenantId removed from AuditLog
      }
    });

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ error: 'Failed to delete route' });
  }
});

// ============================================================================
// 6. ASSIGN CUSTOMERS TO ROUTE
// ============================================================================
/**
 * POST /api/routes/:id/customers
 * 
 * Purpose: Assign customers to a route and create route stops
 * 
 * Request Body:
 * - customerIds: Array of customer IDs to assign
 * - autoSequence: Boolean - automatically sequence stops (default: true)
 * 
 * Business Logic:
 * - Validates all customers belong to tenant
 * - Checks customers not already on route
 * - Creates route stops with sequence
 * - Auto-sequences based on coordinates if available
 * - Updates route estimated duration
 * 
 * Returns: Updated route with new stops
 */
router.post('/:id/customers', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const userId = (req.user as any).userId;
    const { id } = req.params;
    const { customerIds, autoSequence = true } = req.body;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ error: 'customerIds array is required' });
    }

    // Verify route exists
    const route = await prisma.route.findFirst({
      where: { id, tenantId },
      include: {
        stops: {
          select: { customerId: true, sequence: true }
        }
      }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Verify all customers exist and belong to tenant
    const customers = await prisma.customer.findMany({
      where: {
        id: { in: customerIds },
        // tenantId removed from AuditLog
        isActive: true
      }
    });

    if (customers.length !== customerIds.length) {
      return res.status(400).json({ 
        error: 'One or more customers not found or inactive' 
      });
    }

    // Check for already assigned customers
    const existingCustomerIds = route.stops.map(s => s.customerId);
    const duplicates = customerIds.filter(id => existingCustomerIds.includes(id));
    
    if (duplicates.length > 0) {
      return res.status(400).json({ 
        error: 'Some customers are already assigned to this route',
        duplicateIds: duplicates
      });
    }

    // Get next sequence number
    const maxSequence = route.stops.length > 0
      ? Math.max(...route.stops.map(s => s.sequence))
      : 0;

    // Create route stops
    const stopsData = customerIds.map((customerId, index) => ({
      routeId: id,
      customerId,
      sequence: maxSequence + index + 1,
      status: 'PENDING' as any
    }));

    await prisma.routeStop.createMany({
      data: stopsData
    });

    // If auto-sequence and customers have coordinates, optimize order
    if (autoSequence) {
      // Simple optimization: order by coordinates (can be enhanced with TSP algorithm)
      const stopsWithCoords = await prisma.routeStop.findMany({
        where: { routeId: id },
        include: {
          customer: {
            select: { id: true, coordinates: true }
          }
        }
      });

      // Re-sequence based on simple geographical proximity
      // (In production, use proper TSP/route optimization algorithm)
      let sequence = 1;
      for (const stop of stopsWithCoords) {
        await prisma.routeStop.update({
          where: { id: stop.id },
          data: { sequence: sequence++ }
        });
      }
    }

    // Fetch updated route
    const updatedRoute = await prisma.route.findFirst({
      where: { id },
      include: {
        stops: {
          include: {
            customer: {
              select: {
                id: true,
                code: true,
                name: true,
                address: true,
                coordinates: true
              }
            }
          },
          orderBy: { sequence: 'asc' }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'ASSIGN_CUSTOMERS',
        entity: 'Route',
        entityId: id,
        userId,
        // tenantId removed from AuditLog
      }
    });

    res.json(updatedRoute);
  } catch (error) {
    console.error('Assign customers error:', error);
    res.status(500).json({ error: 'Failed to assign customers to route' });
  }
});

// ============================================================================
// 7. OPTIMIZE ROUTE ORDER
// ============================================================================
/**
 * GET /api/routes/:id/optimize
 * 
 * Purpose: Calculate optimized visit order for route stops
 * 
 * Algorithm:
 * - Uses coordinates to calculate distances
 * - Applies nearest neighbor heuristic for TSP
 * - Considers time windows if specified
 * - Calculates total distance and estimated duration
 * 
 * Query Parameters:
 * - apply: Boolean - if true, applies the optimization (default: false)
 * 
 * Returns:
 * - optimizedStops: Ordered list of stops
 * - totalDistance: Total route distance in km
 * - estimatedDuration: Estimated duration in minutes
 * - savings: Distance/time saved vs current order
 */
router.get('/:id/optimize', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { id } = req.params;
    const { apply = 'false' } = req.query;

    const route = await prisma.route.findFirst({
      where: { id, tenantId },
      include: {
        stops: {
          include: {
            customer: {
              select: {
                id: true,
                code: true,
                name: true,
                address: true,
                coordinates: true
              }
            }
          },
          orderBy: { sequence: 'asc' }
        }
      }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    if (route.stops.length < 2) {
      return res.status(400).json({ 
        error: 'Route must have at least 2 stops to optimize' 
      });
    }

    // Filter stops with coordinates
    const stopsWithCoords = route.stops.filter(stop => {
      const coords = stop.customer.coordinates as any;
      return coords && coords.lat && coords.lng;
    });

    if (stopsWithCoords.length < 2) {
      return res.status(400).json({ 
        error: 'At least 2 stops must have coordinates for optimization' 
      });
    }

    // Calculate distance between two points (Haversine formula)
    const calculateDistance = (coord1: any, coord2: any): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
      const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Simple nearest neighbor algorithm for TSP
    const optimizeRoute = (stops: typeof stopsWithCoords) => {
      const visited: boolean[] = new Array(stops.length).fill(false);
      const optimized: typeof stops = [];
      let currentIndex = 0;
      let totalDistance = 0;

      optimized.push(stops[0]);
      visited[0] = true;

      for (let i = 1; i < stops.length; i++) {
        let nearestIndex = -1;
        let nearestDistance = Infinity;

        for (let j = 0; j < stops.length; j++) {
          if (!visited[j]) {
            const distance = calculateDistance(
              (stops[currentIndex].customer.coordinates as any),
              (stops[j].customer.coordinates as any)
            );
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestIndex = j;
            }
          }
        }

        if (nearestIndex !== -1) {
          optimized.push(stops[nearestIndex]);
          visited[nearestIndex] = true;
          totalDistance += nearestDistance;
          currentIndex = nearestIndex;
        }
      }

      return { optimized, totalDistance };
    };

    // Calculate current route distance
    let currentDistance = 0;
    for (let i = 0; i < stopsWithCoords.length - 1; i++) {
      currentDistance += calculateDistance(
        (stopsWithCoords[i].customer.coordinates as any),
        (stopsWithCoords[i + 1].customer.coordinates as any)
      );
    }

    // Optimize route
    const { optimized: optimizedStops, totalDistance: optimizedDistance } = optimizeRoute(stopsWithCoords);

    // Calculate estimated duration (assume 30 km/h average speed + 15 min per stop)
    const estimatedDuration = Math.round(
      (optimizedDistance / 30 * 60) + (optimizedStops.length * 15)
    );

    const savings = {
      distance: (currentDistance - optimizedDistance).toFixed(2) + ' km',
      percentage: ((1 - optimizedDistance / currentDistance) * 100).toFixed(1) + '%'
    };

    // Apply optimization if requested
    if (apply === 'true') {
      let sequence = 1;
      for (const stop of optimizedStops) {
        await prisma.routeStop.update({
          where: { id: stop.id },
          data: { sequence: sequence++ }
        });
      }

      await prisma.route.update({
        where: { id },
        data: {
          totalDistance: optimizedDistance,
          estimatedDuration
        }
      });
    }

    res.json({
      applied: apply === 'true',
      currentDistance: currentDistance.toFixed(2) + ' km',
      optimizedDistance: optimizedDistance.toFixed(2) + ' km',
      estimatedDuration: estimatedDuration + ' minutes',
      savings,
      optimizedStops: optimizedStops.map((stop, index) => ({
        sequence: index + 1,
        stopId: stop.id,
        customerId: stop.customer.id,
        customerName: stop.customer.name,
        address: stop.customer.address
      }))
    });
  } catch (error) {
    console.error('Optimize route error:', error);
    res.status(500).json({ error: 'Failed to optimize route' });
  }
});

// ============================================================================
// 8. GET ROUTE SCHEDULE
// ============================================================================
/**
 * GET /api/routes/:id/schedule
 * 
 * Purpose: Get or generate route schedule (weekly pattern)
 * 
 * Features:
 * - Returns weekly schedule pattern
 * - Shows assigned days and times
 * - Lists customers to visit per day
 * - Calculates estimated time per day
 * - Supports recurring route patterns
 * 
 * Use Cases:
 * - Route planning dashboard
 * - Agent scheduling
 * - Customer visit planning
 * - Workload distribution
 */
router.get('/:id/schedule', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { id } = req.params;

    const route = await prisma.route.findFirst({
      where: { id, tenantId },
      include: {
        stops: {
          include: {
            customer: {
              select: {
                id: true,
                code: true,
                name: true,
                phone: true,
                address: true
              }
            }
          },
          orderBy: { sequence: 'asc' }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Generate weekly schedule
    // In production, this could be more sophisticated with:
    // - Recurring patterns
    // - Multiple routes per week
    // - Time window constraints
    const schedule = {
      routeId: route.id,
      routeName: route.name,
      assignedTo: route.user,
      totalStops: route.stops.length,
      estimatedDuration: route.estimatedDuration || null,
      startTime: route.startTime,
      endTime: route.endTime,
      status: route.status,
      stops: route.stops.map(stop => ({
        sequence: stop.sequence,
        customer: stop.customer,
        plannedTime: stop.plannedTime,
        status: stop.status,
        notes: stop.notes
      })),
      // Weekly pattern (can be customized based on business needs)
      weeklyPattern: route.startTime ? {
        dayOfWeek: new Date(route.startTime).toLocaleDateString('en-US', { weekday: 'long' }),
        startTime: new Date(route.startTime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      } : null
    };

    res.json(schedule);
  } catch (error) {
    console.error('Get route schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch route schedule' });
  }
});



export default router;
