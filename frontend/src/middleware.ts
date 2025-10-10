import { NextResponse } from 'next/server';
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
};