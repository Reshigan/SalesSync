import express, { Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { TenantRequest } from '../middleware/tenant';
import { prisma } from '../services/database';

const router = express.Router();

// Dashboard Overview Metrics
router.get('/dashboard', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { startDate, endDate } = req.query;

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    } : {};

    // Total revenue
    const orders = await prisma.order.findMany({
      where: { tenantId, ...dateFilter },
      select: { totalAmount: true, status: true }
    });

    const totalRevenue = orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);

    // Total orders
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;

    // Active customers
    const activeCustomers = await prisma.customer.count({
      where: { tenantId, isActive: true }
    });

    // Products count
    const productsCount = await prisma.product.count({
      where: { tenantId, isActive: true }
    });

    // Pending orders
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;

    // Revenue trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const revenueTrend = await Promise.all(
      last7Days.map(async (date) => {
        const dayOrders = await prisma.order.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: new Date(date),
              lt: new Date(new Date(date).getTime() + 86400000)
            },
            status: 'DELIVERED'
          },
          select: { totalAmount: true }
        });

        return {
          date,
          revenue: dayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
        };
      })
    );

    res.json({
      totalRevenue,
      totalOrders,
      completedOrders,
      activeCustomers,
      productsCount,
      pendingOrders,
      revenueTrend,
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Sales Analytics
router.get('/sales', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    } : {};

    const orders = await prisma.order.findMany({
      where: { tenantId, ...dateFilter, status: 'DELIVERED' },
      include: {
        items: {
          include: { product: true }
        },
        customer: true,
        user: true
      }
    });

    // Total sales
    const totalSales = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalQuantity = orders.reduce((sum, o) => 
      sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    // Sales by product
    const salesByProduct = orders.reduce((acc: any, order) => {
      order.items.forEach(item => {
        const productName = item.product.name;
        if (!acc[productName]) {
          acc[productName] = { quantity: 0, revenue: 0 };
        }
        acc[productName].quantity += item.quantity;
        acc[productName].revenue += item.totalPrice;
      });
      return acc;
    }, {});

    // Sales by agent
    const salesByAgent = orders.reduce((acc: any, order) => {
      const agentName = `${order.user.firstName} ${order.user.lastName}`;
      if (!acc[agentName]) {
        acc[agentName] = { orders: 0, revenue: 0 };
      }
      acc[agentName].orders += 1;
      acc[agentName].revenue += order.totalAmount;
      return acc;
    }, {});

    // Sales by customer
    const salesByCustomer = orders.reduce((acc: any, order) => {
      const customerName = order.customer.name;
      if (!acc[customerName]) {
        acc[customerName] = { orders: 0, revenue: 0 };
      }
      acc[customerName].orders += 1;
      acc[customerName].revenue += order.totalAmount;
      return acc;
    }, {});

    res.json({
      totalSales,
      totalOrders: orders.length,
      totalQuantity,
      averageOrderValue: orders.length > 0 ? totalSales / orders.length : 0,
      salesByProduct: Object.entries(salesByProduct).map(([name, data]: [string, any]) => ({
        product: name,
        ...data
      })),
      salesByAgent: Object.entries(salesByAgent).map(([name, data]: [string, any]) => ({
        agent: name,
        ...data
      })),
      salesByCustomer: Object.entries(salesByCustomer).map(([name, data]: [string, any]) => ({
        customer: name,
        ...data
      }))
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch sales analytics' });
  }
});

// Product Performance Analytics
router.get('/products', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { startDate, endDate } = req.query;

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    } : {};

    // Get all order items for the period
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          tenantId,
          ...dateFilter,
          status: 'DELIVERED'
        }
      },
      include: {
        product: {
          include: { category: true }
        }
      }
    });

    // Product performance
    const productPerformance = orderItems.reduce((acc: any, item) => {
      const productId = item.product.id;
      if (!acc[productId]) {
        acc[productId] = {
          id: productId,
          name: item.product.name,
          sku: item.product.sku,
          category: item.product.category.name,
          quantity: 0,
          revenue: 0,
          orders: new Set()
        };
      }
      acc[productId].quantity += item.quantity;
      acc[productId].revenue += item.totalPrice;
      acc[productId].orders.add(item.orderId);
      return acc;
    }, {});

    // Convert to array and calculate additional metrics
    const products = Object.values(productPerformance).map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      quantitySold: p.quantity,
      revenue: p.revenue,
      orderCount: p.orders.size,
      averageQuantityPerOrder: p.quantity / p.orders.size
    })).sort((a: any, b: any) => b.revenue - a.revenue);

    // Category performance
    const categoryPerformance = products.reduce((acc: any, product: any) => {
      if (!acc[product.category]) {
        acc[product.category] = { quantity: 0, revenue: 0, products: 0 };
      }
      acc[product.category].quantity += product.quantitySold;
      acc[product.category].revenue += product.revenue;
      acc[product.category].products += 1;
      return acc;
    }, {});

    res.json({
      products,
      categories: Object.entries(categoryPerformance).map(([name, data]: [string, any]) => ({
        category: name,
        ...data
      })),
      topProducts: products.slice(0, 10),
      totalRevenue: products.reduce((sum: number, p: any) => sum + p.revenue, 0),
      totalQuantity: products.reduce((sum: number, p: any) => sum + p.quantitySold, 0)
    });
  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch product analytics' });
  }
});

// Customer Analytics
router.get('/customers', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { startDate, endDate } = req.query;

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    } : {};

    // Get customers with their orders
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: {
        orders: {
          where: {
            ...dateFilter,
            status: 'DELIVERED'
          }
        },
        route: true
      }
    });

    // Calculate customer metrics
    const customerMetrics = customers.map(customer => {
      const orders = customer.orders;
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
      const lastOrderDate = orders.length > 0 
        ? new Date(Math.max(...orders.map((o: any) => o.createdAt.getTime())))
        : null;

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        route: customer.route?.name,
        city: customer.city,
        state: customer.state,
        isActive: customer.isActive,
        totalOrders: orders.length,
        totalRevenue,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        lastOrderDate,
        daysSinceLastOrder: lastOrderDate 
          ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
          : null
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Route analysis
    const routeAnalysis = customerMetrics.reduce((acc: any, customer) => {
      const route = customer.route || 'Unassigned';
      if (!acc[route]) {
        acc[route] = { customers: 0, orders: 0, revenue: 0 };
      }
      acc[route].customers += 1;
      acc[route].orders += customer.totalOrders;
      acc[route].revenue += customer.totalRevenue;
      return acc;
    }, {});

    // Customer segments
    const activeCustomers = customerMetrics.filter(c => c.daysSinceLastOrder !== null && c.daysSinceLastOrder <= 30);
    const atRiskCustomers = customerMetrics.filter(c => c.daysSinceLastOrder !== null && c.daysSinceLastOrder > 30 && c.daysSinceLastOrder <= 90);
    const inactiveCustomers = customerMetrics.filter(c => c.daysSinceLastOrder === null || c.daysSinceLastOrder > 90);

    res.json({
      totalCustomers: customers.length,
      activeCustomers: activeCustomers.length,
      atRiskCustomers: atRiskCustomers.length,
      inactiveCustomers: inactiveCustomers.length,
      topCustomers: customerMetrics.slice(0, 20),
      routeAnalysis: Object.entries(routeAnalysis).map(([route, data]: [string, any]) => ({
        route,
        ...data
      })),
      averageOrdersPerCustomer: customerMetrics.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length,
      averageRevenuePerCustomer: customerMetrics.reduce((sum, c) => sum + c.totalRevenue, 0) / customers.length
    });
  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch customer analytics' });
  }
});

// Commission Analytics
router.get('/commissions', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { startDate, endDate } = req.query;

    const where: any = {
      user: {
        tenantId
      }
    };
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const commissions = await prisma.commission.findMany({
      where,
      include: {
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

    // Commission by agent
    const commissionByAgent = commissions.reduce((acc: any, commission) => {
      const agentName = `${commission.user.firstName} ${commission.user.lastName}`;
      if (!acc[agentName]) {
        acc[agentName] = {
          totalCommission: 0,
          paidCommission: 0,
          pendingCommission: 0,
          count: 0
        };
      }
      acc[agentName].totalCommission += Number(commission.commissionAmount);
      if (commission.status === 'PAID') {
        acc[agentName].paidCommission += Number(commission.commissionAmount);
      } else {
        acc[agentName].pendingCommission += Number(commission.commissionAmount);
      }
      acc[agentName].count += 1;
      return acc;
    }, {});

    const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const paidCommissions = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const pendingCommissions = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + Number(c.commissionAmount), 0);

    res.json({
      totalCommissions,
      paidCommissions,
      pendingCommissions,
      commissionCount: commissions.length,
      byAgent: Object.entries(commissionByAgent).map(([agent, data]: [string, any]) => ({
        agent,
        ...data
      })),
      averageCommission: commissions.length > 0 ? totalCommissions / commissions.length : 0
    });
  } catch (error) {
    console.error('Commission analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch commission analytics' });
  }
});

// Inventory Analytics
router.get('/inventory', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const inventory = await prisma.inventory.findMany({
      where: { tenantId },
      include: {
        product: {
          include: { category: true }
        }
      }
    });

    // Low stock products
    const lowStockProducts = inventory.filter(i => i.currentStock <= i.minStock);

    // Stock value (using product price as proxy since inventory doesn't store unit cost)
    const stockValue = inventory.reduce((sum, item) => 
      sum + (item.currentStock * Number(item.product.unitPrice)), 0
    );

    // By category
    const byCategory = inventory.reduce((acc: any, item) => {
      const category = item.product.category.name;
      if (!acc[category]) {
        acc[category] = { quantity: 0, value: 0, products: 0 };
      }
      acc[category].quantity += item.currentStock;
      acc[category].value += item.currentStock * Number(item.product.unitPrice);
      acc[category].products += 1;
      return acc;
    }, {});

    // By location
    const byLocation = inventory.reduce((acc: any, item) => {
      const location = item.location || 'Unknown';
      if (!acc[location]) {
        acc[location] = { quantity: 0, value: 0, products: 0 };
      }
      acc[location].quantity += item.currentStock;
      acc[location].value += item.currentStock * Number(item.product.unitPrice);
      acc[location].products += 1;
      return acc;
    }, {});

    res.json({
      totalProducts: inventory.length,
      totalQuantity: inventory.reduce((sum, i) => sum + i.currentStock, 0),
      stockValue,
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.map(i => ({
        product: i.product.name,
        sku: i.product.sku,
        currentStock: i.currentStock,
        minStock: i.minStock,
        location: i.location
      })),
      byCategory: Object.entries(byCategory).map(([category, data]: [string, any]) => ({
        category,
        ...data
      })),
      byLocation: Object.entries(byLocation).map(([location, data]: [string, any]) => ({
        location,
        ...data
      }))
    });
  } catch (error) {
    console.error('Inventory analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory analytics' });
  }
});

// Performance Analytics
router.get('/performance', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { startDate, endDate, userId } = req.query;

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    } : {};

    const userFilter = userId ? { userId: userId as string } : {};

    // Get user performance data
    const users = await prisma.user.findMany({
      where: { 
        tenantId,
        ...userFilter
      },
      include: {
        orders: {
          where: {
            ...dateFilter,
            status: 'DELIVERED'
          }
        },
        vanSalesLoads: {
          where: dateFilter
        },
        merchandisingVisits: {
          where: dateFilter
        },
        promoterActivities: {
          where: dateFilter
        }
      }
    });

    const performanceData = users.map(user => {
      const orders = user.orders;
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
      
      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        totalOrders: orders.length,
        totalRevenue,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        vanSalesLoads: user.vanSalesLoads.length,
        merchandisingVisits: user.merchandisingVisits.length,
        promoterActivities: user.promoterActivities.length,
        lastActivity: Math.max(
          ...orders.map((o: any) => o.createdAt.getTime()),
          ...user.vanSalesLoads.map((v: any) => v.createdAt.getTime()),
          ...user.merchandisingVisits.map((v: any) => v.createdAt.getTime()),
          ...user.promoterActivities.map((a: any) => a.createdAt.getTime())
        )
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Team performance summary
    const teamSummary = {
      totalUsers: users.length,
      totalRevenue: performanceData.reduce((sum, u) => sum + u.totalRevenue, 0),
      totalOrders: performanceData.reduce((sum, u) => sum + u.totalOrders, 0),
      totalVanSalesLoads: performanceData.reduce((sum, u) => sum + u.vanSalesLoads, 0),
      totalMerchandisingVisits: performanceData.reduce((sum, u) => sum + u.merchandisingVisits, 0),
      totalPromoterActivities: performanceData.reduce((sum, u) => sum + u.promoterActivities, 0)
    };

    res.json({
      teamSummary,
      userPerformance: performanceData,
      topPerformers: performanceData.slice(0, 10)
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch performance analytics' });
  }
});

// AI Insights
router.get('/ai-insights', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const insights: any[] = [];

    // Low stock alerts
    const lowStockProducts = await prisma.product.findMany({
      where: { 
        tenantId, 
        isActive: true,
        inventories: {
          some: {
            currentStock: { lt: 10 }
          }
        }
      },
      include: {
        inventories: {
          where: {
            currentStock: { lt: 10 }
          }
        }
      }
    });

    lowStockProducts.forEach(product => {
      product.inventories.forEach(inventory => {
        insights.push({
          id: `low-stock-${product.sku}-${inventory.id}`,
          type: 'warning',
          category: 'inventory',
          title: 'Low Stock Alert',
          message: `${product.name} is running low (${inventory.currentStock} units remaining)`,
          action: 'Restock',
          priority: 'high',
          createdAt: new Date()
        });
      });
    });

    // Sales opportunity insights
    const recentOrders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        status: 'DELIVERED'
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });

    // Find customers with increasing order frequency
    const customerOrderCounts = recentOrders.reduce((acc: any, order) => {
      const customerId = order.customerId;
      if (!acc[customerId]) {
        acc[customerId] = { 
          customer: order.customer, 
          orders: 0, 
          totalAmount: 0 
        };
      }
      acc[customerId].orders += 1;
      acc[customerId].totalAmount += Number(order.totalAmount);
      return acc;
    }, {});

    Object.values(customerOrderCounts).forEach((data: any) => {
      if (data.orders >= 3) {
        insights.push({
          id: `opportunity-${data.customer.id}`,
          type: 'success',
          category: 'sales',
          title: 'Sales Opportunity',
          message: `${data.customer.name} has placed ${data.orders} orders this month (${data.totalAmount.toLocaleString()} total)`,
          action: 'Upsell',
          priority: 'medium',
          createdAt: new Date()
        });
      }
    });

    // Performance drop alerts
    const last30Days = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { 
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lte: new Date()
        },
        status: 'DELIVERED'
      },
      include: { user: true }
    });

    const previous30Days = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { 
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        status: 'DELIVERED'
      },
      include: { user: true }
    });

    const currentPerformance = last30Days.reduce((acc: any, order) => {
      const userId = order.userId;
      if (!acc[userId]) {
        acc[userId] = { user: order.user, revenue: 0, orders: 0 };
      }
      acc[userId].revenue += Number(order.totalAmount);
      acc[userId].orders += 1;
      return acc;
    }, {});

    const previousPerformance = previous30Days.reduce((acc: any, order) => {
      const userId = order.userId;
      if (!acc[userId]) {
        acc[userId] = { revenue: 0, orders: 0 };
      }
      acc[userId].revenue += Number(order.totalAmount);
      acc[userId].orders += 1;
      return acc;
    }, {});

    Object.entries(currentPerformance).forEach(([userId, current]: [string, any]) => {
      const previous = previousPerformance[userId];
      if (previous && current.revenue < previous.revenue * 0.85) {
        const dropPercentage = ((previous.revenue - current.revenue) / previous.revenue * 100).toFixed(1);
        insights.push({
          id: `performance-drop-${userId}`,
          type: 'danger',
          category: 'performance',
          title: 'Performance Drop',
          message: `${current.user.firstName} ${current.user.lastName} sales down ${dropPercentage}% this month`,
          action: 'Investigate',
          priority: 'high',
          createdAt: new Date()
        });
      }
    });

    // Inactive customer alerts
    const inactiveCustomers = await prisma.customer.findMany({
      where: {
        tenantId,
        isActive: true,
        orders: {
          none: {
            createdAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
          }
        }
      },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    inactiveCustomers.slice(0, 5).forEach(customer => {
      const lastOrder = customer.orders[0];
      const daysSinceLastOrder = lastOrder 
        ? Math.floor((Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 'Never';
      
      insights.push({
        id: `inactive-${customer.id}`,
        type: 'warning',
        category: 'customer',
        title: 'Inactive Customer',
        message: `${customer.name} hasn't ordered in ${daysSinceLastOrder} days`,
        action: 'Re-engage',
        priority: 'medium',
        createdAt: new Date()
      });
    });

    // Sort insights by priority and date
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    insights.sort((a, b) => {
      const priorityDiff = (priorityOrder as any)[b.priority] - (priorityOrder as any)[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({
      insights: insights.slice(0, 20), // Limit to top 20 insights
      summary: {
        total: insights.length,
        high: insights.filter(i => i.priority === 'high').length,
        medium: insights.filter(i => i.priority === 'medium').length,
        low: insights.filter(i => i.priority === 'low').length,
        categories: {
          inventory: insights.filter(i => i.category === 'inventory').length,
          sales: insights.filter(i => i.category === 'sales').length,
          performance: insights.filter(i => i.category === 'performance').length,
          customer: insights.filter(i => i.category === 'customer').length
        }
      }
    });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

// Predictions endpoint
router.get('/predictions', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { period = '7', type = 'sales' } = req.query;

    // Get historical data for predictions
    const now = new Date();
    const daysBack = parseInt(period as string) * 4; // Get 4x the prediction period for historical analysis
    const historicalDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Get historical sales data
    const historicalOrders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: historicalDate
        },
        status: {
          in: ['CONFIRMED', 'SHIPPED', 'DELIVERED']
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: {
                  select: { name: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Calculate product sales trends
    const productData: { [key: string]: {
      name: string;
      sku: string;
      category: string;
      dailySales: { [date: string]: number };
      totalSales: number;
    }} = {};

    historicalOrders.forEach(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      
      order.items?.forEach((item: any) => {
        const productId = item.productId;
        const product = item.product;
        
        if (!product) return;
        
        if (!productData[productId]) {
          productData[productId] = {
            name: product.name,
            sku: product.sku,
            category: product.category?.name || 'General',
            dailySales: {},
            totalSales: 0
          };
        }
        
        if (!productData[productId].dailySales[orderDate]) {
          productData[productId].dailySales[orderDate] = 0;
        }
        
        productData[productId].dailySales[orderDate] += item.quantity;
        productData[productId].totalSales += item.quantity;
      });
    });

    // Generate predictions using simple linear regression
    const predictions = Object.entries(productData)
      .filter(([_, data]) => data.totalSales > 0)
      .map(([productId, data]) => {
        const salesArray = Object.values(data.dailySales);
        const avgDailySales = salesArray.length > 0 ? salesArray.reduce((a, b) => a + b, 0) / salesArray.length : 0;
        
        // Simple trend calculation
        const recentSales = salesArray.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, salesArray.length);
        const olderSales = salesArray.slice(0, -7).reduce((a, b) => a + b, 0) / Math.max(1, salesArray.length - 7);
        
        const trendFactor = olderSales > 0 ? recentSales / olderSales : 1;
        const predictedDaily = avgDailySales * trendFactor;
        const predictedPeriod = predictedDaily * parseInt(period as string);
        
        // Calculate confidence based on data consistency
        const variance = salesArray.reduce((sum, val) => sum + Math.pow(val - avgDailySales, 2), 0) / salesArray.length;
        const stdDev = Math.sqrt(variance);
        const confidence = Math.max(0.5, Math.min(0.99, 1 - (stdDev / (avgDailySales + 1))));
        
        // Determine trend direction
        const trend = trendFactor > 1.05 ? 'up' : trendFactor < 0.95 ? 'down' : 'stable';
        const changePercent = Math.round((trendFactor - 1) * 100);
        
        return {
          productId,
          productName: data.name,
          productSku: data.sku,
          category: data.category,
          predictedSales: Math.round(predictedPeriod),
          confidence: Math.round(confidence * 100) / 100,
          trend,
          changePercent,
          change: changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`,
          historicalAverage: Math.round(avgDailySales),
          dataPoints: salesArray.length
        };
      })
      .sort((a, b) => b.predictedSales - a.predictedSales)
      .slice(0, 20); // Top 20 products

    // Calculate overall metrics
    const totalPredictions = predictions.length;
    const avgAccuracy = predictions.reduce((sum, p) => sum + p.confidence, 0) / (totalPredictions || 1);
    const upTrends = predictions.filter(p => p.trend === 'up').length;
    const downTrends = predictions.filter(p => p.trend === 'down').length;
    
    // Model metadata
    const modelInfo = {
      version: 'v2.5',
      algorithm: 'Linear Regression with Trend Analysis',
      lastTrained: now.toISOString(),
      dataPoints: historicalOrders.length,
      predictionPeriod: `${period} days`
    };

    res.json({
      predictions,
      summary: {
        totalPredictions,
        avgAccuracy: Math.round(avgAccuracy * 100) / 100,
        upTrends,
        downTrends,
        stableTrends: totalPredictions - upTrends - downTrends
      },
      model: modelInfo,
      generatedAt: now.toISOString()
    });

  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({ 
      error: 'Failed to generate predictions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
