/**
 * Prerequisite Relationship Manager
 *
 * Manage concept prerequisites with:
 * - Add/remove prerequisite relationships
 * - Cycle detection (prevents circular dependencies)
 * - View full prerequisite chain
 * - Validate graph integrity
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'AdminPrerequisites' });

interface PrerequisiteManagerProps {
  params: {
    id: string;
  };
}

export default function PrerequisiteManagerPage({ params }: PrerequisiteManagerProps) {
  const [selectedPrereqId, setSelectedPrereqId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const utils = trpc.useContext();

  // Fetch current concept
  const { data: concept, isLoading: conceptLoading } = trpc.concept.getConcept.useQuery(
    { id: params.id },
    {
      onSuccess: (concept) => {
        logger.info('Concept loaded for prerequisite management', {
          conceptId: concept.id,
          slug: concept.slug,
          prerequisiteCount: concept.prerequisites.length,
        });
      },
    }
  );

  // Fetch all concepts for selection
  const { data: allConceptsData } = trpc.concept.listConcepts.useQuery({
    limit: 1000, // Get all concepts
    offset: 0,
  });

  // Fetch prerequisite chain
  const { data: prerequisiteChain } = trpc.concept.getPrerequisiteChain.useQuery(
    { conceptId: params.id },
    { enabled: !!concept }
  );

  // Add prerequisite mutation
  const addPrereqMutation = trpc.concept.addPrerequisite.useMutation({
    onSuccess: () => {
      logger.info('Prerequisite added successfully', {
        conceptId: params.id,
        prerequisiteId: selectedPrereqId,
      });
      setSuccess('Prerequisite added successfully!');
      setError(null);
      setSelectedPrereqId('');
      utils.concept.getConcept.invalidate({ id: params.id });
      utils.concept.getPrerequisiteChain.invalidate({ conceptId: params.id });
    },
    onError: (err) => {
      logger.error('Failed to add prerequisite', err, {
        conceptId: params.id,
        prerequisiteId: selectedPrereqId,
      });
      setError(err.message);
      setSuccess(null);
    },
  });

  // Remove prerequisite mutation
  const removePrereqMutation = trpc.concept.removePrerequisite.useMutation({
    onSuccess: (_, variables) => {
      logger.info('Prerequisite removed successfully', variables);
      setSuccess('Prerequisite removed successfully!');
      setError(null);
      utils.concept.getConcept.invalidate({ id: params.id });
      utils.concept.getPrerequisiteChain.invalidate({ conceptId: params.id });
    },
    onError: (err, variables) => {
      logger.error('Failed to remove prerequisite', err, variables);
      setError(err.message);
      setSuccess(null);
    },
  });

  const handleAddPrerequisite = () => {
    if (!selectedPrereqId) {
      setError('Please select a prerequisite concept');
      return;
    }

    logger.info('Adding prerequisite', {
      conceptId: params.id,
      prerequisiteId: selectedPrereqId,
    });

    addPrereqMutation.mutate({
      conceptId: params.id,
      prerequisiteId: selectedPrereqId,
    });
  };

  const handleRemovePrerequisite = (prerequisiteId: string) => {
    if (confirm('Remove this prerequisite relationship?')) {
      logger.warn('Removing prerequisite', {
        conceptId: params.id,
        prerequisiteId,
      });

      removePrereqMutation.mutate({
        conceptId: params.id,
        prerequisiteId,
      });
    }
  };

  if (conceptLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Concept not found</p>
        </div>
      </div>
    );
  }

  // Filter out current concept and existing prerequisites from selection
  const existingPrereqIds = new Set([
    concept.id, // Can't be prerequisite of itself
    ...concept.prerequisites.map((p) => p.prerequisiteId),
  ]);

  const availablePrerequisites = allConceptsData?.concepts.filter(
    (c) => !existingPrereqIds.has(c.id)
  ) || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link
            href={`/admin/concepts/${concept.id}`}
            className="text-blue-600 hover:text-blue-800 mr-2"
          >
            ← Back to {concept.name}
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Prerequisites</h1>
        <p className="text-sm text-gray-600 mt-1">
          Define which concepts must be mastered before studying {concept.name}
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <p className="text-sm">{success}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Add Prerequisite */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Prerequisite */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Prerequisite</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select prerequisite concept
                </label>
                <select
                  value={selectedPrereqId}
                  onChange={(e) => setSelectedPrereqId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select a concept --</option>
                  {availablePrerequisites.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  This concept will need to be mastered before students can learn "{concept.name}"
                </p>
              </div>

              <button
                onClick={handleAddPrerequisite}
                disabled={!selectedPrereqId || addPrereqMutation.isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addPrereqMutation.isLoading ? 'Adding...' : 'Add Prerequisite'}
              </button>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 mb-2 font-medium">⚡ Cycle Detection</p>
              <p className="text-xs text-yellow-700">
                The system automatically prevents circular dependencies. If adding this prerequisite
                would create a cycle (A requires B requires C requires A), it will be rejected.
              </p>
            </div>
          </div>

          {/* Current Prerequisites */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Current Prerequisites ({concept.prerequisites.length})
            </h3>

            {concept.prerequisites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No prerequisites defined for this concept.</p>
                <p className="text-xs mt-2">
                  This is a foundational concept that can be learned without prior knowledge.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {concept.prerequisites.map((prereq) => (
                  <div
                    key={prereq.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <Link
                        href={`/admin/concepts/${prereq.prerequisite.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {prereq.prerequisite.name}
                      </Link>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{prereq.prerequisite.category}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {prereq.prerequisite.slug}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePrerequisite(prereq.prerequisiteId)}
                      disabled={removePrereqMutation.isLoading}
                      className="ml-4 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Prerequisite Chain & Info */}
        <div className="space-y-6">
          {/* Prerequisite Chain */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Full Prerequisite Chain</h3>

            {prerequisiteChain && prerequisiteChain.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 mb-3">
                  Students must master these concepts in order:
                </p>
                {prerequisiteChain.map((c, index) => (
                  <div key={c.id} className="relative">
                    {index > 0 && (
                      <div className="absolute left-4 -top-2 w-0.5 h-4 bg-gray-300" />
                    )}
                    <div
                      className={`flex items-center space-x-2 p-2 rounded ${
                        c.id === concept.id
                          ? 'bg-blue-100 border border-blue-300'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          c.id === concept.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-700'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.category}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                This concept has no prerequisites. It's a foundational concept.
              </p>
            )}
          </div>

          {/* Dependent Concepts */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Dependent Concepts ({concept.dependents.length})
            </h3>

            <p className="text-xs text-gray-600 mb-3">
              These concepts require mastery of "{concept.name}":
            </p>

            {concept.dependents.length === 0 ? (
              <p className="text-sm text-gray-500">
                No concepts depend on this one. This is a leaf node.
              </p>
            ) : (
              <div className="space-y-2">
                {concept.dependents.map((dep) => (
                  <Link
                    key={dep.id}
                    href={`/admin/concepts/${dep.concept.id}`}
                    className="block p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-xs font-medium text-gray-900">{dep.concept.name}</div>
                    <div className="text-xs text-gray-500">{dep.concept.category}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2 font-medium">💡 Best Practices</p>
            <ul className="text-xs text-blue-700 space-y-2">
              <li>• Only add direct prerequisites, not transitive ones</li>
              <li>• Keep the graph shallow (max 3-4 levels deep)</li>
              <li>• Prerequisites should represent actual learning dependencies</li>
              <li>• Test the learning path from a student's perspective</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
