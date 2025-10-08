import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';

// Mock database for development without PostgreSQL
class MockPrismaClient {
  private data: any = {
    users: [],
    tenants: [],
    products: [],
    customers: [],
    orders: []
  };

  user = {
    findUnique: async (params: any) => {
      const user = this.data.users.find((u: any) => 
        params.where.id ? u.id === params.where.id : u.email === params.where.email
      );
      return user || null;
    },
    findMany: async (params: any) => {
      let users = this.data.users;
      if (params.where?.tenantId) {
        users = users.filter((u: any) => u.tenantId === params.where.tenantId);
      }
      return users.slice(params.skip || 0, (params.skip || 0) + (params.take || 10));
    },
    findFirst: async (params: any) => {
      return this.data.users.find((u: any) => 
        u.id === params.where.id && u.tenantId === params.where.tenantId
      ) || null;
    },
    create: async (params: any) => {
      const user = {
        id: `user_${Date.now()}`,
        ...params.data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.data.users.push(user);
      return user;
    },
    update: async (params: any) => {
      const index = this.data.users.findIndex((u: any) => u.id === params.where.id);
      if (index !== -1) {
        this.data.users[index] = { ...this.data.users[index], ...params.data, updatedAt: new Date() };
        return this.data.users[index];
      }
      throw new Error('User not found');
    },
    count: async (params: any) => {
      let users = this.data.users;
      if (params.where?.tenantId) {
        users = users.filter((u: any) => u.tenantId === params.where.tenantId);
      }
      return users.length;
    },
    groupBy: async (params: any) => {
      const groups: any = {};
      this.data.users.forEach((user: any) => {
        const key = user[params.by[0]];
        if (!groups[key]) {
          groups[key] = { [params.by[0]]: key, _count: { [params.by[0]]: 0 } };
        }
        groups[key]._count[params.by[0]]++;
      });
      return Object.values(groups);
    }
  };

  tenant = {
    findUnique: async (params: any) => {
      return this.data.tenants.find((t: any) => 
        params.where.id ? t.id === params.where.id : t.slug === params.where.slug
      ) || null;
    },
    create: async (params: any) => {
      const tenant = {
        id: `tenant_${Date.now()}`,
        ...params.data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.data.tenants.push(tenant);
      return tenant;
    }
  };

  product = {
    findMany: async (params: any) => {
      let products = this.data.products;
      if (params.where?.tenantId) {
        products = products.filter((p: any) => p.tenantId === params.where.tenantId);
      }
      return products.slice(params.skip || 0, (params.skip || 0) + (params.take || 10));
    },
    findFirst: async (params: any) => {
      return this.data.products.find((p: any) => 
        p.id === params.where.id && p.tenantId === params.where.tenantId
      ) || null;
    },
    create: async (params: any) => {
      const product = {
        id: `product_${Date.now()}`,
        ...params.data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.data.products.push(product);
      return product;
    },
    update: async (params: any) => {
      const index = this.data.products.findIndex((p: any) => p.id === params.where.id);
      if (index !== -1) {
        this.data.products[index] = { ...this.data.products[index], ...params.data, updatedAt: new Date() };
        return this.data.products[index];
      }
      throw new Error('Product not found');
    },
    count: async (params: any) => {
      let products = this.data.products;
      if (params.where?.tenantId) {
        products = products.filter((p: any) => p.tenantId === params.where.tenantId);
      }
      return products.length;
    }
  };

  customer = {
    findMany: async (params: any) => {
      let customers = this.data.customers;
      if (params.where?.tenantId) {
        customers = customers.filter((c: any) => c.tenantId === params.where.tenantId);
      }
      return customers.slice(params.skip || 0, (params.skip || 0) + (params.take || 10));
    },
    findFirst: async (params: any) => {
      return this.data.customers.find((c: any) => 
        c.id === params.where.id && c.tenantId === params.where.tenantId
      ) || null;
    },
    create: async (params: any) => {
      const customer = {
        id: `customer_${Date.now()}`,
        ...params.data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.data.customers.push(customer);
      return customer;
    },
    count: async (params: any) => {
      let customers = this.data.customers;
      if (params.where?.tenantId) {
        customers = customers.filter((c: any) => c.tenantId === params.where.tenantId);
      }
      return customers.length;
    }
  };

  order = {
    findMany: async (params: any) => {
      let orders = this.data.orders;
      if (params.where?.tenantId) {
        orders = orders.filter((o: any) => o.tenantId === params.where.tenantId);
      }
      return orders.slice(params.skip || 0, (params.skip || 0) + (params.take || 10));
    },
    findFirst: async (params: any) => {
      return this.data.orders.find((o: any) => 
        o.id === params.where.id && o.tenantId === params.where.tenantId
      ) || null;
    },
    create: async (params: any) => {
      const order = {
        id: `order_${Date.now()}`,
        ...params.data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.data.orders.push(order);
      return order;
    },
    update: async (params: any) => {
      const index = this.data.orders.findIndex((o: any) => o.id === params.where.id);
      if (index !== -1) {
        this.data.orders[index] = { ...this.data.orders[index], ...params.data, updatedAt: new Date() };
        return this.data.orders[index];
      }
      throw new Error('Order not found');
    },
    count: async (params: any) => {
      let orders = this.data.orders;
      if (params.where?.tenantId) {
        orders = orders.filter((o: any) => o.tenantId === params.where.tenantId);
      }
      return orders.length;
    },
    aggregate: async (params: any) => {
      let orders = this.data.orders;
      if (params.where?.tenantId) {
        orders = orders.filter((o: any) => o.tenantId === params.where.tenantId);
      }
      const sum = orders.reduce((acc: number, order: any) => acc + (order.totalAmount || 0), 0);
      return { _sum: { totalAmount: sum } };
    },
    groupBy: async (params: any) => {
      const groups: any = {};
      this.data.orders.forEach((order: any) => {
        const key = order[params.by[0]];
        if (!groups[key]) {
          groups[key] = { 
            [params.by[0]]: key, 
            _count: { [params.by[0]]: 0 },
            _sum: { totalAmount: 0 }
          };
        }
        groups[key]._count[params.by[0]]++;
        groups[key]._sum.totalAmount += order.totalAmount || 0;
      });
      return Object.values(groups);
    }
  };

  // Initialize with demo data
  constructor() {
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo tenant
    const demoTenant = {
      id: 'tenant_demo',
      name: 'Demo Company',
      slug: 'demo',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.tenants.push(demoTenant);

    // Create demo user
    const demoUser = {
      id: 'user_demo',
      email: 'demo@salessync.com',
      password: '$2a$12$L.4DYop19FkayURH9kYMHeGEiYJc4S17.traYAc3Q/204xmnQIOdy', // password: demo123
      firstName: 'Demo',
      lastName: 'User',
      role: 'VAN_SALES_AGENT',
      status: 'ACTIVE',
      tenantId: 'tenant_demo',
      createdAt: new Date(),
      updatedAt: new Date(),
      tenant: demoTenant
    };
    this.data.users.push(demoUser);

    logger.info('Mock database initialized with demo data');
  }
}

// Use real Prisma Client for production with PostgreSQL
// Use mock database only if DATABASE_URL is not set
const useMockDatabase = !process.env.DATABASE_URL;

export const prisma = useMockDatabase 
  ? (new MockPrismaClient() as any)
  : new PrismaClient();