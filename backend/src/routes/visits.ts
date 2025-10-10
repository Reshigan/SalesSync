import { TenantRequest } from '../middleware/tenant';
import express from 'express';
import { prisma } from '../database';
import { logger } from '../utils/logger';

const router = express.Router();

// Visit Management Routes

// Get all visit lists
router.get('/', async (req: TenantRequest, res, next) => {
  try {
    const { customerId, agentId, status, page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (agentId) where.agentId = agentId;
    if (status) where.status = status;

    const [visits, total] = await Promise.all([
      prisma.visitList.findMany({
        where,
        include: {
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
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.visitList.count({ where })
    ]);

    res.json({
      visits,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    logger.error('Error fetching visit lists:', error);
    next(error);
  }
});

// Get single visit list
router.get('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const visit = await prisma.visitList.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            coordinates: true,
            phone: true
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

    if (!visit) {
      return res.status(404).json({ error: 'Visit list not found' });
    }

    res.json(visit);
  } catch (error: any) {
    logger.error('Error fetching visit list:', error);
    next(error);
  }
});

// Create visit list
router.post('/', async (req: TenantRequest, res, next) => {
  try {
    const {
      customerId,
      brands,
      activities,
      surveys,
      notes
    } = req.body;

    // Validation
    if (!customerId || !brands || !activities) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['customerId', 'brands', 'activities']
      });
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

    const visit = await prisma.visitList.create({
      data: {
        customerId,
        agentId: req.user!.id,
        fieldAgentId,
        brands,
        activities,
        surveys: surveys || [],
        status: 'PENDING',
        notes
      },
      include: {
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
            lastName: true
          }
        }
      }
    });

    logger.info(`Visit list created: ${visit.id} by user ${req.user!.id}`);
    res.status(201).json(visit);
  } catch (error: any) {
    logger.error('Error creating visit list:', error);
    next(error);
  }
});

// Start visit
router.patch('/:id/start', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const visit = await prisma.visitList.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startTime: new Date()
      },
      include: {
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
            lastName: true
          }
        }
      }
    });

    logger.info(`Visit started: ${id}`);
    res.json(visit);
  } catch (error: any) {
    logger.error('Error starting visit:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Visit list not found' });
    }
    next(error);
  }
});

// Complete visit
router.patch('/:id/complete', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const { completedActivities, completedSurveys, notes } = req.body;

    const updateData: any = {
      status: 'COMPLETED',
      endTime: new Date()
    };

    if (completedActivities) updateData.activities = completedActivities;
    if (completedSurveys) updateData.surveys = completedSurveys;
    if (notes !== undefined) updateData.notes = notes;

    const visit = await prisma.visitList.update({
      where: { id },
      data: updateData,
      include: {
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
            lastName: true
          }
        },
        fieldAgent: {
          select: {
            id: true,
            agentCode: true,
            commissionRate: true
          }
        }
      }
    });

    // Create commission record for visit completion if field agent
    if (visit.fieldAgent && parseFloat(visit.fieldAgent.commissionRate.toString()) > 0) {
      const commissionAmount = parseFloat(visit.fieldAgent.commissionRate.toString()) * 0.1; // 10% of base rate for visit completion
      
      await prisma.agentCommission.create({
        data: {
          agentId: req.user!.id,
          fieldAgentId: visit.fieldAgent.id,
          activityType: 'VISIT_COMPLETION',
          activityId: visit.id,
          amount: commissionAmount,
          calculationDetails: {
            customerName: visit.customer.name,
            visitDuration: visit.startTime && visit.endTime 
              ? Math.round((visit.endTime.getTime() - visit.startTime.getTime()) / 60000) // minutes
              : 0,
            activitiesCompleted: Array.isArray(completedActivities) ? completedActivities.length : 0,
            surveysCompleted: Array.isArray(completedSurveys) ? completedSurveys.length : 0
          }
        }
      });
    }

    logger.info(`Visit completed: ${id}`);
    res.json(visit);
  } catch (error: any) {
    logger.error('Error completing visit:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Visit list not found' });
    }
    next(error);
  }
});

// Update visit status
router.patch('/:id/status', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid visit status' });
    }

    const updateData: any = { status };
    if (notes !== undefined) updateData.notes = notes;

    const visit = await prisma.visitList.update({
      where: { id },
      data: updateData,
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
      }
    });

    logger.info(`Visit status updated: ${id} to ${status}`);
    res.json(visit);
  } catch (error: any) {
    logger.error('Error updating visit status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Visit list not found' });
    }
    next(error);
  }
});

// Delete visit list
router.delete('/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    await prisma.visitList.delete({
      where: { id }
    });

    logger.info(`Visit list deleted: ${id}`);
    res.json({ message: 'Visit list deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting visit list:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Visit list not found' });
    }
    next(error);
  }
});

// Get visit analytics
router.get('/analytics', async (req: TenantRequest, res, next) => {
  try {
    const { startDate, endDate, agentId, customerId } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    if (agentId) where.agentId = agentId;
    if (customerId) where.customerId = customerId;

    const visits = await prisma.visitList.findMany({
      where,
      include: {
        customer: {
          select: { name: true, code: true }
        }
      }
    });

    const completedVisits = visits.filter(v => v.status === 'COMPLETED' && v.startTime && v.endTime);
    const totalDuration = completedVisits.reduce((sum, v) => {
      if (v.startTime && v.endTime) {
        return sum + (v.endTime.getTime() - v.startTime.getTime());
      }
      return sum;
    }, 0);

    const analytics = {
      totalVisits: visits.length,
      statusBreakdown: {
        pending: visits.filter(v => v.status === 'PENDING').length,
        inProgress: visits.filter(v => v.status === 'IN_PROGRESS').length,
        completed: visits.filter(v => v.status === 'COMPLETED').length,
        pendingReview: visits.filter(v => v.status === 'PENDING_REVIEW').length,
        approved: visits.filter(v => v.status === 'APPROVED').length,
        rejected: visits.filter(v => v.status === 'REJECTED').length
      },
      averageVisitDuration: completedVisits.length > 0 
        ? Math.round(totalDuration / completedVisits.length / 60000) // minutes
        : 0,
      totalActivities: visits.reduce((sum, v) => {
        return sum + (Array.isArray(v.activities) ? v.activities.length : 0);
      }, 0),
      totalSurveys: visits.reduce((sum, v) => {
        return sum + (Array.isArray(v.surveys) ? v.surveys.length : 0);
      }, 0),
      customerBreakdown: visits.reduce((acc: any, v) => {
        const customerName = v.customer.name;
        acc[customerName] = (acc[customerName] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(analytics);
  } catch (error: any) {
    logger.error('Error fetching visit analytics:', error);
    next(error);
  }
});

// Get visit templates/activities
router.get('/templates', async (req: TenantRequest, res, next) => {
  try {
    // This would typically come from a configuration table
    // For now, returning static templates
    const templates = {
      activities: [
        {
          id: 'board_placement',
          name: 'Board Placement',
          description: 'Place promotional board at customer location',
          required: false,
          fields: [
            { name: 'boardType', type: 'select', required: true },
            { name: 'location', type: 'text', required: true },
            { name: 'photo', type: 'file', required: true }
          ]
        },
        {
          id: 'product_distribution',
          name: 'Product Distribution',
          description: 'Distribute products to customers',
          required: false,
          fields: [
            { name: 'productId', type: 'select', required: true },
            { name: 'quantity', type: 'number', required: true },
            { name: 'recipientName', type: 'text', required: true },
            { name: 'signature', type: 'signature', required: true }
          ]
        },
        {
          id: 'survey',
          name: 'Customer Survey',
          description: 'Conduct customer satisfaction survey',
          required: false,
          fields: [
            { name: 'surveyId', type: 'select', required: true },
            { name: 'responses', type: 'json', required: true }
          ]
        },
        {
          id: 'inventory_check',
          name: 'Inventory Check',
          description: 'Check customer inventory levels',
          required: false,
          fields: [
            { name: 'products', type: 'json', required: true },
            { name: 'notes', type: 'textarea', required: false }
          ]
        }
      ],
      surveys: [
        {
          id: 'customer_satisfaction',
          name: 'Customer Satisfaction Survey',
          description: 'General customer satisfaction survey',
          questions: [
            {
              id: 'satisfaction_rating',
              text: 'How satisfied are you with our products?',
              type: 'rating',
              scale: 5,
              required: true
            },
            {
              id: 'recommendation',
              text: 'Would you recommend our products to others?',
              type: 'yes_no',
              required: true
            },
            {
              id: 'feedback',
              text: 'Any additional feedback?',
              type: 'text',
              required: false
            }
          ]
        }
      ]
    };

    res.json(templates);
  } catch (error: any) {
    logger.error('Error fetching visit templates:', error);
    next(error);
  }
});

export default router;