import { TenantRequest } from '../middleware/tenant';
import express from 'express';
import { prisma } from '../database';
import { logger } from '../utils/logger';

const router = express.Router();

// Board Management Routes

// Get all boards
router.get('/', async (req: TenantRequest, res, next) => {
  try {
    const { isActive, boardType, page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (boardType) where.boardType = boardType;

    const [boards, total] = await Promise.all([
      prisma.board.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              placements: true
            }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.board.count({ where })
    ]);

    res.json({
      boards,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    logger.error('Error fetching boards:', error);
    next(error);
  }
});

// Get single board
router.get('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        placements: {
          include: {
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
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.json(board);
  } catch (error: any) {
    logger.error('Error fetching board:', error);
    next(error);
  }
});

// Create board
router.post('/', async (req: TenantRequest, res, next) => {
  try {
    const { brandId, boardType, dimensions, material, commissionRate } = req.body;

    // Validation
    if (!boardType || !dimensions || !material || commissionRate === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['boardType', 'dimensions', 'material', 'commissionRate']
      });
    }

    const board = await prisma.board.create({
      data: {
        brandId,
        boardType,
        dimensions,
        material,
        commissionRate,
        createdById: req.user!.id,
        isActive: true
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    logger.info(`Board created: ${board.id} by user ${req.user!.id}`);
    res.status(201).json(board);
  } catch (error: any) {
    logger.error('Error creating board:', error);
    next(error);
  }
});

// Update board
router.put('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const { brandId, boardType, dimensions, material, commissionRate, isActive } = req.body;

    const updateData: any = {};
    if (brandId !== undefined) updateData.brandId = brandId;
    if (boardType) updateData.boardType = boardType;
    if (dimensions) updateData.dimensions = dimensions;
    if (material) updateData.material = material;
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    if (isActive !== undefined) updateData.isActive = isActive;

    const board = await prisma.board.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    logger.info(`Board updated: ${id}`);
    res.json(board);
  } catch (error: any) {
    logger.error('Error updating board:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Board not found' });
    }
    next(error);
  }
});

// Delete board
router.delete('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    // Check if board has placements
    const placementCount = await prisma.boardPlacement.count({
      where: { boardId: id }
    });

    if (placementCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete board with existing placements',
        placementCount
      });
    }

    await prisma.board.delete({
      where: { id }
    });

    logger.info(`Board deleted: ${id}`);
    res.json({ message: 'Board deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting board:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Board not found' });
    }
    next(error);
  }
});

// Board Placement Routes

// Get all board placements
router.get('/placements', async (req: TenantRequest, res, next) => {
  try {
    const { boardId, customerId, agentId, status, page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (boardId) where.boardId = boardId;
    if (customerId) where.customerId = customerId;
    if (agentId) where.agentId = agentId;
    if (status) where.status = status;

    const [placements, total] = await Promise.all([
      prisma.boardPlacement.findMany({
        where,
        include: {
          board: true,
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
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.boardPlacement.count({ where })
    ]);

    res.json({
      placements,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    logger.error('Error fetching board placements:', error);
    next(error);
  }
});

// Get single board placement
router.get('/placements/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const placement = await prisma.boardPlacement.findUnique({
      where: { id },
      include: {
        board: true,
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

    if (!placement) {
      return res.status(404).json({ error: 'Board placement not found' });
    }

    res.json(placement);
  } catch (error: any) {
    logger.error('Error fetching board placement:', error);
    next(error);
  }
});

// Create board placement
router.post('/placements', async (req: TenantRequest, res, next) => {
  try {
    const {
      boardId,
      customerId,
      gpsLocation,
      placementPhoto,
      storefrontPhoto,
      notes
    } = req.body;

    // Validation
    if (!boardId || !customerId || !gpsLocation || !placementPhoto || !storefrontPhoto) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['boardId', 'customerId', 'gpsLocation', 'placementPhoto', 'storefrontPhoto']
      });
    }

    // Verify board exists
    const board = await prisma.board.findUnique({
      where: { id: boardId }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: req.tenantId
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get field agent if user has FIELD_AGENT role
    let fieldAgentId = null;
    if (req.user!.role === 'FIELD_AGENT') {
      const fieldAgent = await prisma.fieldAgent.findUnique({
        where: { userId: req.user!.id }
      });
      fieldAgentId = fieldAgent?.id || null;
    }

    const placement = await prisma.boardPlacement.create({
      data: {
        boardId,
        customerId,
        agentId: req.user!.id,
        fieldAgentId,
        gpsLocation,
        placementPhoto,
        storefrontPhoto,
        commission: board.commissionRate,
        status: 'ACTIVE',
        notes
      },
      include: {
        board: true,
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
    if (fieldAgentId) {
      await prisma.agentCommission.create({
        data: {
          agentId: req.user!.id,
          fieldAgentId,
          activityType: 'BOARD_PLACEMENT',
          activityId: placement.id,
          amount: board.commissionRate,
          calculationDetails: {
            boardType: board.boardType,
            commissionRate: board.commissionRate,
            customer: customer.name
          }
        }
      });
    }

    logger.info(`Board placement created: ${placement.id} by user ${req.user!.id}`);
    res.status(201).json(placement);
  } catch (error: any) {
    logger.error('Error creating board placement:', error);
    next(error);
  }
});

// Update board placement status
router.patch('/placements/:id/status', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['ACTIVE', 'REMOVED', 'DAMAGED', 'REPLACED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid placement status' });
    }

    const updateData: any = { status };
    if (notes !== undefined) updateData.notes = notes;

    const placement = await prisma.boardPlacement.update({
      where: { id },
      data: updateData,
      include: {
        board: true,
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

    logger.info(`Board placement status updated: ${id} to ${status}`);
    res.json(placement);
  } catch (error: any) {
    logger.error('Error updating board placement status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Board placement not found' });
    }
    next(error);
  }
});

// Delete board placement
router.delete('/placements/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    await prisma.boardPlacement.delete({
      where: { id }
    });

    logger.info(`Board placement deleted: ${id}`);
    res.json({ message: 'Board placement deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting board placement:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Board placement not found' });
    }
    next(error);
  }
});

// Board analytics
router.get('/analytics', async (req: TenantRequest, res, next) => {
  try {
    const { startDate, endDate, boardId, agentId } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.placementDate = {};
      if (startDate) where.placementDate.gte = new Date(startDate as string);
      if (endDate) where.placementDate.lte = new Date(endDate as string);
    }
    if (boardId) where.boardId = boardId;
    if (agentId) where.agentId = agentId;

    const placements = await prisma.boardPlacement.findMany({
      where,
      include: {
        board: true,
        customer: {
          select: { name: true, code: true }
        }
      }
    });

    const analytics = {
      totalPlacements: placements.length,
      totalCommission: placements.reduce((sum, p) => sum + parseFloat(p.commission.toString()), 0),
      statusBreakdown: {
        active: placements.filter(p => p.status === 'ACTIVE').length,
        removed: placements.filter(p => p.status === 'REMOVED').length,
        damaged: placements.filter(p => p.status === 'DAMAGED').length,
        replaced: placements.filter(p => p.status === 'REPLACED').length
      },
      boardTypeBreakdown: placements.reduce((acc: any, p) => {
        const type = p.board.boardType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      averageCoveragePercentage: placements
        .filter(p => p.coveragePercentage)
        .reduce((sum, p, _, arr) => sum + parseFloat(p.coveragePercentage!.toString()) / arr.length, 0),
      averageQualityScore: placements
        .filter(p => p.qualityScore)
        .reduce((sum, p, _, arr) => sum + parseFloat(p.qualityScore!.toString()) / arr.length, 0)
    };

    res.json(analytics);
  } catch (error: any) {
    logger.error('Error fetching board analytics:', error);
    next(error);
  }
});

export default router;