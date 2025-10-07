/**
 * Concepts List Page
 *
 * Manage learning concepts - the foundation of personalized learning.
 * View, filter, and manage concepts with their items and prerequisites.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';
import { DifficultyLevel } from '@prisma/client';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'AdminConcepts' });

export default function ConceptsPage() {
  useEffect(() => {
    logger.info('Concepts page mounted');
  }, []);

  // Filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel | ''>('');
  const [hasItems, setHasItems] = useState<'all' | 'with' | 'without'>('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Fetch concepts with filters
  const { data, isLoading, error } = trpc.concept.listConcepts.useQuery(
    {
      search: search || undefined,
      category: category || undefined,
      difficulty: difficulty || undefined,
      hasItems: hasItems === 'all' ? undefined : hasItems === 'with',
      limit: pageSize,
      offset: page * pageSize,
    },
    {
      onSuccess: (data) => {
        logger.debug('Concepts fetched successfully', {
          conceptCount: data.concepts.length,
          total: data.total,
          page: page + 1,
          filters: { search, category, difficulty, hasItems },
        });
      },
      onError: (error) => {
        logger.error('Failed to fetch concepts', error, {
          filters: { search, category, difficulty, hasItems },
          page,
        });
      },
    }
  );

  // Fetch concept statistics
  const { data: stats } = trpc.concept.getConceptStats.useQuery(
    { jurisdictionId: 'ca-general-electrician' }, // TODO: Make dynamic
    {
      onSuccess: (stats) => {
        logger.debug('Concept stats loaded', stats);
      },
    }
  );

  // Delete mutation
  const deleteMutation = trpc.concept.deleteConcept.useMutation({
    onSuccess: (_, variables) => {
      logger.info('Concept deleted successfully', { conceptId: variables.id });
      window.location.reload();
    },
    onError: (error, variables) => {
      logger.error('Failed to delete concept', error, { conceptId: variables.id });
      alert(`Error: ${error.message}`);
    },
  });

  const handleDelete = (id: string, name: string) => {
    logger.info('Delete confirmation requested', { conceptId: id, name });

    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      logger.warn('User confirmed deletion', { conceptId: id });
      deleteMutation.mutate({ id });
    } else {
      logger.debug('User cancelled deletion', { conceptId: id });
    }
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="p-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Concepts</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage learning concepts and their prerequisites
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/concepts/graph"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            View Graph
          </Link>
          <Link
            href="/admin/concepts/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Concept
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600 mb-1">Total Concepts</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalConcepts}</div>
            <div className="text-xs text-gray-500 mt-1">{stats.activeConcepts} active</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600 mb-1">With Items</div>
            <div className="text-2xl font-bold text-green-600">{stats.conceptsWithItems}</div>
            <div className="text-xs text-red-500 mt-1">{stats.conceptsWithoutItems} without items</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600 mb-1">With Embeddings</div>
            <div className="text-2xl font-bold text-purple-600">{stats.conceptsWithEmbeddings}</div>
            <div className="text-xs text-orange-500 mt-1">{stats.conceptsWithoutEmbeddings} pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600 mb-1">With Prerequisites</div>
            <div className="text-2xl font-bold text-blue-600">{stats.conceptsWithPrerequisites}</div>
            <div className="text-xs text-gray-500 mt-1">{stats.conceptsWithoutPrerequisites} standalone</div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search concepts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Category..."
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(0);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value as DifficultyLevel | '');
              setPage(0);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
          <select
            value={hasItems}
            onChange={(e) => {
              setHasItems(e.target.value as 'all' | 'with' | 'without');
              setPage(0);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Concepts</option>
            <option value="with">With Items</option>
            <option value="without">Without Items</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        {data && (
          <>
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, data.total)} of {data.total} concepts
          </>
        )}
      </div>

      {/* Concepts Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading concepts...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600">Error loading concepts: {error.message}</p>
          </div>
        ) : data && data.concepts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No concepts found matching your filters.</p>
            <Link
              href="/admin/concepts/new"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Concept
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Concept
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prerequisites
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.concepts.map((concept) => (
                    <tr key={concept.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{concept.name}</div>
                        <div className="text-xs text-gray-500">{concept.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{concept.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {concept._count.items}
                          {concept._count.items === 0 && (
                            <span className="ml-2 text-red-500">⚠</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {concept._count.prerequisites} → {concept._count.dependents}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          {concept.estimatedMinutes} min
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Link
                          href={`/admin/concepts/${concept.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/concepts/${concept.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/concepts/${concept.id}/items`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Items
                        </Link>
                        <button
                          onClick={() => handleDelete(concept.id, concept.name)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deleteMutation.isLoading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
