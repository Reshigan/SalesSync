import express from 'express';
import { prisma } from '../database';
import { TenantRequest } from '../middleware/tenant';
import { requireManager } from '../middleware/auth';
import { validateCreateProduct, validateUpdateProduct } from '../utils/validation';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all products
router.get('/', async (req: TenantRequest, res) => {
  try {
    const { page = 1, limit = 10, category, brand, search, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      tenantId: req.tenantId
    };

    if (category) {
      where.category = category;
    }

    if (brand) {
      where.brand = brand;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get products error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch products'
    });
  }
});

// Get product by ID
router.get('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        priceHistories: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        inventories: {
          select: {
            currentStock: true,
            minStock: true,
            maxStock: true,
            location: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    return res.json({ product });
  } catch (error) {
    logger.error('Get product error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch product'
    });
  }
});

// Create product
router.post('/', requireManager, async (req: TenantRequest, res) => {
  try {
    const { error, value } = validateCreateProduct(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error?.details?.[0]?.message || "Validation failed"
      });
    }

    // Check if SKU already exists for this tenant
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku: value.sku,
        tenantId: req.tenantId
      }
    });

    if (existingProduct) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Product with this SKU already exists'
      });
    }

    const product = await prisma.product.create({
      data: {
        ...value,
        tenantId: req.tenantId!
      }
    });

    logger.info(`Product created: ${product.sku} by ${req.user?.email}`);

    return res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    logger.error('Create product error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create product'
    });
  }
});

// Update product
router.put('/:id', requireManager, async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validateUpdateProduct(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error?.details?.[0]?.message || "Validation failed"
      });
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    // If price is being updated, create price history record
    if (value.unitPrice && value.unitPrice !== existingProduct.unitPrice) {
      await prisma.priceHistory.create({
        data: {
          productId: id,
          price: value.unitPrice,
          reason: 'Price update'
        }
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: value
    });

    logger.info(`Product updated: ${product.sku} by ${req.user?.email}`);

    return res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    logger.error('Update product error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update product'
    });
  }
});

// Delete product
router.delete('/:id', requireManager, async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    logger.info(`Product deleted: ${existingProduct.sku} by ${req.user?.email}`);

    return res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Delete product error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete product'
    });
  }
});

// Get product categories
router.get('/meta/categories', async (req: TenantRequest, res) => {
  try {
    const categories = await prisma.productCategory.findMany({
      where: {
        tenantId: req.tenantId,
        isActive: true
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });

    return res.json({
      categories
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch categories'
    });
  }
});

// Get product brands
router.get('/meta/brands', async (req: TenantRequest, res) => {
  try {
    const brands = await prisma.product.findMany({
      where: {
        tenantId: req.tenantId,
        isActive: true,
        brand: { not: null }
      },
      select: {
        brand: true
      },
      distinct: ['brand']
    });

    return res.json({
      brands: brands.map((p: any) => p.brand).filter(Boolean)
    });
  } catch (error) {
    logger.error('Get brands error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch brands'
    });
  }
});

export default router;