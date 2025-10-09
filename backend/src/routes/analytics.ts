import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Dashboard Overview Metrics
router.get('/dashboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
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
      .filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Total orders
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;

    // Active customers
    const activeCustomers = await prisma.customer.count({
      where: { tenantId, status: 'ACTIVE' }
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
            status: { in: ['DELIVERED', 'COMPLETED'] }
          },
          select: { totalAmount: true }
        });

        return {
          date,
          revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
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
router.get('/sales', authenticateToken, async (req: Request, res: Response) => {
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
      where: { tenantId, ...dateFilter, status: { in: ['DELIVERED', 'COMPLETED'] } },
      include: {
        items: {
          include: { product: true }
        },
        customer: true,
        user: true
      }
    });

    // Total sales
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
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
        acc[productName].revenue += item.total;
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
router.get('/products', authenticateToken, async (req: Request, res: Response) => {
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
          status: { in: ['DELIVERED', 'COMPLETED'] }
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
      acc[productId].revenue += item.total;
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
router.get('/customers', authenticateToken, async (req: Request, res: Response) => {
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
            status: { in: ['DELIVERED', 'COMPLETED'] }
          }
        },
        region: true,
        area: true
      }
    });

    // Calculate customer metrics
    const customerMetrics = customers.map(customer => {
      const orders = customer.orders;
      const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const lastOrderDate = orders.length > 0 
        ? new Date(Math.max(...orders.map(o => o.createdAt.getTime())))
        : null;

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        region: customer.region?.name,
        area: customer.area?.name,
        status: customer.status,
        totalOrders: orders.length,
        totalRevenue,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        lastOrderDate,
        daysSinceLastOrder: lastOrderDate 
          ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
          : null
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Regional analysis
    const regionalAnalysis = customerMetrics.reduce((acc: any, customer) => {
      const region = customer.region || 'Unknown';
      if (!acc[region]) {
        acc[region] = { customers: 0, orders: 0, revenue: 0 };
      }
      acc[region].customers += 1;
      acc[region].orders += customer.totalOrders;
      acc[region].revenue += customer.totalRevenue;
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
      regionalAnalysis: Object.entries(regionalAnalysis).map(([region, data]: [string, any]) => ({
        region,
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
router.get('/commissions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { startDate, endDate } = req.query;

    const dateFilter = startDate && endDate ? {
      periodStart: {
        gte: new Date(startDate as string)
      },
      periodEnd: {
        lte: new Date(endDate as string)
      }
    } : {};

    const commissions = await prisma.commission.findMany({
      where: { tenantId, ...dateFilter },
      include: {
        user: true
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
      acc[agentName].totalCommission += commission.commissionAmount;
      if (commission.status === 'PAID') {
        acc[agentName].paidCommission += commission.commissionAmount;
      } else {
        acc[agentName].pendingCommission += commission.commissionAmount;
      }
      acc[agentName].count += 1;
      return acc;
    }, {});

    const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const paidCommissions = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.commissionAmount, 0);
    const pendingCommissions = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.commissionAmount, 0);

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
router.get('/inventory', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;

    const inventory = await prisma.inventory.findMany({
      where: { tenantId },
      include: {
        product: {
          include: { category: true }
        },
        store: true
      }
    });

    // Low stock products
    const lowStockProducts = inventory.filter(i => i.quantity <= i.reorderPoint);

    // Stock value
    const stockValue = inventory.reduce((sum, item) => 
      sum + (item.quantity * item.unitCost), 0
    );

    // By category
    const byCategory = inventory.reduce((acc: any, item) => {
      const category = item.product.category.name;
      if (!acc[category]) {
        acc[category] = { quantity: 0, value: 0, products: 0 };
      }
      acc[category].quantity += item.quantity;
      acc[category].value += item.quantity * item.unitCost;
      acc[category].products += 1;
      return acc;
    }, {});

    // By location
    const byLocation = inventory.reduce((acc: any, item) => {
      const location = item.store?.name || 'Unknown';
      if (!acc[location]) {
        acc[location] = { quantity: 0, value: 0, products: 0 };
      }
      acc[location].quantity += item.quantity;
      acc[location].value += item.quantity * item.unitCost;
      acc[location].products += 1;
      return acc;
    }, {});

    res.json({
      totalProducts: inventory.length,
      totalQuantity: inventory.reduce((sum, i) => sum + i.quantity, 0),
      stockValue,
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.map(i => ({
        product: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        reorderPoint: i.reorderPoint,
        store: i.store?.name
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

export default router;
