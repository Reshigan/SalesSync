import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database';
import { logger } from '../utils/logger';
import { validateLogin, validateRegister } from '../utils/validation';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error?.details?.[0]?.message || "Validation failed"
      });
    }

    const { email, password } = value;

    // Find user with tenant info
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Account is not active'
      });
    }

    if (!user.tenant.isActive) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Tenant account is not active'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT tokens
    const accessToken = (jwt.sign as any)(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = (jwt.sign as any)(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    logger.info(`User logged in: ${user.email}`);

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        tenant: user.tenant
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
});

// Register (for demo purposes - in production, this would be admin-only)
router.post('/register', async (req, res) => {
  try {
    const { error, value } = validateRegister(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error?.details?.[0]?.message || "Validation failed"
      });
    }

    const { email, password, firstName, lastName, role, tenantSlug } = value;

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

    // Find or create tenant
    let tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1),
          slug: tenantSlug,
          isActive: true
        }
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
        role: role || 'VAN_SALES_AGENT',
        tenantId: tenant.id,
        status: 'ACTIVE'
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    });

    logger.info(`User registered: ${user.email}`);

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenant: user.tenant
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration failed'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    });

    if (!user || user.status !== 'ACTIVE' || !user.tenant.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const accessToken = (jwt.sign as any)(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      message: 'Token refreshed successfully',
      accessToken
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid refresh token'
      });
    }

    logger.error('Token refresh error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Token refresh failed'
    });
  }
});

// Logout (optional - for token blacklisting in production)
router.post('/logout', (req, res) => {
  // In a production environment, you might want to blacklist the token
  return res.json({
    message: 'Logout successful'
  });
});

export default router;