/**
 * Authentication Error Page
 *
 * Displays user-friendly error messages when authentication fails.
 * Handles all Auth.js error codes with appropriate guidance.
 *
 * Security:
 * - Generic error messages to avoid information disclosure
 * - No sensitive details exposed
 * - Guides users to recovery actions
 */

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ErrorInfo {
  title: string;
  message: string;
  action: string;
  actionLink: string;
  severity: 'error' | 'warning';
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [errorInfo, setErrorInfo] = useState<ErrorInfo>(getDefaultError());

  useEffect(() => {
    const error = searchParams?.get('error');
    if (error) {
      console.error('[AuthError] Error code:', error);
      setErrorInfo(getErrorInfo(error));
    }
  }, [searchParams]);

  const isError = errorInfo.severity === 'error';
  const iconColor = isError ? 'text-red-600' : 'text-yellow-600';
  const bgColor = isError ? 'bg-red-50' : 'bg-yellow-50';
  const borderColor = isError ? 'border-red-200' : 'border-yellow-200';
  const buttonColor = isError
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-yellow-600 hover:bg-yellow-700';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 ${bgColor} rounded-full mb-4`}
          >
            {isError ? (
              <svg
                className={`w-10 h-10 ${iconColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className={`w-10 h-10 ${iconColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-gray-600">{errorInfo.message}</p>
        </div>

        {/* Error Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What you can do
          </h2>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-gray-700">
                Try signing in again with your email or Google account
              </p>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-gray-700">
                Make sure you're using the same sign-in method as before
              </p>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-gray-700">
                Clear your browser cache and cookies, then try again
              </p>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-gray-700">
                If using a magic link, request a new one - they expire after 24 hours
              </p>
            </li>
          </ul>

          <Link
            href={errorInfo.actionLink}
            className={`block w-full px-6 py-3 ${buttonColor} text-white font-medium rounded-lg transition-colors text-center`}
          >
            {errorInfo.action}
          </Link>
        </div>

        {/* Common Issues */}
        <div className={`${bgColor} border ${borderColor} rounded-lg p-6 mb-6`}>
          <h3 className={`font-semibold ${iconColor} mb-3`}>Common issues</h3>
          <ul
            className={`text-sm ${
              isError ? 'text-red-800' : 'text-yellow-800'
            } space-y-2 list-disc list-inside`}
          >
            <li>
              <strong>Account already exists:</strong> If you previously signed in
              with Google, use Google again (not email)
            </li>
            <li>
              <strong>Link expired:</strong> Magic links are valid for 24 hours.
              Request a new one.
            </li>
            <li>
              <strong>Email not verified:</strong> For Google sign-in, make sure
              your email is verified with Google
            </li>
          </ul>
        </div>

        {/* Support */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Still need help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you continue to experience issues, our support team is here to help.
          </p>
          <a
            href="mailto:support@example.com"
            className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact support
          </a>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Get error information based on Auth.js error code
 * Security: Return generic messages to avoid information disclosure
 */
function getErrorInfo(errorCode: string): ErrorInfo {
  switch (errorCode) {
    case 'Configuration':
      return {
        title: 'Configuration Error',
        message:
          'There is a problem with the server configuration. Please contact support.',
        action: 'Back to sign in',
        actionLink: '/auth/signin',
        severity: 'error',
      };

    case 'AccessDenied':
      return {
        title: 'Access Denied',
        message: 'You do not have permission to sign in.',
        action: 'Try different account',
        actionLink: '/auth/signin',
        severity: 'error',
      };

    case 'Verification':
      return {
        title: 'Link Expired',
        message:
          'The sign-in link has expired or has already been used. Magic links are valid for 24 hours.',
        action: 'Request new link',
        actionLink: '/auth/signin',
        severity: 'warning',
      };

    case 'OAuthSignin':
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
      return {
        title: 'OAuth Error',
        message:
          'There was a problem signing in with your account. Please try again.',
        action: 'Try again',
        actionLink: '/auth/signin',
        severity: 'error',
      };

    case 'OAuthAccountNotLinked':
      return {
        title: 'Account Already Exists',
        message:
          'This email is already associated with a different sign-in method. Please use your original sign-in method.',
        action: 'Try different method',
        actionLink: '/auth/signin',
        severity: 'warning',
      };

    case 'EmailCreateAccount':
    case 'EmailSignin':
      return {
        title: 'Email Sign In Failed',
        message:
          'We could not send a sign-in email. Please check your email address and try again.',
        action: 'Try again',
        actionLink: '/auth/signin',
        severity: 'error',
      };

    case 'CredentialsSignin':
      return {
        title: 'Sign In Failed',
        message: 'The credentials you provided were incorrect. Please try again.',
        action: 'Try again',
        actionLink: '/auth/signin',
        severity: 'error',
      };

    case 'SessionRequired':
      return {
        title: 'Session Required',
        message: 'You must be signed in to access this page.',
        action: 'Sign in',
        actionLink: '/auth/signin',
        severity: 'warning',
      };

    case 'Default':
    default:
      return getDefaultError();
  }
}

/**
 * Default error for unknown error codes
 */
function getDefaultError(): ErrorInfo {
  return {
    title: 'Something Went Wrong',
    message:
      'An unexpected error occurred during sign in. Please try again or contact support if the problem persists.',
    action: 'Try again',
    actionLink: '/auth/signin',
    severity: 'error',
  };
}
