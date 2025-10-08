import { TenantRequest } from '../middleware/tenant';
import express from 'express';
import { prisma } from '../database';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all merchandising visits
router.get('/visits', async (req: TenantRequest, res, next) => {
  try {
    const { storeId, userId, status, startDate, endDate } = req.query;
    
    const where: any = {
      store: {
        tenantId: req.tenantId
      }
    };

    if (storeId) where.storeId = storeId;
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.visitDate = {};
      if (startDate) where.visitDate.gte = new Date(startDate as string);
      if (endDate) where.visitDate.lte = new Date(endDate as string);
    }

    const visits = await prisma.merchandisingVisit.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true
          }
        }
      },
      orderBy: { visitDate: 'desc' }
    });

    res.json(visits);
  } catch (error) {
    logger.error('Error fetching merchandising visits:', error);
    next(error);
  }
});

// Get single merchandising visit
router.get('/visits/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const visit = await prisma.merchandisingVisit.findFirst({
      where: {
        id,
        store: {
          tenantId: req.tenantId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true
          }
        }
      }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Merchandising visit not found' });
    }

    res.json(visit);
  } catch (error) {
    logger.error('Error fetching merchandising visit:', error);
    next(error);
  }
});

// Create merchandising visit
router.post('/visits', async (req: TenantRequest, res, next) => {
  try {
    const {
      storeId,
      visitDate,
      shelfShare,
      facingsCount,
      complianceScore,
      issuesFound,
      photos,
      notes,
      status,
      aiScore
    } = req.body;

    // Verify store belongs to tenant
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        tenantId: req.tenantId
      }
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const visit = await prisma.merchandisingVisit.create({
      data: {
        storeId,
        userId: req.user!.id,
        visitDate: new Date(visitDate),
        shelfShare: shelfShare ? parseFloat(shelfShare) : null,
        facingsCount: facingsCount ? parseInt(facingsCount) : null,
        complianceScore: complianceScore ? parseFloat(complianceScore) : null,
        issuesFound,
        photos,
        notes,
        status: status || 'COMPLETED',
        aiScore: aiScore ? parseFloat(aiScore) : null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    logger.info(`Merchandising visit created: ${visit.id} by user ${req.user!.id}`);
    res.status(201).json(visit);
  } catch (error) {
    logger.error('Error creating merchandising visit:', error);
    next(error);
  }
});

// Update merchandising visit
router.put('/visits/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const {
      visitDate,
      shelfShare,
      facingsCount,
      complianceScore,
      issuesFound,
      photos,
      notes,
      status,
      aiScore
    } = req.body;

    // Verify visit belongs to tenant
    const existingVisit = await prisma.merchandisingVisit.findFirst({
      where: {
        id,
        store: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingVisit) {
      return res.status(404).json({ error: 'Merchandising visit not found' });
    }

    const updateData: any = {};
    if (visitDate) updateData.visitDate = new Date(visitDate);
    if (shelfShare !== undefined) updateData.shelfShare = parseFloat(shelfShare);
    if (facingsCount !== undefined) updateData.facingsCount = parseInt(facingsCount);
    if (complianceScore !== undefined) updateData.complianceScore = parseFloat(complianceScore);
    if (issuesFound !== undefined) updateData.issuesFound = issuesFound;
    if (photos !== undefined) updateData.photos = photos;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    if (aiScore !== undefined) updateData.aiScore = parseFloat(aiScore);

    const visit = await prisma.merchandisingVisit.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    logger.info(`Merchandising visit updated: ${id}`);
    res.json(visit);
  } catch (error) {
    logger.error('Error updating merchandising visit:', error);
    next(error);
  }
});

// Update visit status (approve/reject)
router.patch('/visits/:id/status', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['COMPLETED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existingVisit = await prisma.merchandisingVisit.findFirst({
      where: {
        id,
        store: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingVisit) {
      return res.status(404).json({ error: 'Merchandising visit not found' });
    }

    const visit = await prisma.merchandisingVisit.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    logger.info(`Merchandising visit status updated: ${id} to ${status}`);
    res.json(visit);
  } catch (error) {
    logger.error('Error updating visit status:', error);
    next(error);
  }
});

// Delete merchandising visit
router.delete('/visits/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const existingVisit = await prisma.merchandisingVisit.findFirst({
      where: {
        id,
        store: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingVisit) {
      return res.status(404).json({ error: 'Merchandising visit not found' });
    }

    await prisma.merchandisingVisit.delete({
      where: { id }
    });

    logger.info(`Merchandising visit deleted: ${id}`);
    res.json({ message: 'Merchandising visit deleted successfully' });
  } catch (error) {
    logger.error('Error deleting merchandising visit:', error);
    next(error);
  }
});

// Get merchandising analytics
router.get('/analytics', async (req: TenantRequest, res, next) => {
  try {
    const { startDate, endDate, storeId } = req.query;

    const where: any = {
      store: {
        tenantId: req.tenantId
      }
    };

    if (startDate || endDate) {
      where.visitDate = {};
      if (startDate) where.visitDate.gte = new Date(startDate as string);
      if (endDate) where.visitDate.lte = new Date(endDate as string);
    }

    if (storeId) where.storeId = storeId;

    const visits = await prisma.merchandisingVisit.findMany({ where });

    const analytics = {
      totalVisits: visits.length,
      averageShelfShare: visits.reduce((sum: number, v: any) => sum + (v.shelfShare ? parseFloat(v.shelfShare.toString()) : 0), 0) / visits.length || 0,
      averageComplianceScore: visits.reduce((sum: number, v: any) => sum + (v.complianceScore ? parseFloat(v.complianceScore.toString()) : 0), 0) / visits.length || 0,
      averageAiScore: visits.reduce((sum: number, v: any) => sum + (v.aiScore ? parseFloat(v.aiScore.toString()) : 0), 0) / visits.length || 0,
      statusBreakdown: {
        completed: visits.filter((v: any) => v.status === 'COMPLETED').length,
        pendingReview: visits.filter((v: any) => v.status === 'PENDING_REVIEW').length,
        approved: visits.filter((v: any) => v.status === 'APPROVED').length,
        rejected: visits.filter((v: any) => v.status === 'REJECTED').length
      }
    };

    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching merchandising analytics:', error);
    next(error);
  }
});

export default router;
