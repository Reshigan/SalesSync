import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// List all inventory with pagination and filters
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { 
      page = 1, 
      limit = 20, 
      storeId, 
      productId, 
      lowStock,
      search 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { tenantId };

    if (storeId) {
      where.storeId = storeId;
    }

    if (productId) {
      where.productId = productId;
    }

    if (lowStock === 'true') {
      where.quantity = { lte: prisma.inventory.fields.reorderPoint };
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
          },
          store: true
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
    console.error('List inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get single inventory record
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { id } = req.params;

    const inventory = await prisma.inventory.findFirst({
      where: { id, tenantId },
      include: {
        product: {
          include: {
            category: true
          }
        },
        store: true
      }
    });

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }

    res.json(inventory);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory record' });
  }
});

// Create inventory record
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const {
      productId,
      storeId,
      quantity,
      reorderPoint,
      reorderQuantity,
      unitCost,
      batchNumber,
      expiryDate
    } = req.body;

    // Validation
    if (!productId || !storeId || quantity === undefined) {
      return res.status(400).json({ 
        error: 'Product ID, Store ID, and quantity are required' 
      });
    }

    if (quantity < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative' });
    }

    // Check if inventory record already exists
    const existing = await prisma.inventory.findFirst({
      where: {
        tenantId,
        productId,
        storeId
      }
    });

    if (existing) {
      return res.status(409).json({ 
        error: 'Inventory record already exists for this product at this location' 
      });
    }

    const inventory = await prisma.inventory.create({
      data: {
        tenantId,
        productId,
        storeId,
        quantity,
        reorderPoint: reorderPoint || 10,
        reorderQuantity: reorderQuantity || 50,
        unitCost: unitCost || 0,
        batchNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      },
      include: {
        product: true,
        store: true
      }
    });

    res.status(201).json(inventory);
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ error: 'Failed to create inventory record' });
  }
});

// Update inventory record
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { id } = req.params;
    const {
      quantity,
      reorderPoint,
      reorderQuantity,
      unitCost,
      batchNumber,
      expiryDate
    } = req.body;

    // Check if record exists
    const existing = await prisma.inventory.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }

    // Validation
    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative' });
    }

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (reorderPoint !== undefined) updateData.reorderPoint = reorderPoint;
    if (reorderQuantity !== undefined) updateData.reorderQuantity = reorderQuantity;
    if (unitCost !== undefined) updateData.unitCost = unitCost;
    if (batchNumber !== undefined) updateData.batchNumber = batchNumber;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;

    const inventory = await prisma.inventory.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
        store: true
      }
    });

    res.json(inventory);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory record' });
  }
});

// Record inventory movement (IN/OUT/TRANSFER/ADJUSTMENT)
router.post('/movements', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const userId = (req.user as any).userId;
    const {
      inventoryId,
      type, // IN, OUT, TRANSFER, ADJUSTMENT
      quantity,
      toStoreId, // For transfers
      reason,
      reference,
      notes
    } = req.body;

    // Validation
    if (!inventoryId || !type || quantity === undefined) {
      return res.status(400).json({ 
        error: 'Inventory ID, type, and quantity are required' 
      });
    }

    if (!['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'].includes(type)) {
      return res.status(400).json({ 
        error: 'Type must be IN, OUT, TRANSFER, or ADJUSTMENT' 
      });
    }

    if (type === 'TRANSFER' && !toStoreId) {
      return res.status(400).json({ 
        error: 'Destination store is required for transfers' 
      });
    }

    // Get current inventory
    const inventory = await prisma.inventory.findFirst({
      where: { id: inventoryId, tenantId },
      include: { product: true, store: true }
    });

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }

    // Calculate new quantity
    let newQuantity = inventory.quantity;
    if (type === 'IN' || type === 'ADJUSTMENT') {
      newQuantity += quantity;
    } else if (type === 'OUT' || type === 'TRANSFER') {
      newQuantity -= quantity;
    }

    if (newQuantity < 0) {
      return res.status(400).json({ 
        error: 'Insufficient stock. Cannot reduce below zero.' 
      });
    }

    // Use transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update inventory
      const updatedInventory = await tx.inventory.update({
        where: { id: inventoryId },
        data: { quantity: newQuantity }
      });

      // If transfer, update destination inventory
      if (type === 'TRANSFER' && toStoreId) {
        const destInventory = await tx.inventory.findFirst({
          where: {
            tenantId,
            productId: inventory.productId,
            storeId: toStoreId
          }
        });

        if (destInventory) {
          // Update existing
          await tx.inventory.update({
            where: { id: destInventory.id },
            data: { quantity: destInventory.quantity + quantity }
          });
        } else {
          // Create new
          await tx.inventory.create({
            data: {
              tenantId,
              productId: inventory.productId,
              storeId: toStoreId,
              quantity,
              reorderPoint: inventory.reorderPoint,
              reorderQuantity: inventory.reorderQuantity,
              unitCost: inventory.unitCost
            }
          });
        }
      }

      // Log the movement (if you have an InventoryMovement model)
      // await tx.inventoryMovement.create({ ... });

      // Create audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: `INVENTORY_${type}`,
          entity: 'Inventory',
          entityId: inventoryId,
          changes: {
            type,
            quantity,
            oldQuantity: inventory.quantity,
            newQuantity,
            toStoreId,
            reason,
            reference
          },
          ipAddress: req.ip || 'unknown'
        }
      });

      return updatedInventory;
    });

    res.json({
      success: true,
      message: `Inventory ${type.toLowerCase()} recorded successfully`,
      inventory: result
    });
  } catch (error) {
    console.error('Record movement error:', error);
    res.status(500).json({ error: 'Failed to record inventory movement' });
  }
});

// Transfer stock between locations
router.post('/transfer', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const userId = (req.user as any).userId;
    const {
      productId,
      fromStoreId,
      toStoreId,
      quantity,
      reason,
      reference
    } = req.body;

    // Validation
    if (!productId || !fromStoreId || !toStoreId || !quantity) {
      return res.status(400).json({ 
        error: 'Product, source store, destination store, and quantity are required' 
      });
    }

    if (fromStoreId === toStoreId) {
      return res.status(400).json({ 
        error: 'Source and destination stores must be different' 
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be positive' });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get source inventory
      const sourceInventory = await tx.inventory.findFirst({
        where: { tenantId, productId, storeId: fromStoreId }
      });

      if (!sourceInventory) {
        throw new Error('Source inventory not found');
      }

      if (sourceInventory.quantity < quantity) {
        throw new Error('Insufficient stock at source location');
      }

      // Update source inventory
      const updatedSource = await tx.inventory.update({
        where: { id: sourceInventory.id },
        data: { quantity: sourceInventory.quantity - quantity }
      });

      // Get or create destination inventory
      const destInventory = await tx.inventory.findFirst({
        where: { tenantId, productId, storeId: toStoreId }
      });

      let updatedDest;
      if (destInventory) {
        updatedDest = await tx.inventory.update({
          where: { id: destInventory.id },
          data: { quantity: destInventory.quantity + quantity }
        });
      } else {
        updatedDest = await tx.inventory.create({
          data: {
            tenantId,
            productId,
            storeId: toStoreId,
            quantity,
            reorderPoint: sourceInventory.reorderPoint,
            reorderQuantity: sourceInventory.reorderQuantity,
            unitCost: sourceInventory.unitCost
          }
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'INVENTORY_TRANSFER',
          entity: 'Inventory',
          entityId: sourceInventory.id,
          changes: {
            productId,
            fromStoreId,
            toStoreId,
            quantity,
            reason,
            reference
          },
          ipAddress: req.ip || 'unknown'
        }
      });

      return { source: updatedSource, destination: updatedDest };
    });

    res.json({
      success: true,
      message: 'Stock transferred successfully',
      transfer: result
    });
  } catch (error: any) {
    console.error('Transfer stock error:', error);
    res.status(500).json({ error: error.message || 'Failed to transfer stock' });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { storeId } = req.query;

    const where: any = {
      tenantId,
      quantity: { lte: prisma.inventory.fields.reorderPoint }
    };

    if (storeId) {
      where.storeId = storeId;
    }

    const lowStock = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: {
            category: true
          }
        },
        store: true
      },
      orderBy: [
        { quantity: 'asc' }
      ]
    });

    res.json({
      count: lowStock.length,
      items: lowStock.map(item => ({
        ...item,
        percentageRemaining: (item.quantity / item.reorderPoint) * 100,
        shouldReorder: item.quantity <= item.reorderPoint
      }))
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock alerts' });
  }
});

// Record stock count/reconciliation
router.post('/count', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const userId = (req.user as any).userId;
    const {
      storeId,
      counts // Array of { productId, countedQuantity, notes }
    } = req.body;

    // Validation
    if (!storeId || !counts || !Array.isArray(counts)) {
      return res.status(400).json({ 
        error: 'Store ID and counts array are required' 
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
          where: { tenantId, productId, storeId },
          include: { product: true }
        });

        if (!inventory) {
          // Create new inventory record
          await tx.inventory.create({
            data: {
              tenantId,
              productId,
              storeId,
              quantity: countedQuantity,
              reorderPoint: 10,
              reorderQuantity: 50,
              unitCost: 0
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
          const variance = countedQuantity - inventory.quantity;

          if (variance !== 0) {
            // Update inventory
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { quantity: countedQuantity }
            });

            adjustments.push({
              productId,
              productName: inventory.product.name,
              systemQuantity: inventory.quantity,
              countedQuantity,
              variance,
              notes
            });

            // Log adjustment
            await tx.auditLog.create({
              data: {
                tenantId,
                userId,
                action: 'INVENTORY_COUNT',
                entity: 'Inventory',
                entityId: inventory.id,
                changes: {
                  productId,
                  storeId,
                  systemQuantity: inventory.quantity,
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

    res.json({
      success: true,
      message: 'Stock count recorded successfully',
      adjustments: results,
      totalAdjustments: results.length
    });
  } catch (error) {
    console.error('Record stock count error:', error);
    res.status(500).json({ error: 'Failed to record stock count' });
  }
});

// Delete inventory record (soft delete - set quantity to 0)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { id } = req.params;

    // Check if record exists
    const existing = await prisma.inventory.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }

    // Soft delete by setting quantity to 0
    await prisma.inventory.update({
      where: { id },
      data: { quantity: 0 }
    });

    res.json({ 
      success: true, 
      message: 'Inventory record deleted successfully' 
    });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ error: 'Failed to delete inventory record' });
  }
});

export default router;
