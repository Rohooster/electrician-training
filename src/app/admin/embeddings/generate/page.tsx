/**
 * Vector Embeddings Generator
 *
 * Batch generate OpenAI embeddings for items that don't have them yet.
 * Uses text-embedding-ada-002 model (1536 dimensions).
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';

export default function GenerateEmbeddingsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{
    total: number;
    processed: number;
    errors: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get items without embeddings
  const { data: stats, refetch: refetchStats } = trpc.admin.getEmbeddingStats.useQuery();

  // Generate embeddings mutation
  const generateMutation = trpc.admin.generateEmbeddings.useMutation({
    onSuccess: (result) => {
      setSuccess(`Successfully generated ${result.count} embeddings!`);
      setIsGenerating(false);
      refetchStats();
    },
    onError: (err) => {
      setError(err.message);
      setIsGenerating(false);
    },
  });

  const handleGenerate = async () => {
    if (!stats?.itemsWithoutEmbeddings || stats.itemsWithoutEmbeddings === 0) {
      setError('No items need embeddings');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsGenerating(true);
    setProgress({
      total: stats.itemsWithoutEmbeddings,
      processed: 0,
      errors: 0,
    });

    generateMutation.mutate({
      batchSize: 50,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 mr-2">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Vector Embeddings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Create semantic embeddings for items to enable similarity search and personalized learning
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-600 mb-1">Total Items</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.totalItems || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-600 mb-1">With Embeddings</div>
          <div className="text-3xl font-bold text-green-600">{stats?.itemsWithEmbeddings || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-600 mb-1">Need Embeddings</div>
          <div className="text-3xl font-bold text-orange-600">{stats?.itemsWithoutEmbeddings || 0}</div>
        </div>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Success!</p>
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Progress */}
      {isGenerating && progress && (
        <div className="mb-6 bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-blue-800">Generating embeddings...</p>
            <span className="text-sm text-blue-700">
              {progress.processed} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.processed / progress.total) * 100}%` }}
            />
          </div>
          {progress.errors > 0 && (
            <p className="text-sm text-red-600 mt-2">{progress.errors} errors encountered</p>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">About Vector Embeddings</h2>
        <div className="space-y-4 text-sm text-gray-700 mb-6">
          <p>
            Vector embeddings are semantic representations of question content that enable:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Similarity Search:</strong> Find related questions based on meaning, not just keywords
            </li>
            <li>
              <strong>Personalized Learning:</strong> Match weak concepts to relevant practice items
            </li>
            <li>
              <strong>Content Gaps Analysis:</strong> Identify under-covered topics in your item bank
            </li>
            <li>
              <strong>Adaptive Assessments:</strong> Select items that target specific skill areas
            </li>
          </ul>
          <p className="bg-gray-50 border border-gray-200 rounded p-3 mt-4">
            <strong>Model:</strong> OpenAI text-embedding-ada-002 (1536 dimensions)
            <br />
            <strong>Source:</strong> Combines question stem + explanation for best semantic representation
            <br />
            <strong>Cost:</strong> ~$0.0001 per item (very low)
          </p>
        </div>

        {/* Generate Button */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div>
            {stats?.itemsWithoutEmbeddings === 0 ? (
              <p className="text-sm text-green-600 font-medium">✓ All items have embeddings!</p>
            ) : (
              <p className="text-sm text-gray-600">
                Ready to generate embeddings for {stats?.itemsWithoutEmbeddings} items
              </p>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || stats?.itemsWithoutEmbeddings === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Embeddings'}
          </button>
        </div>
      </div>

      {/* Advanced Options (Placeholder) */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Advanced Options</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Regenerate embeddings for items with outdated model versions</p>
          <p>• Batch process by jurisdiction or topic</p>
          <p>• Export embeddings for external analysis</p>
          <p className="text-xs text-gray-500 mt-4">These features will be available in a future update.</p>
        </div>
      </div>
    </div>
  );
}
