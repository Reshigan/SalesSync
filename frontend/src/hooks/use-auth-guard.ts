'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export const useAuthGuard = (redirectTo = '/login') => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading, user };
};

// Role-based access control hook
export const useRoleGuard = (requiredRoles: string[] = []) => {
  const { user, isAuthenticated } = useAuthStore();
  
  const hasRequiredRole = () => {
    if (!isAuthenticated || !user) return false;
    if (requiredRoles.length === 0) return true;
    
    return requiredRoles.some(role => 
      user.roles?.includes(role) || user.role === role
    );
  };

  const hasPermission = (permission: string) => {
    if (!isAuthenticated || !user) return false;
    return user.permissions?.includes(permission) || false;
  };

  return {
    hasRequiredRole: hasRequiredRole(),
    hasPermission,
    userRole: user?.role,
    userRoles: user?.roles || []
  };
};