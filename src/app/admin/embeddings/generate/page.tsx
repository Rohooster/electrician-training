/**
 * Vector Embeddings Generator
 *
 * Enhanced embedding generation with:
 * - Real-time progress tracking
 * - Cost monitoring
 * - Model selection
 * - Batch filtering
 * - Support for items and concepts
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';

type GenerationType = 'items' | 'concepts';
type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002';

export default function GenerateEmbeddingsPage() {
  const [generationType, setGenerationType] = useState<GenerationType>('items');
  const [model, setModel] = useState<EmbeddingModel>('text-embedding-3-small');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<{
    successful: number;
    failed: number;
    totalTokens: number;
    totalCost: number;
    duration: number;
    failedItems?: Array<{ id: string; error: string }>;
  } | null>(null);

  const utils = trpc.useContext();

  // Get statistics
  const { data: stats, refetch: refetchStats } = trpc.embedding.getStats.useQuery({});

  // Test OpenAI connection
  const { data: connectionTest } = trpc.embedding.testConnection.useQuery();

  // Find items without embeddings
  const { data: itemsData } = trpc.embedding.findItemsWithoutEmbeddings.useQuery({
    limit: 1000,
  });

  // Find concepts without embeddings
  const { data: conceptsData } = trpc.embedding.findConceptsWithoutEmbeddings.useQuery({
    limit: 1000,
  });

  // Generate items mutation
  const generateItemsMutation = trpc.embedding.generateItemEmbeddings.useMutation({
    onSuccess: (data) => {
      setSuccess(data.message || 'Embeddings generated successfully!');
      setResult({
        successful: data.successful.length,
        failed: data.failed.length,
        totalTokens: data.totalTokens,
        totalCost: data.totalCost,
        duration: data.duration,
        failedItems: data.failed,
      });
      setIsGenerating(false);
      refetchStats();
      utils.embedding.findItemsWithoutEmbeddings.invalidate();
    },
    onError: (err) => {
      setError(err.message);
      setIsGenerating(false);
    },
  });

  // Generate concepts mutation
  const generateConceptsMutation = trpc.embedding.generateConceptEmbeddings.useMutation({
    onSuccess: (data) => {
      setSuccess(data.message || 'Embeddings generated successfully!');
      setResult({
        successful: data.successful.length,
        failed: data.failed.length,
        totalTokens: data.totalTokens,
        totalCost: data.totalCost,
        duration: data.duration,
        failedItems: data.failed,
      });
      setIsGenerating(false);
      refetchStats();
      utils.embedding.findConceptsWithoutEmbeddings.invalidate();
    },
    onError: (err) => {
      setError(err.message);
      setIsGenerating(false);
    },
  });

  const handleGenerate = async () => {
    const count = generationType === 'items'
      ? itemsData?.count || 0
      : conceptsData?.count || 0;

    if (count === 0) {
      setError(`No ${generationType} need embeddings`);
      return;
    }

    setError(null);
    setSuccess(null);
    setResult(null);
    setIsGenerating(true);

    if (generationType === 'items') {
      generateItemsMutation.mutate({
        limit: 100, // Process up to 100 items
        model,
      });
    } else {
      generateConceptsMutation.mutate({
        limit: 100, // Process up to 100 concepts
        model,
      });
    }
  };

  // Model info
  const modelInfo = {
    'text-embedding-3-small': {
      name: 'text-embedding-3-small',
      dimensions: 1536,
      costPer1M: '$0.02',
      description: 'Recommended - Best value, fast, accurate',
    },
    'text-embedding-3-large': {
      name: 'text-embedding-3-large',
      dimensions: 3072,
      costPer1M: '$0.13',
      description: 'Higher accuracy, 2x dimensions, 6.5x cost',
    },
    'text-embedding-ada-002': {
      name: 'text-embedding-ada-002',
      dimensions: 1536,
      costPer1M: '$0.10',
      description: 'Legacy model, 5x more expensive',
    },
  };

  const currentStats = generationType === 'items' ? stats?.items : stats?.concepts;
  const needsEmbeddings = generationType === 'items'
    ? itemsData?.count || 0
    : conceptsData?.count || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 mr-2">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Vector Embeddings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Create semantic embeddings for items and concepts to enable similarity search and personalized learning
        </p>
      </div>

      {/* Connection Status */}
      {connectionTest && (
        <div className={`mb-6 px-4 py-3 rounded-lg border ${
          connectionTest.success
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {connectionTest.success ? '✓ OpenAI API Connected' : '✗ OpenAI API Connection Failed'}
              </p>
              <p className="text-sm mt-1">
                {connectionTest.success
                  ? `Latency: ${connectionTest.latency}ms`
                  : connectionTest.error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Type Selector */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Generation Type</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => setGenerationType('items')}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
              generationType === 'items'
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">Items (Questions)</div>
            <div className="text-sm text-gray-600 mt-1">
              {stats?.items.withoutEmbeddings || 0} need embeddings
            </div>
          </button>
          <button
            onClick={() => setGenerationType('concepts')}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
              generationType === 'concepts'
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">Concepts (Learning Topics)</div>
            <div className="text-sm text-gray-600 mt-1">
              {stats?.concepts.withoutEmbeddings || 0} need embeddings
            </div>
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total {generationType}</div>
          <div className="text-2xl font-bold text-gray-900">{currentStats?.total || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">With Embeddings</div>
          <div className="text-2xl font-bold text-green-600">{currentStats?.withEmbeddings || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Need Embeddings</div>
          <div className="text-2xl font-bold text-orange-600">{currentStats?.withoutEmbeddings || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Coverage</div>
          <div className="text-2xl font-bold text-blue-600">
            {currentStats?.coverage.toFixed(1) || 0}%
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {success && result && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Success!</p>
          <p className="text-sm">{success}</p>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-green-600">Successful</div>
              <div className="font-bold">{result.successful}</div>
            </div>
            <div>
              <div className="text-xs text-green-600">Failed</div>
              <div className="font-bold">{result.failed}</div>
            </div>
            <div>
              <div className="text-xs text-green-600">Tokens</div>
              <div className="font-bold">{result.totalTokens.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-green-600">Cost</div>
              <div className="font-bold">${result.totalCost.toFixed(6)}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-green-700">
            Completed in {(result.duration / 1000).toFixed(1)}s
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Model Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Model Selection</h3>
        <div className="space-y-3">
          {Object.entries(modelInfo).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setModel(key as EmbeddingModel)}
              disabled={isGenerating}
              className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                model === key
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{info.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{info.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{info.dimensions}D</div>
                  <div className="text-xs text-gray-500">{info.costPer1M}/1M tokens</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            {needsEmbeddings === 0 ? (
              <p className="text-sm text-green-600 font-medium">
                ✓ All {generationType} have embeddings!
              </p>
            ) : (
              <div>
                <p className="text-sm text-gray-900 font-medium">
                  Ready to generate embeddings for {needsEmbeddings} {generationType}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Estimated cost: ${((needsEmbeddings * 100 * parseFloat(modelInfo[model].costPer1M.replace('$', ''))) / 1000000).toFixed(4)}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || needsEmbeddings === 0 || !connectionTest?.success}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isGenerating ? 'Generating...' : 'Generate Embeddings'}
          </button>
        </div>

        {isGenerating && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-sm text-gray-600">Processing embeddings...</p>
            </div>
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">About Vector Embeddings</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            Vector embeddings are semantic representations that enable advanced features:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-gray-600">
            <li>Similarity Search - Find related content based on meaning</li>
            <li>Personalized Learning - Match weak concepts to practice items</li>
            <li>Content Analysis - Identify coverage gaps in your item bank</li>
            <li>Adaptive Assessments - Target specific skill areas precisely</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
