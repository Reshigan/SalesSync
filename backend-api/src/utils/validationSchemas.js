/**
 * Joi Validation Schemas for all entities
 * Centralized validation schemas for consistent input validation
 */

const Joi = require('joi');

// Common field patterns
const patterns = {
  uuid: Joi.string().uuid(),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^(\+27|0)[0-9]{9}$/),
  saIdNumber: Joi.string().pattern(/^\d{13}$/),
  currency: Joi.number().min(0).max(999999999.99),
  percentage: Joi.number().min(0).max(100),
  date: Joi.string().isoDate(),
  datetime: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180)
};

// ==================== AUTH SCHEMAS ====================

const authSchemas = {
  login: Joi.object({
    email: patterns.email.required(),
    password: Joi.string().min(1).required(),
    tenantCode: Joi.string().optional()
  }),

  register: Joi.object({
    email: patterns.email.required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(100).required(),
    phone: patterns.phone.optional(),
    tenantCode: Joi.string().optional()
  }),

  mobileLogin: Joi.object({
    employeeCode: Joi.string().required(),
    pin: Joi.string().length(6).required(),
    tenantCode: Joi.string().required()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: patterns.email.required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required()
  })
};

// ==================== USER SCHEMAS ====================

const userSchemas = {
  create: Joi.object({
    email: patterns.email.required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('admin', 'manager', 'agent', 'viewer').default('viewer'),
    phone: patterns.phone.optional(),
    department: Joi.string().max(100).optional(),
    is_active: Joi.boolean().default(true)
  }),

  update: Joi.object({
    email: patterns.email.optional(),
    name: Joi.string().min(2).max(100).optional(),
    role: Joi.string().valid('admin', 'manager', 'agent', 'viewer').optional(),
    phone: patterns.phone.optional(),
    department: Joi.string().max(100).optional(),
    is_active: Joi.boolean().optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  })
};

// ==================== CUSTOMER SCHEMAS ====================

const customerSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    email: patterns.email.optional(),
    phone: patterns.phone.optional(),
    address: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    region: Joi.string().max(100).optional(),
    postal_code: Joi.string().max(20).optional(),
    country: Joi.string().max(100).default('South Africa'),
    business_type: Joi.string().valid('retail', 'wholesale', 'distributor', 'manufacturer', 'other').optional(),
    credit_limit: patterns.currency.optional(),
    payment_terms: Joi.number().integer().min(0).max(365).optional(),
    tax_number: Joi.string().max(50).optional(),
    contact_person: Joi.string().max(100).optional(),
    notes: Joi.string().max(1000).optional(),
    latitude: patterns.latitude.optional(),
    longitude: patterns.longitude.optional(),
    route_id: Joi.string().optional(),
    agent_id: Joi.string().optional(),
    is_active: Joi.boolean().default(true)
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    email: patterns.email.optional(),
    phone: patterns.phone.optional(),
    address: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    region: Joi.string().max(100).optional(),
    postal_code: Joi.string().max(20).optional(),
    country: Joi.string().max(100).optional(),
    business_type: Joi.string().valid('retail', 'wholesale', 'distributor', 'manufacturer', 'other').optional(),
    credit_limit: patterns.currency.optional(),
    payment_terms: Joi.number().integer().min(0).max(365).optional(),
    tax_number: Joi.string().max(50).optional(),
    contact_person: Joi.string().max(100).optional(),
    notes: Joi.string().max(1000).optional(),
    latitude: patterns.latitude.optional(),
    longitude: patterns.longitude.optional(),
    route_id: Joi.string().optional(),
    agent_id: Joi.string().optional(),
    is_active: Joi.boolean().optional()
  })
};

// ==================== PRODUCT SCHEMAS ====================

const productSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    sku: Joi.string().min(1).max(50).required(),
    barcode: Joi.string().max(50).optional(),
    description: Joi.string().max(1000).optional(),
    category_id: Joi.string().optional(),
    brand_id: Joi.string().optional(),
    unit_price: patterns.currency.required(),
    cost_price: patterns.currency.optional(),
    tax_rate: patterns.percentage.default(15),
    unit_of_measure: Joi.string().max(20).default('each'),
    min_stock_level: Joi.number().integer().min(0).optional(),
    max_stock_level: Joi.number().integer().min(0).optional(),
    reorder_point: Joi.number().integer().min(0).optional(),
    weight: Joi.number().min(0).optional(),
    dimensions: Joi.string().max(50).optional(),
    is_active: Joi.boolean().default(true)
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    sku: Joi.string().min(1).max(50).optional(),
    barcode: Joi.string().max(50).optional(),
    description: Joi.string().max(1000).optional(),
    category_id: Joi.string().optional(),
    brand_id: Joi.string().optional(),
    unit_price: patterns.currency.optional(),
    cost_price: patterns.currency.optional(),
    tax_rate: patterns.percentage.optional(),
    unit_of_measure: Joi.string().max(20).optional(),
    min_stock_level: Joi.number().integer().min(0).optional(),
    max_stock_level: Joi.number().integer().min(0).optional(),
    reorder_point: Joi.number().integer().min(0).optional(),
    weight: Joi.number().min(0).optional(),
    dimensions: Joi.string().max(50).optional(),
    is_active: Joi.boolean().optional()
  })
};

// ==================== ORDER SCHEMAS ====================

const orderSchemas = {
  create: Joi.object({
    customer_id: Joi.string().required(),
    order_date: patterns.date.optional(),
    delivery_date: patterns.date.optional(),
    status: Joi.string().valid('draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').default('pending'),
    payment_status: Joi.string().valid('unpaid', 'partial', 'paid').default('unpaid'),
    payment_method: Joi.string().valid('cash', 'card', 'bank_transfer', 'credit').optional(),
    shipping_address: Joi.string().max(500).optional(),
    billing_address: Joi.string().max(500).optional(),
    notes: Joi.string().max(1000).optional(),
    discount_amount: patterns.currency.default(0),
    discount_percentage: patterns.percentage.default(0),
    tax_amount: patterns.currency.optional(),
    shipping_amount: patterns.currency.default(0),
    items: Joi.array().items(Joi.object({
      product_id: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      unit_price: patterns.currency.required(),
      discount: patterns.currency.default(0),
      notes: Joi.string().max(500).optional()
    })).min(1).required()
  }),

  update: Joi.object({
    delivery_date: patterns.date.optional(),
    status: Joi.string().valid('draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
    payment_status: Joi.string().valid('unpaid', 'partial', 'paid').optional(),
    payment_method: Joi.string().valid('cash', 'card', 'bank_transfer', 'credit').optional(),
    shipping_address: Joi.string().max(500).optional(),
    billing_address: Joi.string().max(500).optional(),
    notes: Joi.string().max(1000).optional(),
    discount_amount: patterns.currency.optional(),
    discount_percentage: patterns.percentage.optional(),
    shipping_amount: patterns.currency.optional()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').required(),
    notes: Joi.string().max(500).optional()
  })
};

// ==================== VISIT SCHEMAS ====================

const visitSchemas = {
  create: Joi.object({
    customer_id: Joi.string().required(),
    agent_id: Joi.string().optional(),
    visit_type: Joi.string().valid('sales', 'delivery', 'collection', 'survey', 'merchandising', 'other').required(),
    scheduled_date: patterns.datetime.optional(),
    latitude: patterns.latitude.required(),
    longitude: patterns.longitude.required(),
    notes: Joi.string().max(1000).optional(),
    objectives: Joi.array().items(Joi.string()).optional()
  }),

  update: Joi.object({
    visit_type: Joi.string().valid('sales', 'delivery', 'collection', 'survey', 'merchandising', 'other').optional(),
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled', 'missed').optional(),
    check_in_time: patterns.datetime.optional(),
    check_out_time: patterns.datetime.optional(),
    latitude: patterns.latitude.optional(),
    longitude: patterns.longitude.optional(),
    notes: Joi.string().max(1000).optional(),
    outcome: Joi.string().max(500).optional()
  }),

  checkIn: Joi.object({
    latitude: patterns.latitude.required(),
    longitude: patterns.longitude.required(),
    notes: Joi.string().max(500).optional()
  }),

  checkOut: Joi.object({
    latitude: patterns.latitude.required(),
    longitude: patterns.longitude.required(),
    outcome: Joi.string().max(500).optional(),
    notes: Joi.string().max(500).optional()
  })
};

// ==================== INVENTORY SCHEMAS ====================

const inventorySchemas = {
  stockMovement: Joi.object({
    product_id: Joi.string().required(),
    warehouse_id: Joi.string().required(),
    movement_type: Joi.string().valid('in', 'out', 'transfer', 'adjustment', 'return').required(),
    quantity: Joi.number().integer().required(),
    reference_type: Joi.string().optional(),
    reference_id: Joi.string().optional(),
    notes: Joi.string().max(500).optional(),
    batch_number: Joi.string().max(50).optional(),
    expiry_date: patterns.date.optional()
  }),

  stockAdjustment: Joi.object({
    product_id: Joi.string().required(),
    warehouse_id: Joi.string().required(),
    adjustment_type: Joi.string().valid('count', 'damage', 'expiry', 'theft', 'other').required(),
    quantity: Joi.number().integer().required(),
    reason: Joi.string().max(500).required(),
    notes: Joi.string().max(500).optional()
  }),

  stockTransfer: Joi.object({
    product_id: Joi.string().required(),
    from_warehouse_id: Joi.string().required(),
    to_warehouse_id: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    notes: Joi.string().max(500).optional()
  })
};

// ==================== WAREHOUSE SCHEMAS ====================

const warehouseSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(1).max(20).required(),
    address: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    region: Joi.string().max(100).optional(),
    manager_id: Joi.string().optional(),
    phone: patterns.phone.optional(),
    email: patterns.email.optional(),
    capacity: Joi.number().integer().min(0).optional(),
    is_active: Joi.boolean().default(true)
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    code: Joi.string().min(1).max(20).optional(),
    address: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    region: Joi.string().max(100).optional(),
    manager_id: Joi.string().optional(),
    phone: patterns.phone.optional(),
    email: patterns.email.optional(),
    capacity: Joi.number().integer().min(0).optional(),
    is_active: Joi.boolean().optional()
  })
};

// ==================== PAYMENT SCHEMAS ====================

const paymentSchemas = {
  create: Joi.object({
    customer_id: Joi.string().optional(),
    invoice_id: Joi.string().optional(),
    order_id: Joi.string().optional(),
    amount: patterns.currency.required(),
    payment_method: Joi.string().valid('cash', 'card', 'bank_transfer', 'cheque', 'mobile_money', 'credit').required(),
    payment_date: patterns.date.optional(),
    reference_number: Joi.string().max(100).optional(),
    notes: Joi.string().max(500).optional()
  }),

  update: Joi.object({
    amount: patterns.currency.optional(),
    payment_method: Joi.string().valid('cash', 'card', 'bank_transfer', 'cheque', 'mobile_money', 'credit').optional(),
    status: Joi.string().valid('pending', 'completed', 'failed', 'refunded').optional(),
    reference_number: Joi.string().max(100).optional(),
    notes: Joi.string().max(500).optional()
  })
};

// ==================== PROMOTION SCHEMAS ====================

const promotionSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).optional(),
    promotion_type: Joi.string().valid('discount', 'bogo', 'bundle', 'free_item', 'percentage', 'fixed').required(),
    discount_value: Joi.number().min(0).optional(),
    discount_percentage: patterns.percentage.optional(),
    start_date: patterns.date.required(),
    end_date: patterns.date.required(),
    min_purchase_amount: patterns.currency.optional(),
    max_discount_amount: patterns.currency.optional(),
    applicable_products: Joi.array().items(Joi.string()).optional(),
    applicable_categories: Joi.array().items(Joi.string()).optional(),
    applicable_customers: Joi.array().items(Joi.string()).optional(),
    usage_limit: Joi.number().integer().min(0).optional(),
    is_active: Joi.boolean().default(true)
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    promotion_type: Joi.string().valid('discount', 'bogo', 'bundle', 'free_item', 'percentage', 'fixed').optional(),
    discount_value: Joi.number().min(0).optional(),
    discount_percentage: patterns.percentage.optional(),
    start_date: patterns.date.optional(),
    end_date: patterns.date.optional(),
    min_purchase_amount: patterns.currency.optional(),
    max_discount_amount: patterns.currency.optional(),
    applicable_products: Joi.array().items(Joi.string()).optional(),
    applicable_categories: Joi.array().items(Joi.string()).optional(),
    applicable_customers: Joi.array().items(Joi.string()).optional(),
    usage_limit: Joi.number().integer().min(0).optional(),
    is_active: Joi.boolean().optional()
  })
};

// ==================== SUPPLIER SCHEMAS ====================

const supplierSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    code: Joi.string().min(1).max(20).optional(),
    email: patterns.email.optional(),
    phone: patterns.phone.optional(),
    address: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    country: Joi.string().max(100).default('South Africa'),
    contact_person: Joi.string().max(100).optional(),
    payment_terms: Joi.number().integer().min(0).max(365).optional(),
    tax_number: Joi.string().max(50).optional(),
    bank_details: Joi.string().max(500).optional(),
    notes: Joi.string().max(1000).optional(),
    is_active: Joi.boolean().default(true)
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    code: Joi.string().min(1).max(20).optional(),
    email: patterns.email.optional(),
    phone: patterns.phone.optional(),
    address: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    country: Joi.string().max(100).optional(),
    contact_person: Joi.string().max(100).optional(),
    payment_terms: Joi.number().integer().min(0).max(365).optional(),
    tax_number: Joi.string().max(50).optional(),
    bank_details: Joi.string().max(500).optional(),
    notes: Joi.string().max(1000).optional(),
    is_active: Joi.boolean().optional()
  })
};

// ==================== PURCHASE ORDER SCHEMAS ====================

const purchaseOrderSchemas = {
  create: Joi.object({
    supplier_id: Joi.string().required(),
    order_date: patterns.date.optional(),
    expected_delivery_date: patterns.date.optional(),
    warehouse_id: Joi.string().required(),
    notes: Joi.string().max(1000).optional(),
    items: Joi.array().items(Joi.object({
      product_id: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      unit_cost: patterns.currency.required(),
      notes: Joi.string().max(500).optional()
    })).min(1).required()
  }),

  update: Joi.object({
    expected_delivery_date: patterns.date.optional(),
    status: Joi.string().valid('draft', 'pending', 'approved', 'ordered', 'partial', 'received', 'cancelled').optional(),
    notes: Joi.string().max(1000).optional()
  }),

  receive: Joi.object({
    items: Joi.array().items(Joi.object({
      product_id: Joi.string().required(),
      quantity_received: Joi.number().integer().min(0).required(),
      batch_number: Joi.string().max(50).optional(),
      expiry_date: patterns.date.optional(),
      notes: Joi.string().max(500).optional()
    })).min(1).required(),
    notes: Joi.string().max(500).optional()
  })
};

// ==================== VAN SALES SCHEMAS ====================

const vanSalesSchemas = {
  loadVan: Joi.object({
    van_id: Joi.string().required(),
    agent_id: Joi.string().required(),
    load_date: patterns.date.optional(),
    items: Joi.array().items(Joi.object({
      product_id: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      batch_number: Joi.string().max(50).optional()
    })).min(1).required(),
    cash_float: patterns.currency.default(0),
    notes: Joi.string().max(500).optional()
  }),

  recordSale: Joi.object({
    van_id: Joi.string().required(),
    customer_id: Joi.string().required(),
    items: Joi.array().items(Joi.object({
      product_id: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      unit_price: patterns.currency.required(),
      discount: patterns.currency.default(0)
    })).min(1).required(),
    payment_method: Joi.string().valid('cash', 'card', 'credit').required(),
    amount_paid: patterns.currency.required(),
    latitude: patterns.latitude.optional(),
    longitude: patterns.longitude.optional(),
    notes: Joi.string().max(500).optional()
  }),

  reconcile: Joi.object({
    van_id: Joi.string().required(),
    cash_collected: patterns.currency.required(),
    cash_returned: patterns.currency.default(0),
    items_returned: Joi.array().items(Joi.object({
      product_id: Joi.string().required(),
      quantity: Joi.number().integer().min(0).required(),
      reason: Joi.string().max(200).optional()
    })).optional(),
    notes: Joi.string().max(500).optional()
  })
};

// ==================== COMMISSION SCHEMAS ====================

const commissionSchemas = {
  create: Joi.object({
    agent_id: Joi.string().required(),
    commission_type: Joi.string().valid('sales', 'collection', 'visit', 'activation', 'other').required(),
    reference_type: Joi.string().optional(),
    reference_id: Joi.string().optional(),
    amount: patterns.currency.required(),
    rate: patterns.percentage.optional(),
    base_amount: patterns.currency.optional(),
    notes: Joi.string().max(500).optional()
  }),

  approve: Joi.object({
    commission_ids: Joi.array().items(Joi.string()).min(1).required(),
    notes: Joi.string().max(500).optional()
  }),

  pay: Joi.object({
    commission_ids: Joi.array().items(Joi.string()).min(1).required(),
    payment_method: Joi.string().valid('bank_transfer', 'cash', 'cheque').required(),
    payment_reference: Joi.string().max(100).optional(),
    notes: Joi.string().max(500).optional()
  })
};

// ==================== SURVEY SCHEMAS ====================

const surveySchemas = {
  create: Joi.object({
    title: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).optional(),
    survey_type: Joi.string().valid('customer', 'product', 'market', 'satisfaction', 'other').required(),
    questions: Joi.array().items(Joi.object({
      question: Joi.string().required(),
      question_type: Joi.string().valid('text', 'number', 'single_choice', 'multiple_choice', 'rating', 'date').required(),
      options: Joi.array().items(Joi.string()).optional(),
      required: Joi.boolean().default(false)
    })).min(1).required(),
    start_date: patterns.date.optional(),
    end_date: patterns.date.optional(),
    is_active: Joi.boolean().default(true)
  }),

  submitResponse: Joi.object({
    survey_id: Joi.string().required(),
    customer_id: Joi.string().optional(),
    responses: Joi.object().required(),
    latitude: patterns.latitude.optional(),
    longitude: patterns.longitude.optional()
  })
};

// ==================== VALIDATION MIDDLEWARE ====================

/**
 * Create validation middleware from Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors
        }
      });
    }

    req[source] = value;
    next();
  };
};

module.exports = {
  patterns,
  authSchemas,
  userSchemas,
  customerSchemas,
  productSchemas,
  orderSchemas,
  visitSchemas,
  inventorySchemas,
  warehouseSchemas,
  paymentSchemas,
  promotionSchemas,
  supplierSchemas,
  purchaseOrderSchemas,
  vanSalesSchemas,
  commissionSchemas,
  surveySchemas,
  validate
};
