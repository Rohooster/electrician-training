/**
 * Concept-Item Linking Interface
 *
 * Link items to concepts with:
 * - Multi-select items to link
 * - Bulk tag by topic or NEC article
 * - Primary/secondary concept designation
 * - Weight adjustment
 * - View current links
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';
import { DifficultyLevel, CognitiveType } from '@prisma/client';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'AdminConceptItems' });

interface ConceptItemsPageProps {
  params: {
    id: string;
  };
}

export default function ConceptItemsPage({ params }: ConceptItemsPageProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isPrimary, setIsPrimary] = useState(true);
  const [weight, setWeight] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [topic, setTopic] = useState('');
  const [cognitive, setCognitive] = useState<CognitiveType | ''>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel | ''>('');
  const [search, setSearch] = useState('');
  const [showLinked, setShowLinked] = useState<'all' | 'linked' | 'unlinked'>('unlinked');

  // Bulk tag states
  const [bulkTagTopic, setBulkTagTopic] = useState('');
  const [bulkTagNEC, setBulkTagNEC] = useState('');

  const utils = trpc.useContext();

  // Fetch concept
  const { data: concept } = trpc.concept.getConcept.useQuery({ id: params.id });

  // Fetch available items
  const { data: itemsData, isLoading } = trpc.admin.listItems.useQuery({
    topic: topic || undefined,
    cognitive: cognitive || undefined,
    difficulty: difficulty || undefined,
    search: search || undefined,
    limit: 100,
    offset: 0,
  });

  // Fetch topics
  const { data: topics } = trpc.admin.getTopics.useQuery({});

  // Link items mutation
  const linkMutation = trpc.concept.linkItems.useMutation({
    onSuccess: (data) => {
      logger.info('Items linked successfully', {
        conceptId: params.id,
        count: data.count,
      });
      setSuccess(`Successfully linked ${data.count} item(s)!`);
      setError(null);
      setSelectedItemIds(new Set());
      utils.concept.getConcept.invalidate({ id: params.id });
    },
    onError: (err) => {
      logger.error('Failed to link items', err);
      setError(err.message);
      setSuccess(null);
    },
  });

  // Unlink items mutation
  const unlinkMutation = trpc.concept.unlinkItems.useMutation({
    onSuccess: (data) => {
      logger.info('Items unlinked successfully', {
        conceptId: params.id,
        count: data.count,
      });
      setSuccess(`Successfully unlinked ${data.count} item(s)!`);
      setError(null);
      setSelectedItemIds(new Set());
      utils.concept.getConcept.invalidate({ id: params.id });
    },
    onError: (err) => {
      logger.error('Failed to unlink items', err);
      setError(err.message);
      setSuccess(null);
    },
  });

  // Bulk tag by topic mutation
  const bulkTagTopicMutation = trpc.concept.bulkTagByTopic.useMutation({
    onSuccess: (data) => {
      logger.info('Bulk tag by topic completed', {
        conceptId: params.id,
        topic: bulkTagTopic,
        count: data.count,
      });
      setSuccess(`Successfully linked ${data.count} item(s) with topic "${bulkTagTopic}"!`);
      setError(null);
      setBulkTagTopic('');
      utils.concept.getConcept.invalidate({ id: params.id });
    },
    onError: (err) => {
      logger.error('Failed to bulk tag by topic', err);
      setError(err.message);
      setSuccess(null);
    },
  });

  // Bulk tag by NEC mutation
  const bulkTagNECMutation = trpc.concept.bulkTagByNEC.useMutation({
    onSuccess: (data) => {
      logger.info('Bulk tag by NEC completed', {
        conceptId: params.id,
        necArticle: bulkTagNEC,
        count: data.count,
      });
      setSuccess(`Successfully linked ${data.count} item(s) with NEC article "${bulkTagNEC}"!`);
      setError(null);
      setBulkTagNEC('');
      utils.concept.getConcept.invalidate({ id: params.id });
    },
    onError: (err) => {
      logger.error('Failed to bulk tag by NEC', err);
      setError(err.message);
      setSuccess(null);
    },
  });

  const handleLinkSelected = () => {
    if (selectedItemIds.size === 0) {
      setError('Please select at least one item');
      return;
    }

    logger.info('Linking selected items', {
      conceptId: params.id,
      itemCount: selectedItemIds.size,
      isPrimary,
      weight,
    });

    linkMutation.mutate({
      conceptId: params.id,
      itemIds: Array.from(selectedItemIds),
      isPrimary,
      weight,
    });
  };

  const handleUnlinkSelected = () => {
    if (selectedItemIds.size === 0) {
      setError('Please select at least one item');
      return;
    }

    if (confirm(`Unlink ${selectedItemIds.size} item(s) from this concept?`)) {
      logger.warn('Unlinking selected items', {
        conceptId: params.id,
        itemCount: selectedItemIds.size,
      });

      unlinkMutation.mutate({
        conceptId: params.id,
        itemIds: Array.from(selectedItemIds),
      });
    }
  };

  const handleBulkTagByTopic = () => {
    if (!bulkTagTopic) {
      setError('Please enter a topic');
      return;
    }

    if (confirm(`Link ALL items with topic "${bulkTagTopic}" to this concept?`)) {
      logger.info('Bulk tagging by topic', {
        conceptId: params.id,
        topic: bulkTagTopic,
      });

      bulkTagTopicMutation.mutate({
        conceptId: params.id,
        topic: bulkTagTopic,
        isPrimary,
        weight,
      });
    }
  };

  const handleBulkTagByNEC = () => {
    if (!bulkTagNEC) {
      setError('Please enter a NEC article');
      return;
    }

    if (confirm(`Link ALL items referencing "${bulkTagNEC}" to this concept?`)) {
      logger.info('Bulk tagging by NEC', {
        conceptId: params.id,
        necArticle: bulkTagNEC,
      });

      bulkTagNECMutation.mutate({
        conceptId: params.id,
        necArticle: bulkTagNEC,
        isPrimary,
        weight,
      });
    }
  };

  const toggleItem = (itemId: string) => {
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItemIds(newSelection);
  };

  const toggleAll = () => {
    if (selectedItemIds.size === filteredItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  // Get linked item IDs
  const linkedItemIds = new Set(concept?.items.map((link) => link.itemId) || []);

  // Filter items based on showLinked setting
  const filteredItems = (itemsData?.items || []).filter((item) => {
    if (showLinked === 'linked') return linkedItemIds.has(item.id);
    if (showLinked === 'unlinked') return !linkedItemIds.has(item.id);
    return true;
  });

  if (!concept) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Link Items</h1>
        <p className="text-sm text-gray-600 mt-1">
          Connect exam questions to this concept ({concept.items.length} currently linked)
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Bulk Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Bulk Tag by Topic */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Bulk Tag by Topic</h3>
          <div className="flex space-x-2">
            <select
              value={bulkTagTopic}
              onChange={(e) => setBulkTagTopic(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            >
              <option value="">Select topic...</option>
              {topics?.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              onClick={handleBulkTagByTopic}
              disabled={!bulkTagTopic || bulkTagTopicMutation.isLoading}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Link All
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Links all items with this topic to the concept</p>
        </div>

        {/* Bulk Tag by NEC */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Bulk Tag by NEC Article</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={bulkTagNEC}
              onChange={(e) => setBulkTagNEC(e.target.value)}
              placeholder="e.g., 250.66"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
            <button
              onClick={handleBulkTagByNEC}
              disabled={!bulkTagNEC || bulkTagNECMutation.isLoading}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Link All
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Links all items referencing this NEC article</p>
        </div>
      </div>

      {/* Link Settings */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Primary Concept</span>
            </label>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Weight:</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 1.0)}
                min="0"
                max="1"
                step="0.1"
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {selectedItemIds.size} item(s) selected
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg"
          />
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg"
          >
            <option value="">All Topics</option>
            {topics?.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={cognitive}
            onChange={(e) => setCognitive(e.target.value as CognitiveType | '')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg"
          >
            <option value="">All Types</option>
            <option value="LOOKUP">Lookup</option>
            <option value="CALC">Calculation</option>
            <option value="THEORY">Theory</option>
            <option value="APPLIED">Applied</option>
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyLevel | '')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
          <select
            value={showLinked}
            onChange={(e) => setShowLinked(e.target.value as 'all' | 'linked' | 'unlinked')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg"
          >
            <option value="unlinked">Unlinked Only</option>
            <option value="linked">Linked Only</option>
            <option value="all">All Items</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedItemIds.size === filteredItems.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm text-gray-600">
              Showing {filteredItems.length} items
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLinkSelected}
              disabled={selectedItemIds.size === 0 || linkMutation.isLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Link Selected
            </button>
            <button
              onClick={handleUnlinkSelected}
              disabled={selectedItemIds.size === 0 || unlinkMutation.isLoading}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Unlink Selected
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No items found matching your filters
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  linkedItemIds.has(item.id) ? 'bg-green-50' : ''
                }`}
                onClick={() => toggleItem(item.id)}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedItemIds.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 line-clamp-2">{item.stem}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{item.topic}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{item.cognitive}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.difficulty === 'EASY'
                          ? 'bg-green-100 text-green-700'
                          : item.difficulty === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.difficulty}
                      </span>
                      {linkedItemIds.has(item.id) && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          ✓ Linked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
