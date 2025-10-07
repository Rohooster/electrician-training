/**
 * Embedding Quality Dashboard
 *
 * Monitor and analyze embedding quality:
 * - Coverage statistics
 * - Model distribution
 * - Regeneration tools
 * - Quality insights
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';

export default function EmbeddingDashboardPage() {
  const [selectedJurisdictionId, setSelectedJurisdictionId] = useState<string>('');

  // Get statistics
  const { data: stats, refetch: refetchStats } = trpc.embedding.getStats.useQuery({
    jurisdictionId: selectedJurisdictionId || undefined,
  });

  // Get items without embeddings
  const { data: itemsWithoutEmbeddings } = trpc.embedding.findItemsWithoutEmbeddings.useQuery({
    jurisdictionId: selectedJurisdictionId || undefined,
    limit: 10,
  });

  // Get concepts without embeddings
  const { data: conceptsWithoutEmbeddings } = trpc.embedding.findConceptsWithoutEmbeddings.useQuery({
    jurisdictionId: selectedJurisdictionId || undefined,
    limit: 10,
  });

  // Test connection
  const { data: connectionTest, refetch: refetchConnection } = trpc.embedding.testConnection.useQuery();

  const itemCoverage = stats?.items.coverage || 0;
  const conceptCoverage = stats?.concepts.coverage || 0;
  const overallCoverage = stats
    ? ((stats.items.withEmbeddings + stats.concepts.withEmbeddings) /
        (stats.items.total + stats.concepts.total)) *
      100
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
          <div className="flex space-x-3">
            <Link
              href="/admin/embeddings/generate"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Embeddings
            </Link>
            <Link
              href="/admin/embeddings/test"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Test Similarity
            </Link>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Embedding Quality Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Monitor embedding coverage and quality metrics
        </p>
      </div>

      {/* Connection Status */}
      {connectionTest && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg border ${
            connectionTest.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {connectionTest.success ? '✓ OpenAI API Connected' : '✗ OpenAI API Connection Failed'}
              </p>
              <p className="text-sm mt-1">
                {connectionTest.success
                  ? `Model: ${connectionTest.model} • Latency: ${connectionTest.latency}ms`
                  : connectionTest.error}
              </p>
            </div>
            <button
              onClick={() => refetchConnection()}
              className="text-sm underline hover:no-underline"
            >
              Test Again
            </button>
          </div>
        </div>
      )}

      {/* Overall Coverage */}
      <div className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Overall Embedding Coverage</h2>
            <p className="text-sm text-blue-100 mt-1">
              {stats ? (
                <>
                  {stats.items.withEmbeddings + stats.concepts.withEmbeddings} of{' '}
                  {stats.items.total + stats.concepts.total} items/concepts have embeddings
                </>
              ) : (
                'Loading...'
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{overallCoverage.toFixed(1)}%</div>
            <div className="text-sm text-blue-100">coverage</div>
          </div>
        </div>
        <div className="w-full bg-blue-400 rounded-full h-3">
          <div
            className="bg-white h-3 rounded-full transition-all duration-500"
            style={{ width: `${overallCoverage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-600 mb-1">Total Items</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.items.total || 0}</div>
          <div className="mt-2 text-xs text-gray-500">
            {stats?.items.withEmbeddings || 0} with embeddings
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-600 mb-1">Item Coverage</div>
          <div className="text-3xl font-bold text-blue-600">{itemCoverage.toFixed(1)}%</div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${itemCoverage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-600 mb-1">Total Concepts</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.concepts.total || 0}</div>
          <div className="mt-2 text-xs text-gray-500">
            {stats?.concepts.withEmbeddings || 0} with embeddings
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-600 mb-1">Concept Coverage</div>
          <div className="text-3xl font-bold text-purple-600">{conceptCoverage.toFixed(1)}%</div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${conceptCoverage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Items Without Embeddings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Items Needing Embeddings</h3>
            <span className="text-sm text-gray-500">
              {stats?.items.withoutEmbeddings || 0} total
            </span>
          </div>

          {itemsWithoutEmbeddings && itemsWithoutEmbeddings.count > 0 ? (
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                Showing first {Math.min(10, itemsWithoutEmbeddings.count)} items
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">
                  ⚠ {itemsWithoutEmbeddings.count} items are missing embeddings
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-green-600">
              <p className="font-medium">✓ All items have embeddings!</p>
            </div>
          )}

          {itemsWithoutEmbeddings && itemsWithoutEmbeddings.count > 0 && (
            <Link
              href="/admin/embeddings/generate"
              className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Item Embeddings
            </Link>
          )}
        </div>

        {/* Concepts Without Embeddings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Concepts Needing Embeddings</h3>
            <span className="text-sm text-gray-500">
              {stats?.concepts.withoutEmbeddings || 0} total
            </span>
          </div>

          {conceptsWithoutEmbeddings && conceptsWithoutEmbeddings.count > 0 ? (
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                Showing first {Math.min(10, conceptsWithoutEmbeddings.count)} concepts
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">
                  ⚠ {conceptsWithoutEmbeddings.count} concepts are missing embeddings
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-green-600">
              <p className="font-medium">✓ All concepts have embeddings!</p>
            </div>
          )}

          {conceptsWithoutEmbeddings && conceptsWithoutEmbeddings.count > 0 && (
            <Link
              href="/admin/embeddings/generate"
              className="block w-full px-4 py-2 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors"
            >
              Generate Concept Embeddings
            </Link>
          )}
        </div>
      </div>

      {/* Quality Insights */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quality Insights</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Readiness */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-900 mb-2">System Readiness</div>
            {overallCoverage >= 90 ? (
              <div className="text-green-600">
                <div className="text-2xl font-bold">✓ Excellent</div>
                <p className="text-xs mt-1">Ready for personalized learning</p>
              </div>
            ) : overallCoverage >= 70 ? (
              <div className="text-blue-600">
                <div className="text-2xl font-bold">→ Good</div>
                <p className="text-xs mt-1">Most features available</p>
              </div>
            ) : (
              <div className="text-orange-600">
                <div className="text-2xl font-bold">⚠ Limited</div>
                <p className="text-xs mt-1">Generate more embeddings</p>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-900 mb-2">Recommendation</div>
            <div className="text-gray-700">
              <div className="text-2xl font-bold">
                {stats?.items.withoutEmbeddings || 0}
              </div>
              <p className="text-xs mt-1">items to process next</p>
            </div>
          </div>

          {/* Cost Estimate */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-900 mb-2">Cost to Complete</div>
            <div className="text-gray-700">
              <div className="text-2xl font-bold">
                $
                {(
                  ((stats?.items.withoutEmbeddings || 0) * 100 * 0.02) /
                  1000000
                ).toFixed(4)}
              </div>
              <p className="text-xs mt-1">using text-embedding-3-small</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Features */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Enabled Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                itemCoverage > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {itemCoverage > 0 ? '✓' : '○'}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Similarity Search</div>
              <p className="text-sm text-gray-600 mt-1">
                Find related questions based on semantic meaning
              </p>
              {itemCoverage > 0 && (
                <Link
                  href="/admin/embeddings/test"
                  className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                >
                  Test Now →
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                conceptCoverage > 50 && itemCoverage > 50
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {conceptCoverage > 50 && itemCoverage > 50 ? '✓' : '○'}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Personalized Learning</div>
              <p className="text-sm text-gray-600 mt-1">
                Match weak concepts to relevant practice items
              </p>
              {conceptCoverage > 50 && itemCoverage > 50 && (
                <span className="text-sm text-green-600 mt-2 inline-block">Ready</span>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                itemCoverage > 70 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {itemCoverage > 70 ? '✓' : '○'}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Content Gap Analysis</div>
              <p className="text-sm text-gray-600 mt-1">
                Identify under-covered topics in item bank
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                conceptCoverage > 80 && itemCoverage > 80
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {conceptCoverage > 80 && itemCoverage > 80 ? '✓' : '○'}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Adaptive Assessments</div>
              <p className="text-sm text-gray-600 mt-1">
                Generate custom tests targeting specific skills
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
