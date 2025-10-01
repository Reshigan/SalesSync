import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export interface TenantRequest extends AuthenticatedRequest {
  tenantId?: string;
}

export const tenantMiddleware = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Add tenant ID to request for easy access
  req.tenantId = req.user.tenantId;
  
  return next();
};