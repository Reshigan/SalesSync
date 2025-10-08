import { TenantRequest } from '../middleware/tenant';
import express from 'express';
import { prisma } from '../database';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all SIM distributions
router.get('/sims', async (req: TenantRequest, res, next) => {
  try {
    const { userId, kycStatus, activationStatus, startDate, endDate } = req.query;
    
    const where: any = {
      user: {
        tenantId: req.tenantId
      }
    };

    if (userId) where.userId = userId;
    if (kycStatus) where.kycStatus = kycStatus;
    if (activationStatus) where.activationStatus = activationStatus;
    if (startDate || endDate) {
      where.distributionDate = {};
      if (startDate) where.distributionDate.gte = new Date(startDate as string);
      if (endDate) where.distributionDate.lte = new Date(endDate as string);
    }

    const sims = await prisma.simDistribution.findMany({
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
        }
      },
      orderBy: { distributionDate: 'desc' }
    });

    res.json(sims);
  } catch (error) {
    logger.error('Error fetching SIM distributions:', error);
    next(error);
  }
});

// Get single SIM distribution
router.get('/sims/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const sim = await prisma.simDistribution.findFirst({
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
        }
      }
    });

    if (!sim) {
      return res.status(404).json({ error: 'SIM distribution not found' });
    }

    res.json(sim);
  } catch (error) {
    logger.error('Error fetching SIM distribution:', error);
    next(error);
  }
});

// Create SIM distribution
router.post('/sims', async (req: TenantRequest, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      customerType,
      simNumber,
      activationCode,
      location,
      distributionDate,
      kycStatus,
      activationStatus,
      commission
    } = req.body;

    // Validation
    if (!customerName || !customerPhone || !simNumber || !activationCode) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['customerName', 'customerPhone', 'simNumber', 'activationCode']
      });
    }

    const sim = await prisma.simDistribution.create({
      data: {
        userId: req.user!.id,
        customerName,
        customerPhone,
        customerType: customerType || 'PREPAID',
        simNumber,
        activationCode,
        location: location || '',
        distributionDate: distributionDate ? new Date(distributionDate) : new Date(),
        kycStatus: kycStatus || 'PENDING',
        activationStatus: activationStatus || 'PENDING',
        commission: commission ? parseFloat(commission) : 0
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    logger.info(`SIM distribution created: ${sim.id} by user ${req.user!.id}`);
    res.status(201).json(sim);
  } catch (error) {
    logger.error('Error creating SIM distribution:', error);
    next(error);
  }
});

// Update SIM distribution
router.put('/sims/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhone,
      customerType,
      simNumber,
      activationCode,
      location,
      distributionDate,
      kycStatus,
      activationStatus,
      commission
    } = req.body;

    // Verify SIM distribution belongs to tenant
    const existingSim = await prisma.simDistribution.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingSim) {
      return res.status(404).json({ error: 'SIM distribution not found' });
    }

    const updateData: any = {};
    if (customerName) updateData.customerName = customerName;
    if (customerPhone) updateData.customerPhone = customerPhone;
    if (customerType) updateData.customerType = customerType;
    if (simNumber) updateData.simNumber = simNumber;
    if (activationCode) updateData.activationCode = activationCode;
    if (location !== undefined) updateData.location = location;
    if (distributionDate) updateData.distributionDate = new Date(distributionDate);
    if (kycStatus) updateData.kycStatus = kycStatus;
    if (activationStatus) updateData.activationStatus = activationStatus;
    if (commission !== undefined) updateData.commission = parseFloat(commission);

    const sim = await prisma.simDistribution.update({
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
        }
      }
    });

    logger.info(`SIM distribution updated: ${id}`);
    res.json(sim);
  } catch (error) {
    logger.error('Error updating SIM distribution:', error);
    next(error);
  }
});

// Update KYC status
router.patch('/sims/:id/kyc', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const { kycStatus } = req.body;

    if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(kycStatus)) {
      return res.status(400).json({ error: 'Invalid KYC status' });
    }

    const existingSim = await prisma.simDistribution.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingSim) {
      return res.status(404).json({ error: 'SIM distribution not found' });
    }

    const sim = await prisma.simDistribution.update({
      where: { id },
      data: { kycStatus },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    logger.info(`SIM distribution KYC status updated: ${id} to ${kycStatus}`);
    res.json(sim);
  } catch (error) {
    logger.error('Error updating KYC status:', error);
    next(error);
  }
});

// Update activation status
router.patch('/sims/:id/activation', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;
    const { activationStatus } = req.body;

    if (!['PENDING', 'ACTIVATED', 'FAILED'].includes(activationStatus)) {
      return res.status(400).json({ error: 'Invalid activation status' });
    }

    const existingSim = await prisma.simDistribution.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingSim) {
      return res.status(404).json({ error: 'SIM distribution not found' });
    }

    const sim = await prisma.simDistribution.update({
      where: { id },
      data: { activationStatus },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    logger.info(`SIM distribution activation status updated: ${id} to ${activationStatus}`);
    res.json(sim);
  } catch (error) {
    logger.error('Error updating activation status:', error);
    next(error);
  }
});

// Delete SIM distribution
router.delete('/sims/:id', async (req: TenantRequest, res, next) => {
  try {
    const { id } = req.params;

    const existingSim = await prisma.simDistribution.findFirst({
      where: {
        id,
        user: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingSim) {
      return res.status(404).json({ error: 'SIM distribution not found' });
    }

    await prisma.simDistribution.delete({
      where: { id }
    });

    logger.info(`SIM distribution deleted: ${id}`);
    res.json({ message: 'SIM distribution deleted successfully' });
  } catch (error) {
    logger.error('Error deleting SIM distribution:', error);
    next(error);
  }
});

// Get SIM distribution analytics
router.get('/analytics', async (req: TenantRequest, res, next) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const where: any = {
      user: {
        tenantId: req.tenantId
      }
    };

    if (startDate || endDate) {
      where.distributionDate = {};
      if (startDate) where.distributionDate.gte = new Date(startDate as string);
      if (endDate) where.distributionDate.lte = new Date(endDate as string);
    }

    if (userId) where.userId = userId;

    const sims = await prisma.simDistribution.findMany({ where });

    const analytics = {
      totalDistributions: sims.length,
      totalCommission: sims.reduce((sum: number, s: any) => sum + parseFloat(s.commission.toString()), 0),
      kycBreakdown: {
        pending: sims.filter((s: any) => s.kycStatus === 'PENDING').length,
        verified: sims.filter((s: any) => s.kycStatus === 'VERIFIED').length,
        rejected: sims.filter((s: any) => s.kycStatus === 'REJECTED').length
      },
      activationBreakdown: {
        pending: sims.filter((s: any) => s.activationStatus === 'PENDING').length,
        activated: sims.filter((s: any) => s.activationStatus === 'ACTIVATED').length,
        failed: sims.filter((s: any) => s.activationStatus === 'FAILED').length
      }
    };

    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching SIM distribution analytics:', error);
    next(error);
  }
});

export default router;
