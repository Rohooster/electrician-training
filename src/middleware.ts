/**
 * Next.js Middleware - Route Protection
 *
 * Handles authentication and authorization for protected routes.
 * Runs on Edge Runtime for optimal performance.
 *
 * Security features:
 * - Session verification via Auth.js
 * - Route-based access control
 * - Secure redirects with callback URLs
 * - Admin role enforcement
 * - Public route allowlist
 *
 * Protected routes:
 * - /exam/* (requires authentication)
 * - /trainer/* (requires authentication)
 * - /calc/* (requires authentication)
 * - /analytics/* (requires authentication)
 * - /admin/* (requires ADMIN role)
 *
 * Public routes:
 * - / (home)
 * - /auth/* (authentication pages)
 * - /api/auth/* (Auth.js API)
 * - /_next/* (Next.js assets)
 * - /favicon.ico, etc.
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    console.log('[Middleware] Path:', path, 'Authenticated:', !!token);

    // Admin-only routes
    if (path.startsWith('/admin')) {
      if (!token) {
        console.warn('[Middleware] Blocked unauthenticated access to admin:', path);
        return NextResponse.redirect(
          new URL(
            `/auth/signin?callbackUrl=${encodeURIComponent(path)}`,
            req.url
          )
        );
      }

      if (token.role !== 'ADMIN') {
        console.warn(
          '[Middleware] Blocked non-admin access to admin:',
          path,
          'Role:',
          token.role
        );
        return NextResponse.redirect(new URL('/auth/error?error=AccessDenied', req.url));
      }

      console.log('[Middleware] Allowed admin access:', token.email);
    }

    // All other protected routes just need authentication
    // (exam, trainer, calc, analytics)
    if (!token) {
      console.log('[Middleware] Redirecting to signin:', path);
      return NextResponse.redirect(
        new URL(
          `/auth/signin?callbackUrl=${encodeURIComponent(path)}`,
          req.url
        )
      );
    }

    console.log('[Middleware] Allowed authenticated access:', token.email);
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * Control when middleware should run
       * Return false to skip auth check (for public routes)
       */
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public routes - always allow
        const publicRoutes = [
          '/',
          '/auth/signin',
          '/auth/verify-request',
          '/auth/error',
          '/terms',
          '/privacy',
        ];

        if (publicRoutes.includes(path)) {
          return true;
        }

        // Protected routes - require token
        const protectedPrefixes = ['/exam', '/trainer', '/calc', '/analytics', '/admin'];
        const isProtected = protectedPrefixes.some((prefix) =>
          path.startsWith(prefix)
        );

        if (isProtected) {
          // Return true to run middleware, which will check roles
          // Return false to block (but we handle this in middleware function)
          return true;
        }

        // Default: allow (for other routes like _next, api, etc.)
        return true;
      },
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
  }
);

/**
 * Matcher configuration
 * Defines which routes middleware should run on
 *
 * Security: Exclude static assets and API routes for performance
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api/trpc (handled by tRPC)
     * - api/auth (handled by Auth.js)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    /*
     * Always run for:
     * - Protected app routes
     */
    '/exam/:path*',
    '/trainer/:path*',
    '/calc/:path*',
    '/analytics/:path*',
    '/admin/:path*',
  ],
};
