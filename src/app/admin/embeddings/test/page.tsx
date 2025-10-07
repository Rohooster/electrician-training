/**
 * Similarity Search Tester
 *
 * Test and explore embedding similarity search:
 * - Find similar items
 * - Find similar concepts
 * - Find items for concepts (personalized learning)
 * - Find concepts for items (auto-tagging)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';

type SearchType = 'item-to-items' | 'concept-to-concepts' | 'concept-to-items' | 'item-to-concepts';

export default function SimilarityTestPage() {
  const [searchType, setSearchType] = useState<SearchType>('item-to-items');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedConceptId, setSelectedConceptId] = useState('');
  const [minSimilarity, setMinSimilarity] = useState(0.5);
  const [limit, setLimit] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch items for selection
  const { data: itemsData } = trpc.admin.listItems.useQuery({
    limit: 100,
    isActive: true,
  });

  // Fetch concepts for selection
  const { data: conceptsData } = trpc.concept.listConcepts.useQuery({
    limit: 100,
  });

  // Similarity queries
  const { data: similarItems, isLoading: loadingItems, refetch: refetchSimilarItems } =
    trpc.embedding.findSimilarItems.useQuery(
      { itemId: selectedItemId, limit, minSimilarity },
      { enabled: false }
    );

  const { data: similarConcepts, isLoading: loadingConcepts, refetch: refetchSimilarConcepts } =
    trpc.embedding.findSimilarConcepts.useQuery(
      { conceptId: selectedConceptId, limit, minSimilarity },
      { enabled: false }
    );

  const { data: itemsForConcept, isLoading: loadingItemsForConcept, refetch: refetchItemsForConcept } =
    trpc.embedding.findItemsForConcept.useQuery(
      { conceptId: selectedConceptId, limit, minSimilarity },
      { enabled: false }
    );

  const { data: conceptsForItem, isLoading: loadingConceptsForItem, refetch: refetchConceptsForItem } =
    trpc.embedding.findConceptsForItem.useQuery(
      { itemId: selectedItemId, limit, minSimilarity },
      { enabled: false }
    );

  const handleSearch = () => {
    setHasSearched(true);

    switch (searchType) {
      case 'item-to-items':
        if (selectedItemId) refetchSimilarItems();
        break;
      case 'concept-to-concepts':
        if (selectedConceptId) refetchSimilarConcepts();
        break;
      case 'concept-to-items':
        if (selectedConceptId) refetchItemsForConcept();
        break;
      case 'item-to-concepts':
        if (selectedItemId) refetchConceptsForItem();
        break;
    }
  };

  const isLoading =
    loadingItems || loadingConcepts || loadingItemsForConcept || loadingConceptsForItem;

  const results =
    searchType === 'item-to-items'
      ? similarItems
      : searchType === 'concept-to-concepts'
      ? similarConcepts
      : searchType === 'concept-to-items'
      ? itemsForConcept
      : conceptsForItem;

  const canSearch =
    (searchType.startsWith('item') && selectedItemId) ||
    (searchType.startsWith('concept') && selectedConceptId);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 mr-2">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Similarity Search Tester</h1>
        <p className="text-sm text-gray-600 mt-1">
          Test embedding similarity search to explore relationships between items and concepts
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Search Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search Type */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Search Type</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSearchType('item-to-items')}
                className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                  searchType === 'item-to-items'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">Item → Similar Items</div>
                <div className="text-xs text-gray-500 mt-1">Find questions like this one</div>
              </button>

              <button
                onClick={() => setSearchType('concept-to-concepts')}
                className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                  searchType === 'concept-to-concepts'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">Concept → Similar Concepts</div>
                <div className="text-xs text-gray-500 mt-1">Find related learning topics</div>
              </button>

              <button
                onClick={() => setSearchType('concept-to-items')}
                className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                  searchType === 'concept-to-items'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">Concept → Matching Items</div>
                <div className="text-xs text-gray-500 mt-1">Find practice questions for concept</div>
              </button>

              <button
                onClick={() => setSearchType('item-to-concepts')}
                className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                  searchType === 'item-to-concepts'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">Item → Suggested Concepts</div>
                <div className="text-xs text-gray-500 mt-1">Auto-tag suggestions</div>
              </button>
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Parameters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Similarity
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={minSimilarity}
                  onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.0</span>
                  <span className="font-medium text-gray-900">{minSimilarity.toFixed(2)}</span>
                  <span>1.0</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Selection */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {searchType.startsWith('item') ? 'Select Item' : 'Select Concept'}
            </h3>

            {searchType.startsWith('item') ? (
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-- Select an item --</option>
                {itemsData?.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.stem.substring(0, 60)}...
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedConceptId}
                onChange={(e) => setSelectedConceptId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-- Select a concept --</option>
                {conceptsData?.concepts.map((concept) => (
                  <option key={concept.id} value={concept.id}>
                    {concept.name} ({concept.category})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleSearch}
              disabled={!canSearch || isLoading}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Results</h3>

            {!hasSearched ? (
              <div className="text-center py-12 text-gray-500">
                <p>Select a search type and source, then click Search to see results</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Calculating similarities...</p>
              </div>
            ) : !results || results.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No results found</p>
                <p className="text-xs mt-2">Try lowering the minimum similarity threshold</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          {result.item && (
                            <div className="text-sm text-gray-900 font-medium">
                              {result.item.stem.substring(0, 100)}...
                            </div>
                          )}
                          {result.concept && (
                            <div className="text-sm text-gray-900 font-medium">
                              {result.concept.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-600">
                          {(result.similarity * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">similarity</div>
                      </div>
                    </div>

                    {/* Similarity Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full ${
                          result.similarity > 0.8
                            ? 'bg-green-600'
                            : result.similarity > 0.6
                            ? 'bg-blue-600'
                            : 'bg-yellow-600'
                        }`}
                        style={{ width: `${result.similarity * 100}%` }}
                      />
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      {result.item && (
                        <>
                          <span>{result.item.topic}</span>
                          <span>•</span>
                          <span>{result.item.difficulty}</span>
                          {result.item.necArticleRefs && (
                            <>
                              <span>•</span>
                              <span>NEC: {(result.item.necArticleRefs as string[]).slice(0, 2).join(', ')}</span>
                            </>
                          )}
                        </>
                      )}
                      {result.concept && (
                        <>
                          <span>{result.concept.category}</span>
                          <span>•</span>
                          <span className="line-clamp-1">{result.concept.description.substring(0, 100)}...</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2 font-medium">💡 Understanding Similarity Scores</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• <strong>90-100%:</strong> Nearly identical content</li>
              <li>• <strong>70-90%:</strong> Highly related, same topic</li>
              <li>• <strong>50-70%:</strong> Moderately related, overlapping concepts</li>
              <li>• <strong>&lt;50%:</strong> Loosely related or different topics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
