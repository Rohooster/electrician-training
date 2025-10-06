/**
 * Code Panel Component
 *
 * Simulates open-book exam code access. Provides:
 * - Searchable NEC/CEC article index
 * - Quick navigation to common articles
 * - Telemetry tracking (time spent, articles accessed)
 *
 * Note: Does NOT contain copyrighted NEC text. Shows only article
 * numbers and structure. Users must have their own code books.
 */

'use client';

import { useState } from 'react';

interface CodePanelProps {
  isOpen: boolean;
  onClose: () => void;
  codeBooks: string[]; // e.g., ["NEC 2020", "CEC 2022"]
}

export function CodePanel({ isOpen, onClose, codeBooks }: CodePanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(codeBooks[0] || 'NEC 2020');

  if (!isOpen) return null;

  // Common NEC articles for quick access
  const commonArticles = [
    { number: '90', title: 'Introduction' },
    { number: '100', title: 'Definitions' },
    { number: '110', title: 'General Requirements' },
    { number: '210', title: 'Branch Circuits' },
    { number: '220', title: 'Branch-Circuit, Feeder, and Service Load Calculations' },
    { number: '240', title: 'Overcurrent Protection' },
    { number: '250', title: 'Grounding and Bonding' },
    { number: '310', title: 'Conductors for General Wiring' },
    { number: '314', title: 'Outlet, Device, Pull, and Junction Boxes' },
    { number: '430', title: 'Motors, Motor Circuits, and Controllers' },
    { number: '450', title: 'Transformers' },
    { number: 'Chapter 9', title: 'Tables (Conduit Fill, etc.)' },
  ];

  const filteredArticles = commonArticles.filter(
    (article) =>
      article.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleArticleClick = (articleNumber: string) => {
    console.log(`[CodePanel] User navigated to Article ${articleNumber}`);
    // In production, this would log telemetry for analytics
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Code Reference</h2>
            <p className="text-sm text-blue-100 mt-1">
              Quick access to NEC/CEC articles
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            aria-label="Close code panel"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Code Book Selector */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code Book
          </label>
          <select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {codeBooks.map((book) => (
              <option key={book} value={book}>
                {book}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search articles... (e.g., '310', 'grounding')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Article List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            COMMON ARTICLES
          </h3>
          <div className="space-y-2">
            {filteredArticles.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                No articles found. Try a different search term.
              </p>
            ) : (
              filteredArticles.map((article) => (
                <button
                  key={article.number}
                  onClick={() => handleArticleClick(article.number)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-blue-600">
                        Article {article.number}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {article.title}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer Notice */}
        <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-200">
          <div className="flex">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-yellow-800">
              This panel shows article <strong>numbers and titles only</strong>.
              Refer to your physical NEC/CEC code book for full text and tables.
              No copyrighted material is displayed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
