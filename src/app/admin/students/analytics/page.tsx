'use client';

/**
 * Admin Student Analytics Dashboard
 *
 * Provides comprehensive analytics for administrators
 */

import { useState } from 'react';

export default function AdminStudentAnalytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Mock data - in production, these would come from tRPC queries
  const analytics = {
    totalStudents: 156,
    activePaths: 342,
    completedPaths: 89,
    avgCompletionRate: 68.5,
    avgStudyTime: 187, // minutes
    examReadyCount: 42,
    readyCount: 67,
    developingCount: 38,
    notReadyCount: 9,
  };

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Student Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor student progress, engagement, and exam readiness
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-6">
        {(['7d', '30d', '90d', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {range === '7d'
              ? 'Last 7 days'
              : range === '30d'
              ? 'Last 30 days'
              : range === '90d'
              ? 'Last 90 days'
              : 'All time'}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Total Students</span>
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.totalStudents}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.activePaths} active paths
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">
              Avg Completion
            </span>
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.avgCompletionRate}%
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.completedPaths} paths completed
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">
              Avg Study Time
            </span>
            <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {Math.floor(analytics.avgStudyTime / 60)}h {analytics.avgStudyTime % 60}
            m
          </div>
          <p className="text-xs text-gray-500 mt-1">Per student</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Exam Ready</span>
            <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.examReadyCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {((analytics.examReadyCount / analytics.totalStudents) * 100).toFixed(
              0
            )}
            % of students
          </p>
        </div>
      </div>

      {/* Readiness Distribution */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Exam Readiness Distribution
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Exam Ready</span>
              <span className="text-gray-600">
                {analytics.examReadyCount} students (
                {(
                  (analytics.examReadyCount / analytics.totalStudents) *
                  100
                ).toFixed(0)}
                %)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full"
                style={{ width: `${(analytics.examReadyCount / analytics.totalStudents) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Ready</span>
              <span className="text-gray-600">
                {analytics.readyCount} students (
                {((analytics.readyCount / analytics.totalStudents) * 100).toFixed(
                  0
                )}
                %)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full"
                style={{ width: `${(analytics.readyCount / analytics.totalStudents) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Developing</span>
              <span className="text-gray-600">
                {analytics.developingCount} students (
                {(
                  (analytics.developingCount / analytics.totalStudents) *
                  100
                ).toFixed(0)}
                %)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-yellow-600 h-3 rounded-full"
                style={{ width: `${(analytics.developingCount / analytics.totalStudents) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Not Ready</span>
              <span className="text-gray-600">
                {analytics.notReadyCount} students (
                {((analytics.notReadyCount / analytics.totalStudents) * 100).toFixed(
                  0
                )}
                %)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-red-600 h-3 rounded-full"
                style={{ width: `${(analytics.notReadyCount / analytics.totalStudents) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg className="h-6 w-6 text-yellow-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-yellow-900 mb-1">
              Analytics Dashboard In Development
            </h3>
            <p className="text-sm text-yellow-800">
              This dashboard shows mock data. In production, this will display real-time student analytics including top performers, concept mastery breakdown, at-risk students, and detailed engagement metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
