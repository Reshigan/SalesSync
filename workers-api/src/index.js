import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { logger } from 'hono/logger';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
}));

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'SalesSync API', version: '1.0.0' }));
app.get('/health', (c) => c.json({ status: 'healthy', timestamp: new Date().toISOString() }));

// Helper to get tenant from header or token
const getTenantId = (c) => {
  return c.req.header('X-Tenant-ID') || c.get('tenantId') || 'default';
};

// Auth routes
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    const db = c.env.DB;
    
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    
    if (!user) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }
    
    // Generate JWT token
    const token = await generateToken({ userId: user.id, tenantId: user.tenant_id, role: user.role }, c.env.JWT_SECRET || 'default-secret');
    
    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          tenantId: user.tenant_id
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, message: 'Login failed' }, 500);
  }
});

// Simple JWT generation (Workers-compatible)
async function generateToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = { ...payload, iat: now, exp: now + 86400 }; // 24 hours
  
  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(tokenPayload));
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${base64Header}.${base64Payload}`)
  );
  
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${base64Header}.${base64Payload}.${base64Signature}`;
}

// JWT verification middleware
const authMiddleware = async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.substring(7);
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ success: false, message: 'Token expired' }, 401);
    }
    
    c.set('userId', payload.userId);
    c.set('tenantId', payload.tenantId);
    c.set('role', payload.role);
    
    await next();
  } catch (error) {
    return c.json({ success: false, message: 'Invalid token' }, 401);
  }
};

// Protected routes group
const api = new Hono();
api.use('*', authMiddleware);

// ==================== CUSTOMERS ====================
api.get('/customers', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const { limit = 50, offset = 0, search, status } = c.req.query();
  
  let query = 'SELECT * FROM customers WHERE tenant_id = ?';
  const params = [tenantId];
  
  if (search) {
    query += ' AND (name LIKE ? OR code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY name LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const customers = await db.prepare(query).bind(...params).all();
  return c.json({ success: true, data: customers.results || [] });
});

api.get('/customers/:id', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const { id } = c.req.param();
  
  const customer = await db.prepare('SELECT * FROM customers WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first();
  
  if (!customer) {
    return c.json({ success: false, message: 'Customer not found' }, 404);
  }
  
  return c.json({ success: true, data: customer });
});

api.post('/customers', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const body = await c.req.json();
  
  const id = uuidv4();
  await db.prepare(`
    INSERT INTO customers (id, tenant_id, name, code, type, phone, email, address, latitude, longitude, route_id, credit_limit, payment_terms, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(id, tenantId, body.name, body.code, body.type || 'retail', body.phone, body.email, body.address, body.latitude, body.longitude, body.route_id, body.credit_limit || 0, body.payment_terms || 0, 'active').run();
  
  return c.json({ success: true, data: { id }, message: 'Customer created' }, 201);
});

api.put('/customers/:id', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  await db.prepare(`
    UPDATE customers SET name = ?, code = ?, type = ?, phone = ?, email = ?, address = ?, credit_limit = ?, status = ?
    WHERE id = ? AND tenant_id = ?
  `).bind(body.name, body.code, body.type, body.phone, body.email, body.address, body.credit_limit, body.status, id, tenantId).run();
  
  return c.json({ success: true, message: 'Customer updated' });
});

// ==================== PRODUCTS ====================
api.get('/products', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const { limit = 50, offset = 0, search, category_id, status } = c.req.query();
  
  let query = 'SELECT p.*, c.name as category_name, b.name as brand_name FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN brands b ON p.brand_id = b.id WHERE p.tenant_id = ?';
  const params = [tenantId];
  
  if (search) {
    query += ' AND (p.name LIKE ? OR p.code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category_id) {
    query += ' AND p.category_id = ?';
    params.push(category_id);
  }
  if (status) {
    query += ' AND p.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY p.name LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const products = await db.prepare(query).bind(...params).all();
  return c.json({ success: true, data: products.results || [] });
});

api.get('/products/:id', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const { id } = c.req.param();
  
  const product = await db.prepare('SELECT * FROM products WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first();
  
  if (!product) {
    return c.json({ success: false, message: 'Product not found' }, 404);
  }
  
  return c.json({ success: true, data: product });
});

api.post('/products', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const body = await c.req.json();
  
  const id = uuidv4();
  await db.prepare(`
    INSERT INTO products (id, tenant_id, name, code, sku, barcode, category_id, brand_id, unit_of_measure, price, cost_price, tax_rate, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(id, tenantId, body.name, body.code, body.sku, body.barcode, body.category_id, body.brand_id, body.unit_of_measure, body.price, body.cost_price, body.tax_rate || 0, 'active').run();
  
  return c.json({ success: true, data: { id }, message: 'Product created' }, 201);
});

// ==================== ORDERS ====================
api.get('/orders', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const { limit = 50, offset = 0, status, customer_id } = c.req.query();
  
  let query = 'SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.tenant_id = ?';
  const params = [tenantId];
  
  if (status) {
    query += ' AND o.order_status = ?';
    params.push(status);
  }
  if (customer_id) {
    query += ' AND o.customer_id = ?';
    params.push(customer_id);
  }
  
  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const orders = await db.prepare(query).bind(...params).all();
  return c.json({ success: true, data: orders.results || [] });
});

api.get('/orders/:id', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const { id } = c.req.param();
  
  const order = await db.prepare('SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ? AND o.tenant_id = ?').bind(id, tenantId).first();
  
  if (!order) {
    return c.json({ success: false, message: 'Order not found' }, 404);
  }
  
  const items = await db.prepare('SELECT oi.*, p.name as product_name FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?').bind(id).all();
  
  return c.json({ success: true, data: { ...order, items: items.results || [] } });
});

api.post('/orders', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const body = await c.req.json();
  
  const id = uuidv4();
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
  
  await db.prepare(`
    INSERT INTO orders (id, tenant_id, order_number, customer_id, salesman_id, order_date, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, order_status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(id, tenantId, orderNumber, body.customer_id, body.salesman_id, body.order_date || new Date().toISOString().split('T')[0], body.subtotal, body.tax_amount || 0, body.discount_amount || 0, body.total_amount, body.payment_method, 'pending', 'pending', body.notes).run();
  
  // Insert order items
  if (body.items && body.items.length > 0) {
    for (const item of body.items) {
      const itemId = uuidv4();
      await db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, discount_percentage, tax_percentage, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(itemId, id, item.product_id, item.quantity, item.unit_price, item.discount_percentage || 0, item.tax_percentage || 0, item.line_total).run();
    }
  }
  
  return c.json({ success: true, data: { id, orderNumber }, message: 'Order created' }, 201);
});

// ==================== VAN SALES ====================
api.get('/van-sales', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const { limit = 50, offset = 0, status, van_id, agent_id } = c.req.query();
  
  let query = 'SELECT vs.*, v.registration_number as van_registration, c.name as customer_name FROM van_sales vs LEFT JOIN vans v ON vs.van_id = v.id LEFT JOIN customers c ON vs.customer_id = c.id WHERE vs.tenant_id = ?';
  const params = [tenantId];
  
  if (status) {
    query += ' AND vs.status = ?';
    params.push(status);
  }
  if (van_id) {
    query += ' AND vs.van_id = ?';
    params.push(van_id);
  }
  if (agent_id) {
    query += ' AND vs.agent_id = ?';
    params.push(agent_id);
  }
  
  query += ' ORDER BY vs.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const sales = await db.prepare(query).bind(...params).all();
  return c.json({ success: true, data: sales.results || [] });
});

api.post('/van-sales', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const body = await c.req.json();
  
  const id = uuidv4();
  
  await db.prepare(`
    INSERT INTO van_sales (id, tenant_id, van_id, agent_id, customer_id, sale_date, sale_type, subtotal, tax_amount, discount_amount, total_amount, amount_paid, amount_due, payment_method, payment_reference, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(id, tenantId, body.van_id, body.agent_id, body.customer_id, body.sale_date || new Date().toISOString().split('T')[0], body.sale_type || 'cash', body.subtotal, body.tax_amount || 0, body.discount_amount || 0, body.total_amount, body.amount_paid || 0, body.amount_due || 0, body.payment_method, body.payment_reference, 'completed', body.notes).run();
  
  // Insert sale items
  if (body.items && body.items.length > 0) {
    for (const item of body.items) {
      const itemId = uuidv4();
      await db.prepare(`
        INSERT INTO van_sale_items (id, van_sale_id, product_id, quantity, unit_price, discount_percentage, tax_percentage, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(itemId, id, item.product_id, item.quantity, item.unit_price, item.discount_percentage || 0, item.tax_percentage || 0, item.line_total).run();
    }
  }
  
  return c.json({ success: true, data: { id }, message: 'Van sale created' }, 201);
});

// ==================== INVENTORY ====================
api.get('/inventory', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const { warehouse_id, product_id } = c.req.query();
  
  let query = 'SELECT i.*, p.name as product_name, p.code as product_code, w.name as warehouse_name FROM inventory_stock i LEFT JOIN products p ON i.product_id = p.id LEFT JOIN warehouses w ON i.warehouse_id = w.id WHERE i.tenant_id = ?';
  const params = [tenantId];
  
  if (warehouse_id) {
    query += ' AND i.warehouse_id = ?';
    params.push(warehouse_id);
  }
  if (product_id) {
    query += ' AND i.product_id = ?';
    params.push(product_id);
  }
  
  query += ' ORDER BY p.name';
  
  const inventory = await db.prepare(query).bind(...params).all();
  return c.json({ success: true, data: inventory.results || [] });
});

// ==================== VANS ====================
api.get('/vans', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  
  const vans = await db.prepare('SELECT * FROM vans WHERE tenant_id = ? ORDER BY registration_number').bind(tenantId).all();
  return c.json({ success: true, data: vans.results || [] });
});

api.get('/vans/:vanId/inventory', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const { vanId } = c.req.param();
  
  const inventory = await db.prepare(`
    SELECT vi.*, p.name as product_name, p.code as product_sku, p.price as unit_price
    FROM van_inventory vi
    LEFT JOIN products p ON vi.product_id = p.id
    WHERE vi.van_id = ? AND vi.tenant_id = ?
    ORDER BY p.name
  `).bind(vanId, tenantId).all();
  
  return c.json({ success: true, data: inventory.results || [] });
});

// ==================== VISITS ====================
api.get('/visits', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const { limit = 50, offset = 0, agent_id, customer_id, date } = c.req.query();
  
  let query = 'SELECT v.*, c.name as customer_name FROM visits v LEFT JOIN customers c ON v.customer_id = c.id WHERE v.tenant_id = ?';
  const params = [tenantId];
  
  if (agent_id) {
    query += ' AND v.agent_id = ?';
    params.push(agent_id);
  }
  if (customer_id) {
    query += ' AND v.customer_id = ?';
    params.push(customer_id);
  }
  if (date) {
    query += ' AND v.visit_date = ?';
    params.push(date);
  }
  
  query += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const visits = await db.prepare(query).bind(...params).all();
  return c.json({ success: true, data: visits.results || [] });
});

api.post('/visits', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const body = await c.req.json();
  
  const id = uuidv4();
  
  await db.prepare(`
    INSERT INTO visits (id, tenant_id, agent_id, customer_id, visit_date, check_in_time, latitude, longitude, visit_type, purpose, notes, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(id, tenantId, body.agent_id, body.customer_id, body.visit_date || new Date().toISOString().split('T')[0], body.check_in_time, body.latitude, body.longitude, body.visit_type, body.purpose, body.notes, 'in_progress').run();
  
  return c.json({ success: true, data: { id }, message: 'Visit started' }, 201);
});

// ==================== RETURNS ====================
api.get('/returns', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const { status, order_id } = c.req.query();
  
  let query = 'SELECT r.*, o.order_number FROM returns r LEFT JOIN orders o ON r.order_id = o.id WHERE r.tenant_id = ?';
  const params = [tenantId];
  
  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }
  if (order_id) {
    query += ' AND r.order_id = ?';
    params.push(order_id);
  }
  
  query += ' ORDER BY r.created_at DESC';
  
  const returns = await db.prepare(query).bind(...params).all();
  return c.json({ success: true, data: { returns: returns.results || [] } });
});

api.post('/returns', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const id = uuidv4();
  const returnNumber = `RET-${Date.now().toString(36).toUpperCase()}`;
  
  await db.prepare(`
    INSERT INTO returns (id, tenant_id, order_id, return_number, return_date, reason, status, total_amount, notes, created_by, created_at)
    VALUES (?, ?, ?, ?, datetime('now'), ?, 'pending', ?, ?, ?, datetime('now'))
  `).bind(id, tenantId, body.order_id, returnNumber, body.reason, body.total_amount || 0, body.notes, userId).run();
  
  return c.json({ success: true, data: { id, returnNumber }, message: 'Return created' }, 201);
});

// ==================== DASHBOARD ====================
api.get('/dashboard/stats', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  
  const [customers, products, orders, vanSales] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?').bind(tenantId).first(),
    db.prepare('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?').bind(tenantId).first(),
    db.prepare('SELECT COUNT(*) as count, SUM(total_amount) as total FROM orders WHERE tenant_id = ?').bind(tenantId).first(),
    db.prepare('SELECT COUNT(*) as count, SUM(total_amount) as total FROM van_sales WHERE tenant_id = ?').bind(tenantId).first()
  ]);
  
  return c.json({
    success: true,
    data: {
      customers: customers?.count || 0,
      products: products?.count || 0,
      orders: { count: orders?.count || 0, total: orders?.total || 0 },
      vanSales: { count: vanSales?.count || 0, total: vanSales?.total || 0 }
    }
  });
});

// ==================== CATEGORIES ====================
api.get('/categories', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  
  const categories = await db.prepare('SELECT * FROM categories WHERE tenant_id = ? ORDER BY name').bind(tenantId).all();
  return c.json({ success: true, data: categories.results || [] });
});

// ==================== BRANDS ====================
api.get('/brands', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  
  const brands = await db.prepare('SELECT * FROM brands WHERE tenant_id = ? ORDER BY name').bind(tenantId).all();
  return c.json({ success: true, data: brands.results || [] });
});

// ==================== WAREHOUSES ====================
api.get('/warehouses', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  
  const warehouses = await db.prepare('SELECT * FROM warehouses WHERE tenant_id = ? ORDER BY name').bind(tenantId).all();
  return c.json({ success: true, data: warehouses.results || [] });
});

// ==================== ROUTES ====================
api.get('/routes', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  
  const routes = await db.prepare('SELECT r.*, a.name as area_name FROM routes r LEFT JOIN areas a ON r.area_id = a.id WHERE r.tenant_id = ? ORDER BY r.name').bind(tenantId).all();
  return c.json({ success: true, data: routes.results || [] });
});

// ==================== AGENTS ====================
api.get('/agents', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  
  const agents = await db.prepare('SELECT a.*, u.first_name, u.last_name, u.email FROM agents a LEFT JOIN users u ON a.user_id = u.id WHERE a.tenant_id = ? ORDER BY u.first_name').bind(tenantId).all();
  return c.json({ success: true, data: agents.results || [] });
});

// ==================== COMMISSIONS ====================
api.get('/commissions', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  const { status, agent_id } = c.req.query();
  
  let query = 'SELECT * FROM commissions WHERE tenant_id = ?';
  const params = [tenantId];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (agent_id) {
    query += ' AND agent_id = ?';
    params.push(agent_id);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const commissions = await db.prepare(query).bind(...params).all();
  return c.json({ success: true, data: commissions.results || [] });
});

// ==================== CAMPAIGNS ====================
api.get('/trade-marketing/promotions', async (c) => {
  const db = c.env.DB;
  const tenantId = c.get('tenantId');
  
  const promotions = await db.prepare('SELECT * FROM promotional_campaigns WHERE tenant_id = ? ORDER BY created_at DESC').bind(tenantId).all();
  return c.json({ success: true, data: promotions.results || [] });
});

// Mount protected routes
app.route('/api', api);

// File upload endpoint (R2)
app.post('/api/upload', authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return c.json({ success: false, message: 'No file provided' }, 400);
    }
    
    const filename = `${Date.now()}-${file.name}`;
    await c.env.UPLOADS.put(filename, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
    
    return c.json({ success: true, data: { filename, url: `/files/${filename}` } });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ success: false, message: 'Upload failed' }, 500);
  }
});

// Serve files from R2
app.get('/files/:filename', async (c) => {
  const { filename } = c.req.param();
  const object = await c.env.UPLOADS.get(filename);
  
  if (!object) {
    return c.json({ success: false, message: 'File not found' }, 404);
  }
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  
  return new Response(object.body, { headers });
});

export default app;
