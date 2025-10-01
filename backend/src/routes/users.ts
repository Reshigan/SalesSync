import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../database';
import { TenantRequest } from '../middleware/tenant';
import { requireTenantAdmin } from '../middleware/auth';
import { validateCreateUser, validateUpdateUser } from '../utils/validation';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all users for tenant
router.get('/', async (req: TenantRequest, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      tenantId: req.tenantId
    };

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          avatar: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch users'
    });
  }
});

// Get user by ID
router.get('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        settings: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    return res.json({ user });
  } catch (error) {
    logger.error('Get user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user'
    });
  }
});

// Create user (admin only)
router.post('/', requireTenantAdmin, async (req: TenantRequest, res) => {
  try {
    const { error, value } = validateCreateUser(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error?.details?.[0]?.message || "Validation failed"
      });
    }

    const { email, firstName, lastName, phone, role, password } = value;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role,
        tenantId: req.tenantId!,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    logger.info(`User created: ${user.email} by ${req.user?.email}`);

    return res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    logger.error('Create user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create user'
    });
  }
});

// Update user
router.put('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validateUpdateUser(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error?.details?.[0]?.message || "Validation failed"
      });
    }

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Only allow users to update their own profile, or admins to update any user
    if (req.user?.id !== id && !['SUPER_ADMIN', 'TENANT_ADMIN'].includes(req.user?.role!)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own profile'
      });
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: value,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });

    logger.info(`User updated: ${user.email} by ${req.user?.email}`);

    return res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    logger.error('Update user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user'
    });
  }
});

// Delete user (admin only)
router.delete('/:id', requireTenantAdmin, async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Prevent self-deletion
    if (req.user?.id === id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete by setting status to INACTIVE
    await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });

    logger.info(`User deleted: ${existingUser.email} by ${req.user?.email}`);

    return res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete user'
    });
  }
});

// Get user statistics
router.get('/stats/overview', async (req: TenantRequest, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      usersByRole
    ] = await Promise.all([
      prisma.user.count({
        where: { tenantId: req.tenantId }
      }),
      prisma.user.count({
        where: { tenantId: req.tenantId, status: 'ACTIVE' }
      }),
      prisma.user.count({
        where: { tenantId: req.tenantId, status: 'INACTIVE' }
      }),
      prisma.user.count({
        where: { tenantId: req.tenantId, status: 'SUSPENDED' }
      }),
      prisma.user.groupBy({
        by: ['role'],
        where: { tenantId: req.tenantId },
        _count: { role: true }
      })
    ]);

    const roleStats = usersByRole.reduce((acc: Record<string, number>, item: any) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {} as Record<string, number>);

    return res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      roleStats
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user statistics'
    });
  }
});

export default router;