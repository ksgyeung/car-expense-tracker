import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js middleware to protect routes with authentication
 * 
 * This middleware:
 * - Checks for JWT token cookie presence on protected routes
 * - Redirects unauthenticated users to login page
 * - Allows access to login page and API auth endpoints without authentication
 * 
 * Note: This middleware runs on Edge Runtime and only checks for cookie presence.
 * Actual JWT token validation happens in API routes using Node.js runtime.
 * 
 * Requirements: 1.1, 1.5
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow access to login page and auth API endpoints without authentication
  const publicPaths = ['/login', '/api/auth'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Check for JWT token cookie
  const sessionId = request.cookies.get('sessionId')?.value;
  
  if (!sessionId) {
    // No JWT token cookie, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // JWT token cookie exists, allow access
  // Note: Actual JWT validation will happen in API routes
  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 * 
 * This matcher ensures the middleware runs on:
 * - All routes except static files, images, and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
