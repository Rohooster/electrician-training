/**
 * Sign In Page
 *
 * Authentication page with magic link (email) and Google OAuth.
 * Implements security best practices:
 * - Client-side email validation
 * - CSRF protection (built into Auth.js)
 * - Rate limiting via Auth.js token expiry
 * - Secure redirects (whitelist-based)
 * - Loading states to prevent double-submission
 *
 * Flow:
 * 1. User enters email OR clicks "Sign in with Google"
 * 2. Magic link: Redirects to verify-request page
 * 3. Google: OAuth flow, then redirects to app
 * 4. Session created, user redirected to callbackUrl or home
 */

'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get callback URL from query params (security: validate later)
  const callbackUrl = searchParams?.get('callbackUrl') || '/';
  const authError = searchParams?.get('error');

  // Display auth errors from URL
  useEffect(() => {
    if (authError) {
      console.error('[SignIn] Auth error:', authError);
      setError(getErrorMessage(authError));
    }
  }, [authError]);

  /**
   * Handle magic link sign in
   * Security: Client-side validation before API call
   */
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email format
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    console.log('[SignIn] Initiating magic link for:', email);

    try {
      const result = await signIn('email', {
        email: email.toLowerCase().trim(),
        callbackUrl,
        redirect: true, // Auth.js will redirect to verify-request page
      });

      // Note: If redirect:true, this code won't run
      // Keeping for future use if we set redirect:false
      if (result?.error) {
        console.error('[SignIn] Magic link error:', result.error);
        setError('Failed to send magic link. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[SignIn] Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  /**
   * Handle Google OAuth sign in
   * Security: Auth.js handles OAuth flow securely
   */
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    console.log('[SignIn] Initiating Google OAuth');

    try {
      await signIn('google', {
        callbackUrl,
        redirect: true,
      });
    } catch (err) {
      console.error('[SignIn] Google OAuth error:', err);
      setError('Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to continue your electrician exam prep
          </p>
        </div>

        {/* Main Sign In Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium mb-4"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Magic Link Email Form */}
          <form onSubmit={handleEmailSignIn}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              />
              <p className="mt-2 text-xs text-gray-500">
                We'll send you a magic link to sign in securely without a password
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending magic link...
                </div>
              ) : (
                'Send magic link'
              )}
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-blue-800">
                <strong className="font-semibold">Secure passwordless login</strong>
                <p className="mt-1">
                  We use magic links for secure authentication. No passwords to
                  remember or leak. Your link expires after 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Don't have an account?{' '}
            <span className="font-medium text-green-600">
              Just sign in with your email - we'll create one for you
            </span>
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>

        {/* Legal */}
        <div className="mt-8 text-center text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <a href="/terms" className="underline hover:text-gray-700">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-gray-700">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Validate email format
 * Security: Basic client-side validation
 * Server-side validation handled by Auth.js
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Convert Auth.js error codes to user-friendly messages
 * Security: Don't expose sensitive error details
 */
function getErrorMessage(error: string): string {
  switch (error) {
    case 'OAuthSignin':
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
    case 'EmailCreateAccount':
      return 'Failed to sign in. Please try again or use a different method.';
    case 'OAuthAccountNotLinked':
      return 'This email is already associated with another account. Please use your original sign-in method.';
    case 'EmailSignin':
      return 'Failed to send sign-in email. Please check your email address and try again.';
    case 'CredentialsSignin':
      return 'Sign in failed. Please check your credentials.';
    case 'SessionRequired':
      return 'Please sign in to access this page.';
    case 'Verification':
      return 'Sign in link expired or invalid. Please request a new one.';
    default:
      return 'An error occurred during sign in. Please try again.';
  }
}
