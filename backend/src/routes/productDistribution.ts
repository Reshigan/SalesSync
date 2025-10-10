import { TenantRequest } from '../middleware/tenant';
import express from 'express';
import { prisma } from '../database';
import { logger } from '../utils/logger';

const router = express.Router();

// Product Distribution Routes

// Get all product distributions
router.get('/', async (req: TenantRequest, res, next) => {
  try {
    const { productId, customerId, agentId, status, page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (productId) where.productId = productId;
    if (customerId) where.customerId = customerId;
    if (agentId) where.agentId = agentId;
    if (status) where.status = status;

    const [distributions, total] = await Promise.all([
      prisma.productDistribution.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              brand: true
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true
            }
          },
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          fieldAgent: {
            select: {
              id: true,
              agentCode: true
            }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { distributionDate: 'desc' }
      }),
      prisma.productDistribution.count({ where })
    ]);

    res.json({
      distributions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    logger.error('Error fetching product distributions:', error);
    next(error);
  }
});

// Get single product distribution
router.get('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const distribution = await prisma.productDistribution.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            brand: true,
            description: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            coordinates: true
          }
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        fieldAgent: {
          select: {
            id: true,
            agentCode: true
          }
        }
      }
    });

    if (!distribution) {
      return res.status(404).json({ error: 'Product distribution not found' });
    }

    res.json(distribution);
  } catch (error: any) {
    logger.error('Error fetching product distribution:', error);
    next(error);
  }
});

// Create product distribution
router.post('/', async (req: TenantRequest, res, next) => {
  try {
    const {
      productId,
      customerId,
      recipientDetails,
      distributionForm,
      gpsLocation,
      notes
    } = req.body;

    // Validation
    if (!productId || !recipientDetails || !distributionForm || !gpsLocation) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['productId', 'recipientDetails', 'distributionForm', 'gpsLocation']
      });
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: req.tenantId
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verify customer exists if provided
    let customer = null;
    if (customerId) {
      customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          tenantId: req.tenantId
        }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
    }

    // Get field agent if user has FIELD_AGENT role
    let fieldAgentId = null;
    let commissionRate = 0;
    if (req.user!.role === 'FIELD_AGENT') {
      const fieldAgent = await prisma.fieldAgent.findUnique({
        where: { userId: req.user!.id }
      });
      if (fieldAgent) {
        fieldAgentId = fieldAgent.id;
        commissionRate = parseFloat(fieldAgent.commissionRate.toString());
      }
    }

    const distribution = await prisma.productDistribution.create({
      data: {
        productId,
        agentId: req.user!.id,
        fieldAgentId,
        customerId,
        recipientDetails,
        distributionForm,
        gpsLocation,
        commission: commissionRate,
        status: 'DISTRIBUTED',
        notes
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            brand: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create commission record if field agent
    if (fieldAgentId && commissionRate > 0) {
      await prisma.agentCommission.create({
        data: {
          agentId: req.user!.id,
          fieldAgentId,
          activityType: 'PRODUCT_DISTRIBUTION',
          activityId: distribution.id,
          amount: commissionRate,
          calculationDetails: {
            productName: product.name,
            productSku: product.sku,
            recipientName: recipientDetails.name,
            customerName: customer?.name || 'Direct Distribution'
          }
        }
      });
    }

    logger.info(`Product distribution created: ${distribution.id} by user ${req.user!.id}`);
    res.status(201).json(distribution);
  } catch (error: any) {
    logger.error('Error creating product distribution:', error);
    next(error);
  }
});

// Update product distribution status
router.patch('/:id/status', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['DISTRIBUTED', 'RETURNED', 'DAMAGED', 'LOST'].includes(status)) {
      return res.status(400).json({ error: 'Invalid distribution status' });
    }

    const updateData: any = { status };
    if (notes !== undefined) updateData.notes = notes;

    const distribution = await prisma.productDistribution.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    logger.info(`Product distribution status updated: ${id} to ${status}`);
    res.json(distribution);
  } catch (error: any) {
    logger.error('Error updating product distribution status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product distribution not found' });
    }
    next(error);
  }
});

// Delete product distribution
router.delete('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    await prisma.productDistribution.delete({
      where: { id }
    });

    logger.info(`Product distribution deleted: ${id}`);
    res.json({ message: 'Product distribution deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting product distribution:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product distribution not found' });
    }
    next(error);
  }
});

// Get distribution analytics
router.get('/analytics', async (req: TenantRequest, res, next) => {
  try {
    const { startDate, endDate, productId, agentId } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.distributionDate = {};
      if (startDate) where.distributionDate.gte = new Date(startDate as string);
      if (endDate) where.distributionDate.lte = new Date(endDate as string);
    }
    if (productId) where.productId = productId;
    if (agentId) where.agentId = agentId;

    const distributions = await prisma.productDistribution.findMany({
      where,
      include: {
        product: {
          select: { name: true, sku: true, brand: true }
        }
      }
    });

    const analytics = {
      totalDistributions: distributions.length,
      totalCommission: distributions.reduce((sum, d) => sum + parseFloat(d.commission.toString()), 0),
      statusBreakdown: {
        distributed: distributions.filter(d => d.status === 'DISTRIBUTED').length,
        returned: distributions.filter(d => d.status === 'RETURNED').length,
        damaged: distributions.filter(d => d.status === 'DAMAGED').length,
        lost: distributions.filter(d => d.status === 'LOST').length
      },
      productBreakdown: distributions.reduce((acc: any, d) => {
        const productName = d.product.name;
        acc[productName] = (acc[productName] || 0) + 1;
        return acc;
      }, {}),
      brandBreakdown: distributions.reduce((acc: any, d) => {
        const brand = d.product.brand || 'Unknown';
        acc[brand] = (acc[brand] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(analytics);
  } catch (error: any) {
    logger.error('Error fetching distribution analytics:', error);
    next(error);
  }
});

// Get nearby customers for distribution
router.get('/nearby-customers', async (req: TenantRequest, res, next) => {
  try {
    const { lat, lng, radius = '5' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['lat', 'lng']
      });
    }

    // This is a simplified version - in production, you'd use PostGIS or similar
    // for proper geospatial queries
    const customers = await prisma.customer.findMany({
      where: {
        tenantId: req.tenantId,
        coordinates: {
          not: {}
        }
      },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        coordinates: true,
        phone: true
      }
    });

    // Filter customers within radius (simplified calculation)
    const nearbyCustomers = customers.filter(customer => {
      if (!customer.coordinates || typeof customer.coordinates !== 'object') return false;
      
      const coords = customer.coordinates as any;
      if (!coords.lat || !coords.lng) return false;

      const distance = calculateDistance(
        parseFloat(lat as string),
        parseFloat(lng as string),
        coords.lat,
        coords.lng
      );

      return distance <= parseFloat(radius as string);
    }).map(customer => ({
      ...customer,
      distance: calculateDistance(
        parseFloat(lat as string),
        parseFloat(lng as string),
        (customer.coordinates as any).lat,
        (customer.coordinates as any).lng
      )
    })).sort((a, b) => a.distance - b.distance);

    res.json(nearbyCustomers);
  } catch (error: any) {
    logger.error('Error fetching nearby customers:', error);
    next(error);
  }
});

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default router;