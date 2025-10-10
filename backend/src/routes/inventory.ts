import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant';
import { logger } from '../utils/logger';
import { prisma } from '../services/database';

const router = express.Router();

// List all inventory with pagination and filters
router.get('/', authenticateToken, tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      productId, 
      lowStock,
      search 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { tenantId: req.tenantId };

    if (productId) {
      where.productId = productId;
    }

    if (lowStock === 'true') {
      where.AND = [
        { currentStock: { lte: prisma.inventory.fields.minStock } }
      ];
    }

    if (search) {
      where.product = {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { sku: { contains: search as string, mode: 'insensitive' } }
        ]
      };
    }

    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        skip,
        take,
        include: {
          product: {
            include: {
              category: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.inventory.count({ where })
    ]);

    res.json({
      data: inventory,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('List inventory error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch inventory' 
    });
  }
});

// Get single inventory record
router.get('/:id', authenticateToken, tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;

    const inventory = await prisma.inventory.findFirst({
      where: { id, tenantId: req.tenantId },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    if (!inventory) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Inventory record not found' 
      });
    }

    res.json(inventory);
  } catch (error) {
    logger.error('Get inventory error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch inventory record' 
    });
  }
});

// Create inventory record
router.post('/', authenticateToken, tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const {
      productId,
      currentStock,
      minStock,
      maxStock,
      location
    } = req.body;

    // Validation
    if (!productId || currentStock === undefined) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Product ID and current stock are required' 
      });
    }

    if (currentStock < 0) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Current stock cannot be negative' 
      });
    }

    // Check if inventory record already exists
    const existing = await prisma.inventory.findFirst({
      where: {
        tenantId: req.tenantId,
        productId,
        location: location || 'MAIN'
      }
    });

    if (existing) {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'Inventory record already exists for this product at this location' 
      });
    }

    const inventory = await prisma.inventory.create({
      data: {
        tenantId: req.tenantId!,
        productId,
        currentStock,
        minStock: minStock || 0,
        maxStock: maxStock || 1000,
        location: location || 'MAIN'
      },
      include: {
        product: true
      }
    });

    logger.info(`Inventory created for product ${productId} by ${req.user?.email}`);

    res.status(201).json({
      message: 'Inventory record created successfully',
      inventory
    });
  } catch (error) {
    logger.error('Create inventory error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to create inventory record' 
    });
  }
});

// Update inventory record
router.put('/:id', authenticateToken, tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      currentStock,
      minStock,
      maxStock,
      location
    } = req.body;

    // Check if record exists
    const existing = await prisma.inventory.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Inventory record not found' 
      });
    }

    // Validation
    if (currentStock !== undefined && currentStock < 0) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Current stock cannot be negative' 
      });
    }

    const updateData: any = {};
    if (currentStock !== undefined) updateData.currentStock = currentStock;
    if (minStock !== undefined) updateData.minStock = minStock;
    if (maxStock !== undefined) updateData.maxStock = maxStock;
    if (location !== undefined) updateData.location = location;

    const inventory = await prisma.inventory.update({
      where: { id },
      data: updateData,
      include: {
        product: true
      }
    });

    logger.info(`Inventory updated: ${id} by ${req.user?.email}`);

    res.json({
      message: 'Inventory record updated successfully',
      inventory
    });
  } catch (error) {
    logger.error('Update inventory error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to update inventory record' 
    });
  }
});

// Record inventory movement (IN/OUT/TRANSFER/ADJUSTMENT)
router.post('/movements', authenticateToken, tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const {
      inventoryId,
      type, // IN, OUT, TRANSFER, ADJUSTMENT
      quantity,
      reason,
      reference,
      notes
    } = req.body;

    // Validation
    if (!inventoryId || !type || quantity === undefined) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Inventory ID, type, and quantity are required' 
      });
    }

    if (!['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'].includes(type)) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Type must be IN, OUT, TRANSFER, or ADJUSTMENT' 
      });
    }

    // Get current inventory
    const inventory = await prisma.inventory.findFirst({
      where: { id: inventoryId, tenantId: req.tenantId },
      include: { product: true }
    });

    if (!inventory) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Inventory record not found' 
      });
    }

    // Calculate new quantity
    let newQuantity = inventory.currentStock;
    if (type === 'IN' || type === 'ADJUSTMENT') {
      newQuantity += quantity;
    } else if (type === 'OUT' || type === 'TRANSFER') {
      newQuantity -= quantity;
    }

    if (newQuantity < 0) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Insufficient stock. Cannot reduce below zero.' 
      });
    }

    // Use transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update inventory
      const updatedInventory = await tx.inventory.update({
        where: { id: inventoryId },
        data: { currentStock: newQuantity }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: `INVENTORY_${type}`,
          entity: 'Inventory',
          entityId: inventoryId,
          oldValues: { quantity: inventory.currentStock },
          newValues: {
            type,
            quantity,
            newQuantity,
            reason,
            reference
          },
          ipAddress: req.ip || 'unknown'
        }
      });

      return updatedInventory;
    });

    logger.info(`Inventory movement recorded: ${type} ${quantity} for ${inventory.product.name} by ${req.user?.email}`);

    res.json({
      message: `Inventory ${type.toLowerCase()} recorded successfully`,
      inventory: result,
      movement: {
        type,
        quantity,
        previousQuantity: inventory.currentStock,
        newQuantity,
        reason,
        reference
      }
    });
  } catch (error) {
    logger.error('Record movement error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to record inventory movement' 
    });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', authenticateToken, tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    // Find inventory items where current stock is less than or equal to minimum stock
    const lowStockItems = await prisma.inventory.findMany({
      where: {
        tenantId: req.tenantId,
        minStock: { gt: 0 },
        currentStock: { lte: prisma.inventory.fields.minStock }
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: { currentStock: 'asc' }
    });

    const alertItems = lowStockItems.map(item => ({
      ...item,
      percentageRemaining: item.minStock ? (item.currentStock / item.minStock) * 100 : 100,
      shouldReorder: item.currentStock <= item.minStock,
      stockStatus: item.currentStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
    }));

    res.json({
      count: alertItems.length,
      items: alertItems
    });
  } catch (error) {
    logger.error('Get low stock error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch low stock alerts' 
    });
  }
});

// Get inventory statistics
router.get('/stats/overview', authenticateToken, tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const [
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalValue
    ] = await Promise.all([
      prisma.inventory.count({
        where: { tenantId: req.tenantId }
      }),
      prisma.inventory.count({
        where: {
          tenantId: req.tenantId,
          minStock: { gt: 0 },
          currentStock: { lte: prisma.inventory.fields.minStock }
        }
      }),
      prisma.inventory.count({
        where: {
          tenantId: req.tenantId,
          currentStock: 0
        }
      }),
      prisma.inventory.aggregate({
        where: { tenantId: req.tenantId },
        _sum: { currentStock: true }
      })
    ]);

    res.json({
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalStockUnits: totalValue._sum.currentStock || 0,
      stockStatus: {
        healthy: totalProducts - lowStockCount - outOfStockCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount
      }
    });
  } catch (error) {
    logger.error('Get inventory stats error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch inventory statistics' 
    });
  }
});

// Record stock count/reconciliation
router.post('/count', authenticateToken, tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const {
      counts // Array of { productId, countedQuantity, notes }
    } = req.body;

    // Validation
    if (!counts || !Array.isArray(counts)) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Counts array is required' 
      });
    }

    // Process each count in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const adjustments = [];

      for (const count of counts) {
        const { productId, countedQuantity, notes } = count;

        if (!productId || countedQuantity === undefined) {
          continue; // Skip invalid entries
        }

        // Get current inventory
        const inventory = await tx.inventory.findFirst({
          where: { tenantId: req.tenantId, productId },
          include: { product: true }
        });

        if (!inventory) {
          // Create new inventory record
          await tx.inventory.create({
            data: {
              tenantId: req.tenantId!,
              productId,
              currentStock: countedQuantity,
              minStock: 0,
              maxStock: 1000,
              location: 'MAIN'
            }
          });

          adjustments.push({
            productId,
            productName: 'New Product',
            systemQuantity: 0,
            countedQuantity,
            variance: countedQuantity,
            notes
          });
        } else {
          const variance = countedQuantity - inventory.currentStock;

          if (variance !== 0) {
            // Update inventory
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { currentStock: countedQuantity }
            });

            adjustments.push({
              productId,
              productName: inventory.product.name,
              systemQuantity: inventory.currentStock,
              countedQuantity,
              variance,
              notes
            });

            // Log adjustment
            await tx.auditLog.create({
              data: {
                userId: req.user!.id,
                action: 'INVENTORY_COUNT',
                entity: 'Inventory',
                entityId: inventory.id,
                oldValues: { quantity: inventory.currentStock },
                newValues: {
                  productId,
                  countedQuantity,
                  variance,
                  notes
                },
                ipAddress: req.ip || 'unknown'
              }
            });
          }
        }
      }

      return adjustments;
    });

    logger.info(`Stock count recorded: ${results.length} adjustments by ${req.user?.email}`);

    res.json({
      message: 'Stock count recorded successfully',
      adjustments: results,
      totalAdjustments: results.length
    });
  } catch (error) {
    logger.error('Record stock count error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to record stock count' 
    });
  }
});

// Delete inventory record (soft delete - set quantity to 0)
router.delete('/:id', authenticateToken, tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if record exists
    const existing = await prisma.inventory.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Inventory record not found' 
      });
    }

    // Soft delete by setting quantity to 0
    await prisma.inventory.update({
      where: { id },
      data: { currentStock: 0 }
    });

    logger.info(`Inventory deleted: ${id} by ${req.user?.email}`);

    res.json({ 
      message: 'Inventory record deleted successfully' 
    });
  } catch (error) {
    logger.error('Delete inventory error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to delete inventory record' 
    });
  }
});

export default router;