import { TenantRequest } from '../middleware/tenant';
import express from 'express';
import { prisma } from '../database';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all promoter activities
router.get('/activities', async (req: TenantRequest, res, next) => {
  try {
    const { userId, campaignId, activityType, status, startDate, endDate } = req.query;
    
    const where: any = {
      user: {
        tenantId: req.tenantId
      }
    };

    if (userId) where.userId = userId;
    if (campaignId) where.campaignId = campaignId;
    if (activityType) where.activityType = activityType;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }

    const activities = await prisma.promoterActivity.findMany({
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
        campaign: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    res.json(activities);
  } catch (error) {
    logger.error('Error fetching promoter activities:', error);
    next(error);
  }
});

// Get single promoter activity
router.get('/activities/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const activity = await prisma.promoterActivity.findFirst({
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
            email: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        campaign: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            description: true
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Promoter activity not found' });
    }

    res.json(activity);
  } catch (error) {
    logger.error('Error fetching promoter activity:', error);
    next(error);
  }
});

// Get activities by campaign
router.get('/campaigns/:campaignId/activities', async (req: TenantRequest, res, next) => {
  try {
    const { campaignId } = req.params;
    const { userId, status } = req.query;

    const where: any = {
      campaignId,
      campaign: {
        tenantId: req.tenantId
      }
    };

    if (userId) where.userId = userId;
    if (status) where.status = status;

    const activities = await prisma.promoterActivity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    res.json(activities);
  } catch (error) {
    logger.error('Error fetching campaign activities:', error);
    next(error);
  }
});

// Create promoter activity
router.post('/activities', async (req: TenantRequest, res, next) => {
  try {
    const {
      campaignId,
      activityType,
      location,
      startTime,
      endTime,
      samplesDistributed,
      contactsMade,
      surveysCompleted,
      photos,
      notes,
      status,
      verificationScore
    } = req.body;

    // Validation
    if (!activityType || !location || !startTime) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['activityType', 'location', 'startTime']
      });
    }

    // Verify campaign belongs to tenant (if provided)
    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: {
          id: campaignId,
          tenantId: req.tenantId
        }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
    }

    const activity = await prisma.promoterActivity.create({
      data: {
        userId: req.user!.id,
        campaignId: campaignId || null,
        activityType,
        location,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        samplesDistributed: samplesDistributed ? parseInt(samplesDistributed) : 0,
        contactsMade: contactsMade ? parseInt(contactsMade) : 0,
        surveysCompleted: surveysCompleted ? parseInt(surveysCompleted) : 0,
        photos: photos || [],
        notes,
        status: status || 'PENDING',
        verificationScore: verificationScore ? parseFloat(verificationScore) : null
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
        campaign: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    logger.info(`Promoter activity created: ${activity.id} by user ${req.user!.id}`);
    res.status(201).json(activity);
  } catch (error) {
    logger.error('Error creating promoter activity:', error);
    next(error);
  }
});

// Update promoter activity
router.put('/activities/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const {
      campaignId,
      activityType,
      location,
      startTime,
      endTime,
      samplesDistributed,
      contactsMade,
      surveysCompleted,
      photos,
      notes,
      status,
      verificationScore
    } = req.body;

    // Verify activity belongs to tenant
    const existingActivity = await prisma.promoterActivity.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingActivity) {
      return res.status(404).json({ error: 'Promoter activity not found' });
    }

    // Verify campaign belongs to tenant (if provided)
    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: {
          id: campaignId,
          tenantId: req.tenantId
        }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
    }

    const updateData: any = {};
    if (campaignId !== undefined) updateData.campaignId = campaignId;
    if (activityType) updateData.activityType = activityType;
    if (location) updateData.location = location;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;
    if (samplesDistributed !== undefined) updateData.samplesDistributed = parseInt(samplesDistributed);
    if (contactsMade !== undefined) updateData.contactsMade = parseInt(contactsMade);
    if (surveysCompleted !== undefined) updateData.surveysCompleted = parseInt(surveysCompleted);
    if (photos !== undefined) updateData.photos = photos;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    if (verificationScore !== undefined) updateData.verificationScore = verificationScore ? parseFloat(verificationScore) : null;

    const activity = await prisma.promoterActivity.update({
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
        campaign: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    logger.info(`Promoter activity updated: ${id}`);
    res.json(activity);
  } catch (error) {
    logger.error('Error updating promoter activity:', error);
    next(error);
  }
});

// Verify activity
router.patch('/activities/:id/verify', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const { verificationScore, status } = req.body;

    const existingActivity = await prisma.promoterActivity.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingActivity) {
      return res.status(404).json({ error: 'Promoter activity not found' });
    }

    const updateData: any = {};
    if (verificationScore !== undefined) updateData.verificationScore = parseFloat(verificationScore);
    if (status) updateData.status = status;

    const activity = await prisma.promoterActivity.update({
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
        campaign: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    logger.info(`Promoter activity verified: ${id}, score: ${verificationScore}`);
    res.json(activity);
  } catch (error) {
    logger.error('Error verifying activity:', error);
    next(error);
  }
});

// Delete promoter activity
router.delete('/activities/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const existingActivity = await prisma.promoterActivity.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingActivity) {
      return res.status(404).json({ error: 'Promoter activity not found' });
    }

    await prisma.promoterActivity.delete({
      where: { id }
    });

    logger.info(`Promoter activity deleted: ${id}`);
    res.json({ message: 'Promoter activity deleted successfully' });
  } catch (error) {
    logger.error('Error deleting promoter activity:', error);
    next(error);
  }
});

// Get promoter analytics
router.get('/analytics', async (req: TenantRequest, res, next) => {
  try {
    const { startDate, endDate, userId, campaignId } = req.query;

    const where: any = {
      user: {
        tenantId: req.tenantId
      }
    };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }

    if (userId) where.userId = userId;
    if (campaignId) where.campaignId = campaignId;

    const activities = await prisma.promoterActivity.findMany({ where });

    const analytics = {
      totalActivities: activities.length,
      totalSamplesDistributed: activities.reduce((sum: number, a: any) => sum + a.samplesDistributed, 0),
      totalContactsMade: activities.reduce((sum: number, a: any) => sum + a.contactsMade, 0),
      totalSurveysCompleted: activities.reduce((sum: number, a: any) => sum + a.surveysCompleted, 0),
      averageVerificationScore: activities.filter((a: any) => a.verificationScore !== null)
        .reduce((sum: number, a: any) => sum + parseFloat(a.verificationScore!.toString()), 0) / 
        activities.filter((a: any) => a.verificationScore !== null).length || 0,
      activityTypeBreakdown: {
        sampling: activities.filter((a: any) => a.activityType === 'SAMPLING').length,
        demonstration: activities.filter((a: any) => a.activityType === 'DEMONSTRATION').length,
        survey: activities.filter((a: any) => a.activityType === 'SURVEY').length,
        brandAwareness: activities.filter((a: any) => a.activityType === 'BRAND_AWARENESS').length,
        productLaunch: activities.filter((a: any) => a.activityType === 'PRODUCT_LAUNCH').length,
        event: activities.filter((a: any) => a.activityType === 'EVENT').length,
        other: activities.filter((a: any) => a.activityType === 'OTHER').length
      },
      statusBreakdown: {
        completed: activities.filter((a: any) => a.status === 'APPROVED').length,
        pendingReview: activities.filter((a: any) => a.status === 'PENDING_REVIEW').length,
        approved: activities.filter((a: any) => a.status === 'APPROVED').length,
        rejected: activities.filter((a: any) => a.status === 'REJECTED').length
      }
    };

    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching promoter analytics:', error);
    next(error);
  }
});

export default router;
