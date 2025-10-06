# Authentication Setup Guide

Complete guide for setting up authentication in the California Electrician Exam Prep application.

## Overview

The application uses **Auth.js (NextAuth.js v5)** with:
- **Magic Link (Email)** - Passwordless authentication (primary)
- **Google OAuth** - Social login (optional)
- **Database sessions** - Secure, server-side session storage
- **Route protection** - Middleware-based access control
- **Rate limiting** - Built-in protection against abuse

## Security Features

✅ **Database-backed sessions** (not JWT) - More secure, can be revoked instantly
✅ **Magic links expire after 24 hours** - Time-limited authentication
✅ **Email verification required** - Prevents unauthorized access
✅ **Secure cookies** - HttpOnly, SameSite, Secure in production
✅ **CSRF protection** - Built into Auth.js
✅ **Session rotation** - Updates every 24 hours
✅ **Rate limiting** - Prevents brute force attacks
✅ **Role-based access control** - Admin vs Student permissions

---

## Quick Start

### 1. Install Dependencies

Already included in `package.json`:
```json
{
  "next-auth": "^5.0.0-beta.25",
  "@auth/prisma-adapter": "^2.7.4"
}
```

### 2. Set Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email Provider (choose one below)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# Optional: Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 3. Generate Auth Secret

```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET` in `.env`.

### 4. Set Up Email Provider

Choose one of the following:

#### Option A: Gmail SMTP (Development Only)

1. Go to Google Account Settings → Security → 2-Step Verification
2. Enable 2-Step Verification if not already enabled
3. Go to "App passwords" and generate a new password
4. Use these credentials:

```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-16-char-app-password"
EMAIL_FROM="your-email@gmail.com"
```

⚠️ **Not for production** - Gmail has rate limits and may flag as spam.

#### Option B: Resend (Recommended for Production)

1. Sign up at [resend.com](https://resend.com) (3,000 emails/month free)
2. Get your API key from the dashboard
3. Use these credentials:

```env
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="re_xxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
```

#### Option C: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com) (100 emails/day free)
2. Create an API key
3. Use these credentials:

```env
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="apikey"
EMAIL_SERVER_PASSWORD="SG.xxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
```

### 5. Set Up Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
4. Application type: "Web application"
5. Add authorized redirect URI:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`:

```env
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxxx"
```

### 6. Push Database Schema

The Auth.js adapter requires specific tables:

```bash
npm run db:push
```

This creates:
- `User` - User accounts
- `Account` - OAuth provider connections
- `Session` - Active sessions
- `VerificationToken` - Magic link tokens

### 7. Test Authentication

Start the dev server:

```bash
npm run dev
```

Navigate to `http://localhost:3000/auth/signin` and test:
1. **Magic Link**: Enter your email, check inbox, click link
2. **Google OAuth**: Click "Continue with Google", sign in

---

## Architecture

### Files Created

```
src/
├── lib/
│   ├── auth.ts                        # Auth.js configuration
│   └── rate-limit.ts                  # Rate limiting utility
├── middleware.ts                      # Route protection
└── app/
    ├── page.tsx                       # Home/dashboard (auth-aware)
    ├── api/
    │   └── auth/
    │       └── [...nextauth]/route.ts # Auth.js API (auto-generated)
    └── auth/
        ├── signin/page.tsx            # Sign-in page
        ├── verify-request/page.tsx    # Email sent confirmation
        └── error/page.tsx             # Auth error handler
```

### Authentication Flow

#### Magic Link Flow:
```
1. User enters email at /auth/signin
2. Auth.js generates secure token, stores in DB
3. Email sent with magic link (expires in 24h)
4. User clicks link → verifies token → creates session
5. Redirects to callbackUrl or home page
```

#### Google OAuth Flow:
```
1. User clicks "Continue with Google"
2. Redirects to Google authorization
3. User approves access
4. Google redirects back with authorization code
5. Auth.js exchanges code for user profile
6. Creates/updates user, creates session
7. Redirects to callbackUrl or home page
```

### Route Protection

Protected routes automatically redirect unauthenticated users:

```typescript
// src/middleware.ts
Protected routes:
- /exam/*
- /trainer/*
- /calc/*
- /analytics/*
- /admin/* (requires ADMIN role)

Public routes:
- /
- /auth/*
- /api/auth/*
```

### Session Management

```typescript
// Access session in server components
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (session) {
  console.log(session.user.email);
}
```

```typescript
// Access session in client components
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
if (status === 'authenticated') {
  console.log(session.user.email);
}
```

### Sign Out

```typescript
import { signOut } from 'next-auth/react';

signOut({ callbackUrl: '/' });
```

---

## Security Best Practices

### ✅ Already Implemented

1. **Database Sessions** - Sessions stored server-side, can be revoked instantly
2. **Secure Cookies** - HttpOnly, SameSite=lax, Secure in production
3. **Token Expiry** - Magic links expire after 24 hours
4. **Email Verification** - Google OAuth requires verified emails
5. **CSRF Protection** - Built into Auth.js
6. **Session Rotation** - Sessions refresh every 24 hours
7. **Role-Based Access** - Admin routes protected by role check
8. **Rate Limiting** - Utility available for API endpoints

### 🔐 Production Checklist

Before deploying to production:

- [ ] Use strong `NEXTAUTH_SECRET` (32+ random characters)
- [ ] Enable HTTPS (cookies will use `Secure` flag automatically)
- [ ] Use production email service (Resend, SendGrid, AWS SES)
- [ ] Set up Google OAuth production credentials
- [ ] Configure proper CORS and CSP headers
- [ ] Enable rate limiting on auth endpoints
- [ ] Set up monitoring for failed login attempts
- [ ] Configure session timeout (currently 30 days)
- [ ] Set up email deliverability (SPF, DKIM, DMARC)
- [ ] Review and test all auth flows

### 🚫 Common Security Mistakes to Avoid

1. ❌ Don't use JWT sessions (use database sessions)
2. ❌ Don't commit `.env` with real secrets to git
3. ❌ Don't use weak `NEXTAUTH_SECRET`
4. ❌ Don't skip email verification for OAuth providers
5. ❌ Don't allow HTTP in production
6. ❌ Don't expose sensitive user data in session
7. ❌ Don't skip rate limiting on auth endpoints
8. ❌ Don't use Gmail SMTP in production

---

## Rate Limiting

### Usage Example

```typescript
import { rateLimit, RateLimits, getClientIp } from '@/lib/rate-limit';

// In API route or tRPC procedure
const ip = getClientIp(request);

const limit = rateLimit({
  identifier: ip,
  ...RateLimits.AUTH, // 5 requests per 15 minutes
  endpoint: '/api/auth/signin',
});

if (!limit.success) {
  throw new TRPCError({
    code: 'TOO_MANY_REQUESTS',
    message: `Too many attempts. Try again in ${limit.retryAfter} seconds.`,
  });
}
```

### Available Rate Limits

```typescript
RateLimits.AUTH          // 5 per 15 min (auth endpoints)
RateLimits.API           // 60 per minute (general API)
RateLimits.EXAM_SUBMIT   // 3 per hour (exam submission)
RateLimits.DRILL_CREATE  // 20 per 5 min (drill creation)
```

---

## Troubleshooting

### Magic Link Not Working

**Problem**: Magic link expires or doesn't work

**Solutions**:
- Check that `NEXTAUTH_URL` matches your actual URL
- Verify email credentials are correct
- Check spam folder
- Magic links expire after 24 hours - request a new one
- Ensure database is accessible

### Google OAuth Fails

**Problem**: "Error 400: redirect_uri_mismatch"

**Solutions**:
- Add exact redirect URI to Google Console:
  - Dev: `http://localhost:3000/api/auth/callback/google`
  - Prod: `https://yourdomain.com/api/auth/callback/google`
- No trailing slashes
- Match protocol (http vs https)

### Session Not Persisting

**Problem**: User gets logged out immediately

**Solutions**:
- Check `NEXTAUTH_SECRET` is set
- Verify cookies are enabled in browser
- Check database connection
- Ensure `Session` table exists in database
- Clear browser cookies and try again

### "Configuration" Error

**Problem**: Auth.js throws configuration error

**Solutions**:
- Verify all required env vars are set
- Check `NEXTAUTH_SECRET` is present
- Ensure `NEXTAUTH_URL` is correct
- Restart dev server after changing `.env`

---

## Advanced Configuration

### Custom Session Duration

```typescript
// src/lib/auth.ts
session: {
  strategy: 'database',
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60,   // Update every 24 hours
}
```

### Add Custom User Fields

```prisma
// prisma/schema.prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          UserRole  @default(STUDENT)
  // Add custom fields here
  phone         String?
  certificationDate DateTime?
}
```

After modifying schema:
```bash
npm run db:push
```

### Custom Sign-In Callbacks

```typescript
// src/lib/auth.ts
callbacks: {
  async signIn({ user, account, profile }) {
    // Custom logic before allowing sign-in
    // Return false to deny access
    if (user.email?.endsWith('@banned-domain.com')) {
      return false;
    }
    return true;
  },
}
```

---

## Testing

### Manual Testing Checklist

- [ ] Magic link sign-in works
- [ ] Magic link expires after 24 hours
- [ ] Google OAuth works
- [ ] Google OAuth with unverified email blocked
- [ ] Protected routes redirect to sign-in
- [ ] Admin routes blocked for non-admin users
- [ ] Session persists across page refreshes
- [ ] Sign-out works correctly
- [ ] Callback URLs work (redirect after login)
- [ ] Error page shows for auth failures

### Automated Testing (Future)

```typescript
// tests/auth.spec.ts (Playwright example)
test('magic link authentication flow', async ({ page }) => {
  // Visit sign-in page
  await page.goto('/auth/signin');

  // Enter email
  await page.fill('input[type="email"]', 'test@example.com');
  await page.click('button[type="submit"]');

  // Verify redirect to verify-request page
  await expect(page).toHaveURL('/auth/verify-request');

  // In real test, would check email and click link
  // For now, mock the callback
});
```

---

## Support

For issues or questions:
- Check [Auth.js Documentation](https://authjs.dev)
- Review error logs in console
- Check [GitHub Issues](https://github.com/rohooster/electrician-tool/issues)

---

## Summary

✅ **Secure** - Industry-standard authentication with Auth.js
✅ **Passwordless** - Magic links eliminate password vulnerabilities
✅ **Flexible** - Easy to add more OAuth providers
✅ **Production-Ready** - Rate limiting, session management, CSRF protection
✅ **User-Friendly** - Simple sign-in flow, clear error messages

Your authentication system is now fully configured and ready for production deployment!
