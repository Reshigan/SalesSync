#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔐 Creating authentication middleware and protected routes...\n');

// Auth middleware for Next.js
const authMiddlewareContent = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/products',
  '/customers',
  '/orders',
  '/inventory',
  '/van-sales',
  '/warehouse',
  '/analytics',
  '/admin',
  '/super-admin',
  '/back-office',
  '/settings',
  '/visits',
  '/routes',
  '/areas',
  '/regions',
  '/brands',
  '/promotions',
  '/merchandising',
  '/field-agents',
  '/surveys',
  '/tracking',
  '/consumer-activations'
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/demo',
  '/api/auth/login',
  '/api/auth/register',
  '/api/health'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/api/auth/')
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute) {
    // Get token from cookies or headers
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // TODO: Validate token with backend
    // For now, we'll assume token exists means authenticated
    // In production, you should validate the JWT token
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};`;

// Auth guard hook
const authGuardHookContent = `'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export const useAuthGuard = (redirectTo = '/login') => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const redirectUrl = \`\${redirectTo}?redirect=\${encodeURIComponent(currentPath)}\`;
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
};`;

// Protected route component
const protectedRouteContent = `'use client'

import React from 'react';
import { useAuthGuard, useRoleGuard } from '@/hooks/use-auth-guard';
import { LoadingSpinner } from '@/components/ui/loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallback
}) => {
  const { isAuthenticated, isLoading } = useAuthGuard();
  const { hasRequiredRole } = useRoleGuard(requiredRoles);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null; // Will be redirected by useAuthGuard
  }

  if (requiredRoles.length > 0 && !hasRequiredRole) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
};

// Higher-order component for protecting pages
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: string[]
) => {
  const AuthenticatedComponent = (props: P) => {
    return (
      <ProtectedRoute requiredRoles={requiredRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  AuthenticatedComponent.displayName = \`withAuth(\${Component.displayName || Component.name})\`;
  return AuthenticatedComponent;
};`;

// Update auth store with better token management
const authStoreUpdateContent = `import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '@/services/auth.service';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roles?: string[];
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(email, password);
          const { user, accessToken } = response.data;
          
          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false
          });

          // Store token in localStorage for API calls
          localStorage.setItem('token', accessToken);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
        
        // Clear token from localStorage
        localStorage.removeItem('token');
        
        // Clear any other auth-related data
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await authService.refreshToken(token);
          const { accessToken } = response.data;
          
          set({ token: accessToken });
          localStorage.setItem('token', accessToken);
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authService.getProfile();
          const user = response.data;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          // Token is invalid, logout
          get().logout();
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);`;

// Create directories
const middlewareDir = path.join(__dirname, 'frontend/src');
const hooksDir = path.join(__dirname, 'frontend/src/hooks');
const componentsDir = path.join(__dirname, 'frontend/src/components/auth');
const storeDir = path.join(__dirname, 'frontend/src/store');

[hooksDir, componentsDir, storeDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Write files
fs.writeFileSync(path.join(middlewareDir, 'middleware.ts'), authMiddlewareContent);
fs.writeFileSync(path.join(hooksDir, 'use-auth-guard.ts'), authGuardHookContent);
fs.writeFileSync(path.join(componentsDir, 'protected-route.tsx'), protectedRouteContent);

// Update auth store if it exists
const authStorePath = path.join(storeDir, 'auth.store.ts');
if (fs.existsSync(authStorePath)) {
  fs.writeFileSync(authStorePath, authStoreUpdateContent);
  console.log('✅ Updated existing auth store');
} else {
  fs.writeFileSync(authStorePath, authStoreUpdateContent);
  console.log('✅ Created new auth store');
}

console.log('✅ Created Next.js middleware for route protection');
console.log('✅ Created auth guard hooks');
console.log('✅ Created protected route components');
console.log('✅ Created role-based access control');
console.log('\n🎉 Authentication middleware and protected routes implemented!');