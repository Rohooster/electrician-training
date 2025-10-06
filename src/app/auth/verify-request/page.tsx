/**
 * Email Verification Request Page
 *
 * Shown after user requests a magic link.
 * Instructs user to check their email for the sign-in link.
 *
 * Security:
 * - No sensitive information exposed
 * - Rate limiting handled by Auth.js token expiry
 * - Link expires after 24 hours
 */

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function VerifyRequestPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get email from URL params if available (Auth.js may pass it)
    const emailParam = searchParams?.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  console.log('[VerifyRequest] Magic link sent, awaiting user action');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-green-600"
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
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Check your email
          </h1>
          <p className="text-gray-600">
            {email
              ? `We sent a magic link to ${email}`
              : 'We sent you a magic link to sign in'}
          </p>
        </div>

        {/* Instructions Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What to do next
          </h2>

          <ol className="space-y-4">
            <li className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mr-3 mt-0.5">
                1
              </div>
              <div>
                <p className="text-gray-900 font-medium">Check your inbox</p>
                <p className="text-sm text-gray-600 mt-1">
                  Look for an email from us. It should arrive within a few minutes.
                </p>
              </div>
            </li>

            <li className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mr-3 mt-0.5">
                2
              </div>
              <div>
                <p className="text-gray-900 font-medium">Click the magic link</p>
                <p className="text-sm text-gray-600 mt-1">
                  The email contains a secure link that will sign you in automatically.
                </p>
              </div>
            </li>

            <li className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mr-3 mt-0.5">
                3
              </div>
              <div>
                <p className="text-gray-900 font-medium">Start studying</p>
                <p className="text-sm text-gray-600 mt-1">
                  You'll be redirected to your dashboard to continue your exam prep.
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Troubleshooting */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-3">
            Don't see the email?
          </h3>
          <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes - emails can take time to arrive</li>
            <li>The link expires after 24 hours for security</li>
          </ul>
        </div>

        {/* Security Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <strong className="font-semibold">Secure authentication</strong>
              <p className="mt-1">
                Magic links are one-time use and expire after 24 hours. Never share
                your sign-in link with anyone.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-3">
          <Link
            href="/auth/signin"
            className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-center"
          >
            Request another link
          </Link>
          <Link
            href="/"
            className="w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Back to home
          </Link>
        </div>

        {/* Help */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <a
              href="mailto:support@example.com"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
