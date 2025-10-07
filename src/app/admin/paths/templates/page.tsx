'use client';

/**
 * Admin Path Template Management
 *
 * Allows administrators to:
 * - View all path templates
 * - Create new templates
 * - Edit existing templates
 * - See usage statistics
 * - Configure template parameters
 */

import { useState } from 'react';

export default function PathTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock templates - in production, these would come from tRPC queries
  const templates = [
    {
      id: '1',
      name: 'Beginner to Journeyman',
      description:
        'Comprehensive 60-day path covering all fundamental concepts for new electricians',
      targetLevel: 'BEGINNER',
      conceptsCount: 42,
      estimatedDays: 60,
      itemsPerConcept: 10,
      requiredAccuracy: 0.75,
      timesUsed: 87,
      isActive: true,
    },
    {
      id: '2',
      name: 'Weak Areas Reinforcement',
      description:
        'Targeted 14-day path focusing on commonly failed exam topics',
      targetLevel: 'INTERMEDIATE',
      conceptsCount: 15,
      estimatedDays: 14,
      itemsPerConcept: 15,
      requiredAccuracy: 0.8,
      timesUsed: 134,
      isActive: true,
    },
    {
      id: '3',
      name: 'Exam Prep Sprint',
      description: 'Intensive 7-day final review before taking the exam',
      targetLevel: 'ADVANCED',
      conceptsCount: 25,
      estimatedDays: 7,
      itemsPerConcept: 8,
      requiredAccuracy: 0.85,
      timesUsed: 56,
      isActive: true,
    },
    {
      id: '4',
      name: 'NEC Code Focus',
      description:
        'Deep dive into National Electrical Code requirements and references',
      targetLevel: 'INTERMEDIATE',
      conceptsCount: 30,
      estimatedDays: 21,
      itemsPerConcept: 12,
      requiredAccuracy: 0.75,
      timesUsed: 23,
      isActive: false,
    },
  ];

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Learning Path Templates
          </h1>
          <p className="text-gray-600">
            Manage reusable templates for personalized learning paths
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          + New Template
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
          Search Templates
        </label>
        <input
          id="search"
          type="text"
          placeholder="Search by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Templates</span>
            <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
          <p className="text-xs text-gray-500 mt-1">
            {templates.filter((t) => t.isActive).length} active
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Usage</span>
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {templates.reduce((sum, t) => sum + t.timesUsed, 0)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Paths generated</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Duration</span>
            <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(
              templates.reduce((sum, t) => sum + t.estimatedDays, 0) /
                templates.length
            )}
            d
          </div>
          <p className="text-xs text-gray-500 mt-1">Days per template</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Most Used</span>
            <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-gray-900 line-clamp-2">
            {templates.sort((a, b) => b.timesUsed - a.timesUsed)[0]?.name ||
              'N/A'}
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {template.name}
                  </h3>
                  {template.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                    {template.targetLevel}
                  </span>
                </div>
                <p className="text-gray-600">{template.description}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Concepts</div>
                <div className="text-lg font-semibold text-gray-900">
                  {template.conceptsCount}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Duration</div>
                <div className="text-lg font-semibold text-gray-900">
                  {template.estimatedDays} days
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Items/Concept</div>
                <div className="text-lg font-semibold text-gray-900">
                  {template.itemsPerConcept}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Required Accuracy</div>
                <div className="text-lg font-semibold text-gray-900">
                  {(template.requiredAccuracy * 100).toFixed(0)}%
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Times Used</div>
                <div className="text-lg font-semibold text-gray-900">
                  {template.timesUsed}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No templates found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or create a new template
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
