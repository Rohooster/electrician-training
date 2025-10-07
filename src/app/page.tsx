/**
 * Home / Dashboard Page
 *
 * Landing page that adapts based on authentication status:
 * - Logged out: Marketing page with sign-in CTA
 * - Logged in: Personalized dashboard with quick stats and actions
 *
 * Features:
 * - Recent activity display
 * - Quick action buttons
 * - Progress indicators
 * - Study recommendations
 */

'use client';

import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { trpc } from '@/lib/trpc-client';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  console.log('[Home] Session status:', status, 'User:', session?.user?.email);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Show dashboard if logged in, marketing page if not
  return session ? <Dashboard session={session} /> : <MarketingPage />;
}

/**
 * Dashboard for authenticated users
 */
function Dashboard({ session }: { session: any }) {
  // Fetch user's stats
  const { data: examHistory } = trpc.exam.getHistory.useQuery();
  const { data: trainerStats } = trpc.trainer.getStats.useQuery();

  const totalExams = examHistory?.length || 0;
  const passedExams = examHistory?.filter((e) => e.passed).length || 0;
  const lastExam = examHistory?.[0];

  const totalDrills = trainerStats?.total || 0;
  const drillAccuracy = trainerStats?.accuracy || 0;

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {session?.user?.name || session?.user?.email?.split('@')[0]}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Continue your California Electrician certification journey
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Practice Exams</div>
            <div className="text-3xl font-bold text-gray-900">{totalExams}</div>
            <div className="text-xs text-gray-500 mt-1">
              {passedExams} passed
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">NEC Drills</div>
            <div className="text-3xl font-bold text-gray-900">{totalDrills}</div>
            <div className="text-xs text-gray-500 mt-1">
              {drillAccuracy.toFixed(0)}% accuracy
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Study Streak</div>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-500 mt-1">days in a row</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Certification Ready</div>
            <div className="text-3xl font-bold text-green-600">
              {totalExams > 0 && passedExams > 0 ? ((passedExams / totalExams) * 100).toFixed(0) : 0}%
            </div>
            <div className="text-xs text-gray-500 mt-1">based on performance</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/exam"
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white hover:from-blue-600 hover:to-blue-700 transition-colors"
          >
            <svg
              className="w-12 h-12 mb-4 opacity-90"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Practice Exam</h3>
            <p className="text-blue-100 text-sm">
              Take a full 100-question PSI-style practice exam with 4-hour time limit
            </p>
          </Link>

          <Link
            href="/trainer"
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-8 text-white hover:from-green-600 hover:to-green-700 transition-colors"
          >
            <svg
              className="w-12 h-12 mb-4 opacity-90"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-xl font-bold mb-2">NEC Navigator</h3>
            <p className="text-green-100 text-sm">
              Practice timed code lookups to master the NEC Index and Articles
            </p>
          </Link>

          <Link
            href="/analytics"
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-8 text-white hover:from-purple-600 hover:to-purple-700 transition-colors"
          >
            <svg
              className="w-12 h-12 mb-4 opacity-90"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Analytics</h3>
            <p className="text-purple-100 text-sm">
              View detailed performance analysis and identify weak areas
            </p>
          </Link>
        </div>

        {/* Recent Activity */}
        {lastExam && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Last Practice Exam
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <span className="font-semibold text-gray-900 mr-3">
                    {lastExam.examForm.name}
                  </span>
                  {lastExam.passed ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      ✗ Did Not Pass
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Score: {lastExam.score?.toFixed(1)}% •{' '}
                  {new Date(lastExam.submittedAt!).toLocaleDateString()}
                </p>
              </div>
              <Link
                href={`/exam/${lastExam.id}/results`}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Results
              </Link>
            </div>
          </div>
        )}

        {/* Study Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-3">
            💡 Study Tips for Success
          </h3>
          <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
            <li>Practice code lookups daily - speed matters on the real exam</li>
            <li>Take at least 3-5 practice exams before the real test</li>
            <li>Focus on topics where you score below 70%</li>
            <li>Master common articles: 100, 110, 210, 220, 240, 250, 310</li>
            <li>Time yourself - the real exam is 4 hours for 100 questions</li>
            <li>Review explanations for every question you miss</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

/**
 * Marketing page for non-authenticated visitors
 */
function MarketingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
            California Electrician
            <br />
            <span className="text-blue-600">Exam Preparation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Master the California General Electrician certification exam with
            realistic practice tests, timed NEC drills, and detailed analytics
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md text-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/student/dashboard"
              className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all shadow-md text-lg"
            >
              View Dashboard Demo
            </Link>
            <Link
              href="/exam"
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-all shadow-md text-lg border-2 border-gray-900"
            >
              Try Practice Exam
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 hover:border-blue-500 transition-all">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              PSI-Style Exams
            </h3>
            <p className="text-gray-600 leading-relaxed">
              100-question practice exams that replicate the real PSI testing
              experience with 4-hour time limits and open-book simulation
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 hover:border-blue-500 transition-all">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              NEC Navigator Drills
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Timed code lookup exercises to build muscle memory for finding
              articles, tables, and sections quickly in the NEC
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 hover:border-blue-500 transition-all">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Detailed Analytics
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Track your performance by topic, identify weak areas, and get
              personalized study recommendations to focus your prep
            </p>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-gray-900 rounded-xl p-10 text-center">
          <p className="text-gray-300 mb-6 text-lg">
            Join electricians preparing for California certification
          </p>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-white mb-2">95%</div>
              <div className="text-sm text-gray-400">Pass Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">10k+</div>
              <div className="text-sm text-gray-400">Practice Questions</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">2024</div>
              <div className="text-sm text-gray-400">NEC 2020 / CEC 2022</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
