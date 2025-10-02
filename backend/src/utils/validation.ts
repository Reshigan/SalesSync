import Joi from 'joi';

// Auth validation schemas
export const validateLogin = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });
  return schema.validate(data);
};

export const validateRegister = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid(
      'SUPER_ADMIN',
      'TENANT_ADMIN', 
      'MANAGER',
      'VAN_SALES_AGENT',
      'PROMOTER',
      'MERCHANDISER',
      'FIELD_AGENT',
      'WAREHOUSE_STAFF',
      'BACK_OFFICE'
    ).optional(),
    tenantSlug: Joi.string().alphanum().min(2).max(50).required()
  });
  return schema.validate(data);
};

// User validation schemas
export const validateCreateUser = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phone: Joi.string().optional(),
    role: Joi.string().valid(
      'TENANT_ADMIN', 
      'MANAGER',
      'VAN_SALES_AGENT',
      'PROMOTER',
      'MERCHANDISER',
      'FIELD_AGENT',
      'WAREHOUSE_STAFF',
      'BACK_OFFICE'
    ).required(),
    password: Joi.string().min(6).required()
  });
  return schema.validate(data);
};

export const validateUpdateUser = (data: any) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().optional(),
    role: Joi.string().valid(
      'TENANT_ADMIN', 
      'MANAGER',
      'VAN_SALES_AGENT',
      'PROMOTER',
      'MERCHANDISER',
      'FIELD_AGENT',
      'WAREHOUSE_STAFF',
      'BACK_OFFICE'
    ).optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').optional()
  });
  return schema.validate(data);
};

// Product validation schemas
export const validateCreateProduct = (data: any) => {
  const schema = Joi.object({
    sku: Joi.string().required(),
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).optional(),
    category: Joi.string().required(),
    brand: Joi.string().optional(),
    unitPrice: Joi.number().positive().required(),
    costPrice: Joi.number().positive().required(),
    weight: Joi.number().positive().optional(),
    dimensions: Joi.object().optional(),
    barcode: Joi.string().optional(),
    imageUrl: Joi.string().uri().optional()
  });
  return schema.validate(data);
};

export const validateUpdateProduct = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    category: Joi.string().optional(),
    brand: Joi.string().optional(),
    unitPrice: Joi.number().positive().optional(),
    costPrice: Joi.number().positive().optional(),
    weight: Joi.number().positive().optional(),
    dimensions: Joi.object().optional(),
    barcode: Joi.string().optional(),
    imageUrl: Joi.string().uri().optional(),
    isActive: Joi.boolean().optional()
  });
  return schema.validate(data);
};

// Customer validation schemas
export const validateCreateCustomer = (data: any) => {
  const schema = Joi.object({
    code: Joi.string().required(),
    name: Joi.string().min(2).max(200).required(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    country: Joi.string().max(100).optional(),
    coordinates: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required()
    }).optional(),
    customerType: Joi.string().valid('RETAIL', 'WHOLESALE', 'DISTRIBUTOR', 'CORPORATE').required(),
    creditLimit: Joi.number().positive().optional(),
    paymentTerms: Joi.string().optional()
  });
  return schema.validate(data);
};

// Order validation schemas
export const validateCreateOrder = (data: any) => {
  const schema = Joi.object({
    customerId: Joi.string().required(),
    deliveryDate: Joi.date().optional(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().positive().required(),
        unitPrice: Joi.number().positive().required(),
        discount: Joi.number().min(0).optional()
      })
    ).min(1).required(),
    notes: Joi.string().max(1000).optional()
  });
  return schema.validate(data);
};

// Route validation schemas
export const validateCreateRoute = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).optional(),
    startTime: Joi.date().optional(),
    stops: Joi.array().items(
      Joi.object({
        customerId: Joi.string().required(),
        sequence: Joi.number().integer().positive().required(),
        plannedTime: Joi.date().optional(),
        coordinates: Joi.object({
          latitude: Joi.number().required(),
          longitude: Joi.number().required()
        }).optional()
      })
    ).min(1).required()
  });
  return schema.validate(data);
};

// Van Sales validation schemas
export const validateCreateVanSalesLoad = (data: any) => {
  const schema = Joi.object({
    loadNumber: Joi.string().required(),
    loadDate: Joi.date().required(),
    routeId: Joi.string().optional(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().positive().required(),
        unitPrice: Joi.number().positive().required()
      })
    ).min(1).required(),
    notes: Joi.string().max(1000).optional()
  });
  return schema.validate(data);
};

export const validateReconciliation = (data: any) => {
  const schema = Joi.object({
    cashCollected: Joi.number().min(0).required(),
    stockReturned: Joi.object().required(),
    stockSold: Joi.object().required(),
    notes: Joi.string().max(1000).optional()
  });
  return schema.validate(data);
};

// Promoter validation schemas
export const validateCreatePromoterActivity = (data: any) => {
  const schema = Joi.object({
    campaignId: Joi.string().required(),
    activityType: Joi.string().required(),
    location: Joi.string().required(),
    startTime: Joi.date().required(),
    endTime: Joi.date().optional(),
    samplesDistributed: Joi.number().integer().min(0).optional(),
    contactsMade: Joi.number().integer().min(0).optional(),
    surveysCompleted: Joi.number().integer().min(0).optional(),
    photos: Joi.array().items(Joi.string()).optional(),
    notes: Joi.string().max(1000).optional()
  });
  return schema.validate(data);
};

// Merchandising validation schemas
export const validateCreateMerchandisingVisit = (data: any) => {
  const schema = Joi.object({
    storeId: Joi.string().required(),
    visitDate: Joi.date().required(),
    shelfShare: Joi.number().min(0).max(100).optional(),
    facingsCount: Joi.number().integer().min(0).optional(),
    complianceScore: Joi.number().min(0).max(100).optional(),
    issuesFound: Joi.array().items(Joi.string()).optional(),
    photos: Joi.array().items(Joi.string()).optional(),
    notes: Joi.string().max(1000).optional()
  });
  return schema.validate(data);
};

// Field Agent validation schemas
export const validateCreateSimDistribution = (data: any) => {
  const schema = Joi.object({
    customerName: Joi.string().min(2).max(200).required(),
    customerPhone: Joi.string().required(),
    customerType: Joi.string().required(),
    simNumber: Joi.string().required(),
    activationCode: Joi.string().required(),
    location: Joi.string().required(),
    distributionDate: Joi.date().required(),
    commission: Joi.number().positive().required()
  });
  return schema.validate(data);
};

// Inventory validation schemas
export const validateInventoryMovement = (data: any) => {
  const schema = Joi.object({
    productId: Joi.string().required(),
    movementType: Joi.string().valid('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER').required(),
    quantity: Joi.number().integer().required(),
    reason: Joi.string().max(500).optional(),
    reference: Joi.string().max(200).optional(),
    location: Joi.string().optional()
  });
  return schema.validate(data);
};

// Commission validation schemas
export const validateCreateCommission = (data: any) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    period: Joi.string().required(),
    baseSalary: Joi.number().min(0).required(),
    salesAmount: Joi.number().min(0).required(),
    commissionRate: Joi.number().min(0).max(100).required(),
    bonuses: Joi.number().min(0).optional(),
    deductions: Joi.number().min(0).optional()
  });
  return schema.validate(data);
};