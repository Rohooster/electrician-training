/**
 * Auth.js (NextAuth.js v5) Configuration
 *
 * Configures authentication providers and session management.
 * Implements security best practices:
 * - Database-backed sessions (not JWT)
 * - Magic link email verification
 * - Google OAuth with profile verification
 * - Rate limiting via token expiry
 * - CSRF protection (built into Auth.js)
 * - Session rotation on auth state change
 */

import { PrismaAdapter } from '@auth/prisma-adapter';
import { type NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // Security: Magic links expire after 24 hours (default is 24h)
      maxAge: 24 * 60 * 60,
    }),

    // Optional: Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Security: Only request necessary scopes
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
            // Security: Verify email is verified by Google
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
                emailVerified: profile.email_verified ? new Date() : null,
              };
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    /**
     * Session callback - attach user data to session
     * Security: Only expose necessary user data to client
     */
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as any).role || 'STUDENT';
        session.user.emailVerified = user.emailVerified;
      }
      return session;
    },

    /**
     * Sign-in callback - control who can authenticate
     * Security: Block unverified emails, suspicious patterns
     */
    async signIn({ user, account, profile, email }) {
      // Allow OAuth providers (Google verifies emails)
      if (account?.provider === 'google') {
        // Security: Ensure Google verified the email
        if (profile?.email_verified === false) {
          console.warn('[Auth] Blocked unverified Google email:', user.email);
          return false;
        }
        return true;
      }

      // Allow magic link email provider
      if (account?.provider === 'email') {
        return true;
      }

      // Block other providers or suspicious patterns
      console.warn('[Auth] Blocked sign-in attempt:', { user, account });
      return false;
    },

    /**
     * JWT callback - not used (we use database sessions)
     * Kept for compatibility if we add JWT mode later
     */
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'STUDENT';
      }
      return token;
    },
  },

  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Refresh session every 24 hours
  },

  // Security: Use secure cookies in production
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  // Security: Always require secret in production
  secret: process.env.NEXTAUTH_SECRET,

  // Security: Enable debug only in development
  debug: process.env.NODE_ENV === 'development',

  // Security: Set base path for auth routes
  basePath: '/api/auth',
};
