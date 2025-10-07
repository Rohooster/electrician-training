/**
 * Concept Detail View
 *
 * Shows complete concept information including:
 * - Basic metadata
 * - Linked items
 * - Prerequisite relationships
 * - Quick actions
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'AdminConceptDetail' });

interface ConceptDetailPageProps {
  params: {
    id: string;
  };
}

export default function ConceptDetailPage({ params }: ConceptDetailPageProps) {
  const { data: concept, isLoading, error } = trpc.concept.getConcept.useQuery(
    { id: params.id },
    {
      onSuccess: (concept) => {
        logger.info('Concept loaded', {
          conceptId: concept.id,
          slug: concept.slug,
        });
      },
      onError: (error) => {
        logger.error('Failed to load concept', error, { conceptId: params.id });
      },
    }
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading concept...</p>
        </div>
      </div>
    );
  }

  if (error || !concept) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Concept not found</p>
          <Link href="/admin/concepts" className="text-sm underline mt-2 inline-block">
            ← Back to Concepts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link href="/admin/concepts" className="text-blue-600 hover:text-blue-800 mr-2">
            ← Back to Concepts
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{concept.name}</h1>
            <p className="text-sm text-gray-600 mt-1">{concept.slug}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/admin/concepts/${concept.id}/prerequisites`}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Manage Prerequisites
            </Link>
            <Link
              href={`/admin/concepts/${concept.id}/items`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Link Items
            </Link>
            <Link
              href={`/admin/concepts/${concept.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Linked Items</div>
          <div className="text-2xl font-bold text-gray-900">{concept.items.length}</div>
          {concept.items.length === 0 && (
            <div className="text-xs text-red-500 mt-1">⚠ No items linked</div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Prerequisites</div>
          <div className="text-2xl font-bold text-purple-600">{concept.prerequisites.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Dependents</div>
          <div className="text-2xl font-bold text-blue-600">{concept.dependents.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Study Time</div>
          <div className="text-2xl font-bold text-green-600">{concept.estimatedMinutes}</div>
          <div className="text-xs text-gray-500 mt-1">minutes</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{concept.description}</p>
          </div>

          {/* Linked Items */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Linked Items ({concept.items.length})</h3>
              <Link
                href={`/admin/concepts/${concept.id}/items`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Manage Items →
              </Link>
            </div>

            {concept.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No items linked to this concept yet.</p>
                <Link
                  href={`/admin/concepts/${concept.id}/items`}
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Link Items
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {concept.items.slice(0, 5).map((link) => (
                  <div
                    key={link.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 line-clamp-2">{link.item.stem}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{link.item.topic}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          link.isPrimary ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {link.isPrimary ? 'Primary' : 'Secondary'}
                        </span>
                        <span className="text-xs text-gray-500">Weight: {link.weight}</span>
                      </div>
                    </div>
                    <Link
                      href={`/admin/items/${link.item.id}/edit`}
                      className="ml-4 text-xs text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </div>
                ))}
                {concept.items.length > 5 && (
                  <Link
                    href={`/admin/concepts/${concept.id}/items`}
                    className="block text-center text-sm text-blue-600 hover:text-blue-800 pt-2"
                  >
                    View all {concept.items.length} items →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Metadata & Relationships */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Metadata</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Category</dt>
                <dd className="mt-1 text-sm text-gray-900">{concept.category}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Difficulty</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      concept.difficultyLevel === 'EASY'
                        ? 'bg-green-100 text-green-800'
                        : concept.difficultyLevel === 'MEDIUM'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {concept.difficultyLevel}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Jurisdiction</dt>
                <dd className="mt-1 text-sm text-gray-900">{concept.jurisdiction.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      concept.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {concept.isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Embedding</dt>
                <dd className="mt-1">
                  {concept.embedding ? (
                    <span className="text-xs text-green-600">✓ Generated</span>
                  ) : (
                    <span className="text-xs text-orange-600">⚠ Not generated</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* NEC References */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">NEC References</h3>
            <div className="space-y-2">
              {Array.isArray(concept.necArticleRefs) && concept.necArticleRefs.length > 0 ? (
                concept.necArticleRefs.map((ref, index) => (
                  <div key={index} className="px-3 py-2 bg-gray-50 rounded text-sm font-mono">
                    {ref}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No NEC references</p>
              )}
            </div>
          </div>

          {/* Prerequisites */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Prerequisites</h3>
              <Link
                href={`/admin/concepts/${concept.id}/prerequisites`}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Manage →
              </Link>
            </div>

            {concept.prerequisites.length === 0 ? (
              <p className="text-sm text-gray-500">No prerequisites</p>
            ) : (
              <div className="space-y-2">
                {concept.prerequisites.map((prereq) => (
                  <Link
                    key={prereq.id}
                    href={`/admin/concepts/${prereq.prerequisite.id}`}
                    className="block px-3 py-2 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">{prereq.prerequisite.name}</div>
                    <div className="text-xs text-gray-500">{prereq.prerequisite.category}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Dependents */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Dependent Concepts</h3>

            {concept.dependents.length === 0 ? (
              <p className="text-sm text-gray-500">No dependent concepts</p>
            ) : (
              <div className="space-y-2">
                {concept.dependents.map((dep) => (
                  <Link
                    key={dep.id}
                    href={`/admin/concepts/${dep.concept.id}`}
                    className="block px-3 py-2 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">{dep.concept.name}</div>
                    <div className="text-xs text-gray-500">{dep.concept.category}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
