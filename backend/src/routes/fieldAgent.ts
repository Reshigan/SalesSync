import { TenantRequest } from '../middleware/tenant';
import express from 'express';
import { prisma } from '../database';
import { logger } from '../utils/logger';

const router = express.Router();

// Field Agent CRUD Operations

// Get all field agents
router.get('/', async (req: TenantRequest, res, next) => {
  try {
    const { status, territoryId, page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      user: {
        tenantId: req.tenantId
      }
    };

    if (status) where.status = status;
    if (territoryId) where.territoryIds = { has: territoryId };

    const [fieldAgents, total] = await Promise.all([
      prisma.fieldAgent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true
            }
          },
          _count: {
            select: {
              boardPlacements: true,
              productDistributions: true,
              visitLists: true,
              commissions: true
            }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.fieldAgent.count({ where })
    ]);

    res.json({
      fieldAgents,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Error fetching field agents:', error);
    next(error);
  }
});

// Get single field agent
router.get('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const fieldAgent = await prisma.fieldAgent.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        boardPlacements: {
          include: {
            board: true,
            customer: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        productDistributions: {
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
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        visitLists: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        commissions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!fieldAgent) {
      return res.status(404).json({ error: 'Field agent not found' });
    }

    res.json(fieldAgent);
  } catch (error) {
    logger.error('Error fetching field agent:', error);
    next(error);
  }
});

// Create field agent
router.post('/', async (req: TenantRequest, res, next) => {
  try {
    const { userId, agentCode, territoryIds, commissionRate } = req.body;

    // Validation
    if (!userId || !agentCode) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'agentCode']
      });
    }

    // Check if user exists and has FIELD_AGENT role
    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        tenantId: req.tenantId
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'FIELD_AGENT') {
      return res.status(400).json({ error: 'User must have FIELD_AGENT role' });
    }

    // Check if field agent already exists for this user
    const existingAgent = await prisma.fieldAgent.findUnique({
      where: { userId }
    });

    if (existingAgent) {
      return res.status(400).json({ error: 'Field agent already exists for this user' });
    }

    const fieldAgent = await prisma.fieldAgent.create({
      data: {
        userId,
        agentCode,
        territoryIds: territoryIds || [],
        commissionRate: commissionRate || 0,
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    logger.info(`Field agent created: ${fieldAgent.id} for user ${userId}`);
    res.status(201).json(fieldAgent);
  } catch (error: any) {
    logger.error('Error creating field agent:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Agent code already exists' });
    }
    next(error);
  }
});

// Update field agent
router.put('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const { territoryIds, commissionRate, status } = req.body;

    // Verify field agent belongs to tenant
    const existingAgent = await prisma.fieldAgent.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingAgent) {
      return res.status(404).json({ error: 'Field agent not found' });
    }

    const updateData: any = {};
    if (territoryIds !== undefined) updateData.territoryIds = territoryIds;
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    if (status !== undefined) updateData.status = status;

    const fieldAgent = await prisma.fieldAgent.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    logger.info(`Field agent updated: ${id}`);
    res.json(fieldAgent);
  } catch (error) {
    logger.error('Error updating field agent:', error);
    next(error);
  }
});

// Delete field agent
router.delete('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const existingAgent = await prisma.fieldAgent.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingAgent) {
      return res.status(404).json({ error: 'Field agent not found' });
    }

    await prisma.fieldAgent.delete({
      where: { id }
    });

    logger.info(`Field agent deleted: ${id}`);
    res.json({ message: 'Field agent deleted successfully' });
  } catch (error) {
    logger.error('Error deleting field agent:', error);
    next(error);
  }
});

// Get field agent performance analytics
router.get('/:id/performance', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Verify field agent belongs to tenant
    const fieldAgent = await prisma.fieldAgent.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!fieldAgent) {
      return res.status(404).json({ error: 'Field agent not found' });
    }

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const whereClause: any = { fieldAgentId: id };
    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }

    const [
      boardPlacements,
      productDistributions,
      visitLists,
      commissions
    ] = await Promise.all([
      prisma.boardPlacement.findMany({
        where: whereClause,
        include: {
          board: true,
          customer: {
            select: { name: true, code: true }
          }
        }
      }),
      prisma.productDistribution.findMany({
        where: whereClause,
        include: {
          product: {
            select: { name: true, sku: true }
          },
          customer: {
            select: { name: true, code: true }
          }
        }
      }),
      prisma.visitList.findMany({
        where: whereClause,
        include: {
          customer: {
            select: { name: true, code: true }
          }
        }
      }),
      prisma.agentCommission.aggregate({
        where: {
          fieldAgentId: id,
          ...(Object.keys(dateFilter).length > 0 && { earnedDate: dateFilter })
        },
        _sum: { amount: true },
        _count: true
      })
    ]);

    const performance = {
      summary: {
        totalBoardPlacements: boardPlacements.length,
        totalProductDistributions: productDistributions.length,
        totalVisits: visitLists.length,
        totalCommissionEarned: commissions._sum.amount || 0,
        totalCommissionTransactions: commissions._count
      },
      boardPlacements,
      productDistributions,
      visitLists,
      commissionBreakdown: await prisma.agentCommission.groupBy({
        by: ['activityType'],
        where: {
          fieldAgentId: id,
          ...(Object.keys(dateFilter).length > 0 && { earnedDate: dateFilter })
        },
        _sum: { amount: true },
        _count: true
      })
    };

    res.json(performance);
  } catch (error) {
    logger.error('Error fetching field agent performance:', error);
    next(error);
  }
});

export default router;