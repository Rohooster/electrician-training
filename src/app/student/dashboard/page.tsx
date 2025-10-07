'use client';

/**
 * Student Dashboard
 *
 * Main student landing page showing:
 * - Overall statistics (level, XP, streak, exam readiness)
 * - Active learning paths with progress
 * - Recent achievements and badges
 * - Study recommendations
 */

import { trpc } from '@/lib/trpc-client';
import Link from 'next/link';

export default function StudentDashboard() {
  const { data: stats, isLoading: statsLoading } =
    trpc.learningPath.getStudentStats.useQuery();

  const { data: paths, isLoading: pathsLoading } =
    trpc.learningPath.getUserPaths.useQuery();

  if (statsLoading || pathsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const activePaths = paths?.filter((p) => p.status === 'ACTIVE') || [];
  const completedPaths = paths?.filter((p) => p.status === 'COMPLETED') || [];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, Student! 👋
        </h1>
        <p className="text-gray-600">
          Continue your journey to becoming a licensed electrician
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Level & XP */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Level & XP</span>
            <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            Level {stats?.level || 1}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-yellow-600 h-2 rounded-full"
              style={{ width: `${stats ? ((stats.xp % 1000) / 1000) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {stats?.xpToNextLevel || 1000} XP to Level {(stats?.level || 1) + 1}
          </p>
        </div>

        {/* Current Streak */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Current Streak</span>
            <span className="text-2xl">🔥</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.currentStreak || 0} days
          </div>
          <p className="text-xs text-gray-500">
            Longest: {stats?.longestStreak || 0} days
          </p>
          {(stats?.currentStreak || 0) >= 7 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500 text-white mt-2">
              On Fire! 🔥
            </span>
          )}
        </div>

        {/* Study Time */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Study Time</span>
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {Math.floor((stats?.totalStudyMinutes || 0) / 60)}h{' '}
            {(stats?.totalStudyMinutes || 0) % 60}m
          </div>
          <p className="text-xs text-gray-500">Total study time</p>
        </div>

        {/* Exam Readiness */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">
              Exam Readiness
            </span>
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.estimatedExamScore
              ? `${stats.estimatedExamScore.toFixed(0)}%`
              : 'N/A'}
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              stats?.readinessLevel === 'EXAM_READY'
                ? 'bg-green-500 text-white'
                : stats?.readinessLevel === 'READY'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {stats?.readinessLevel || 'NOT_READY'}
          </span>
        </div>
      </div>

      {/* Active Learning Paths */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Active Learning Paths</h2>
          <Link
            href="/student/assessment/new"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Take Assessment
          </Link>
        </div>

        {activePaths.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Active Learning Paths
            </h3>
            <p className="text-gray-600 mb-4">
              Take an adaptive assessment to generate your personalized learning path
            </p>
            <Link
              href="/student/assessment/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Start Assessment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activePaths.map((path) => (
              <div key={path.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {path.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {path.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                    Active
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span className="font-semibold">
                      {path.progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {path.completedSteps} / {path.totalSteps} steps completed
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">
                      Estimated Days
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {path.estimatedDays}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Steps</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {path.totalSteps}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/student/path/${path.id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Continue Learning
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges & Achievements */}
      {stats && stats.badges && stats.badges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Recent Badges
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stats.badges.slice(0, 6).map((badge: any) => (
              <div
                key={badge.id}
                className="bg-white rounded-lg shadow-sm border p-4 text-center hover:shadow-lg transition-shadow"
              >
                <span className="text-4xl mb-2">⭐</span>
                <div className="text-sm font-semibold text-gray-900">
                  {badge.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(badge.earnedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Paths */}
      {completedPaths.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completed Paths
          </h2>
          <div className="space-y-3">
            {completedPaths.map((path) => (
              <div
                key={path.id}
                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-gray-900">{path.name}</h3>
                      <p className="text-sm text-gray-600">
                        {path.totalSteps} steps · {path.estimatedDays} days
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-600 border border-green-600">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
