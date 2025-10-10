import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { TenantRequest } from '../middleware/tenant';

const router = express.Router();
const prisma = new PrismaClient();

// List all inventory with pagination and filters
router.get('/', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { 
      page = 1, 
      limit = 20, 
      productId, 
      lowStock,
      search 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { tenantId };


    if (productId) {
      where.productId = productId;
    }

    if (lowStock === 'true') {
      where.currentStock = { lte: prisma.inventory.fields.minStock };
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
    console.error('List inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get single inventory record
router.get('/:id', authenticateToken, async (req: TenantRequest, res: Response) => {
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
        }
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
router.post('/', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const {
      productId,
      currentStock,
      minStock,
      maxStock,
      location,
      unitCost,
      batchNumber,
      expiryDate
    } = req.body;

    // Validation
    if (!productId || currentStock === undefined) {
      return res.status(400).json({ 
        error: 'Product ID and current stock are required' 
      });
    }

    if (currentStock < 0) {
      return res.status(400).json({ error: 'Current stock cannot be negative' });
    }

    // Check if inventory record already exists
    const existing = await prisma.inventory.findFirst({
      where: {
        tenantId,
        productId,
        location
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
        currentStock,
        minStock: minStock || 0,
        maxStock: maxStock || 1000,
        location
      },
      include: {
        product: true
      }
    });

    res.status(201).json(inventory);
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ error: 'Failed to create inventory record' });
  }
});

// Update inventory record
router.put('/:id', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const { id } = req.params;
    const {
      currentStock,
      minStock,
      maxStock,
      location
    } = req.body;

    // Check if record exists
    const existing = await prisma.inventory.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }

    // Validation
    if (currentStock !== undefined && currentStock < 0) {
      return res.status(400).json({ error: 'Current stock cannot be negative' });
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

    res.json(inventory);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory record' });
  }
});

// Record inventory movement (IN/OUT/TRANSFER/ADJUSTMENT)
router.post('/movements', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const userId = (req.user as any).userId;
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
        error: 'Inventory ID, type, and quantity are required' 
      });
    }

    if (!['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'].includes(type)) {
      return res.status(400).json({ 
        error: 'Type must be IN, OUT, TRANSFER, or ADJUSTMENT' 
      });
    }

    // Get current inventory
    const inventory = await prisma.inventory.findFirst({
      where: { id: inventoryId, tenantId },
      include: { product: true }
    });

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory record not found' });
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
        error: 'Insufficient stock. Cannot reduce below zero.' 
      });
    }

    // Use transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update inventory
      const updatedInventory = await tx.inventory.update({
        where: { id: inventoryId },
        data: { currentStock: newQuantity }
      });

      // Note: Transfer logic simplified - would need destination location logic

      // Log the movement (if you have an InventoryMovement model)
      // await tx.inventoryMovement.create({ ... });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
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

// Get low stock alerts
router.get('/alerts/low-stock', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;

    // Find inventory items where current stock is less than or equal to minimum stock
    const lowStockItems = await prisma.$queryRaw`
      SELECT i.*, p.name as product_name, p.sku, pc.name as category_name
      FROM inventories i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE i.tenant_id = ${tenantId}
        AND i.min_stock > 0
        AND i.current_stock <= i.min_stock
      ORDER BY i.current_stock ASC
    ` as any[];

    res.json({
      count: lowStockItems.length,
      items: lowStockItems.map((item: any) => ({
        ...item,
        percentageRemaining: item.min_stock ? (item.current_stock / item.min_stock) * 100 : 100,
        shouldReorder: item.min_stock ? item.current_stock <= item.min_stock : false
      }))
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock alerts' });
  }
});

// Record stock count/reconciliation
router.post('/count', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = (req.user as any).tenantId;
    const userId = (req.user as any).userId;
    const {
      counts // Array of { productId, countedQuantity, notes }
    } = req.body;

    // Validation
    if (!counts || !Array.isArray(counts)) {
      return res.status(400).json({ 
        error: 'Counts array is required' 
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
          where: { tenantId, productId },
          include: { product: true }
        });

        if (!inventory) {
          // Create new inventory record
          await tx.inventory.create({
            data: {
              tenantId,
              productId,
              currentStock: countedQuantity,
              minStock: 0,
              maxStock: 1000
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
                userId,
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
router.delete('/:id', authenticateToken, async (req: TenantRequest, res: Response) => {
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
      data: { currentStock: 0 }
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
