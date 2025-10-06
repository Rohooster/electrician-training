/**
 * Navigation Tree Component
 *
 * Interactive NEC code navigation simulator.
 * Displays hierarchical tree structure and tracks user's path.
 *
 * Features:
 * - Breadcrumb trail showing current path
 * - Click to navigate deeper into tree
 * - Back button to go up levels
 * - Visual indicators for article types
 * - Responsive grid layout
 */

'use client';

import { NEC_TREE, type NECNode } from '@/lib/trainer/nec-tree';

interface NavigationTreeProps {
  currentNode: NECNode | null;
  breadcrumb: NECNode[];
  onNavigate: (node: NECNode) => void;
  onBack: () => void;
}

export function NavigationTree({
  currentNode,
  breadcrumb,
  onNavigate,
  onBack,
}: NavigationTreeProps) {
  // Determine what to display: root level or current node's children
  const displayNodes = currentNode?.children
    ? Object.values(currentNode.children)
    : Object.values(NEC_TREE);

  // Sort nodes for consistent display
  const sortedNodes = [...displayNodes].sort((a, b) =>
    a.label.localeCompare(b.label)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Breadcrumb Trail */}
      {breadcrumb.length > 0 && (
        <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={onBack}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Go back"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <nav className="flex items-center space-x-2 overflow-x-auto">
              <span className="text-gray-500 shrink-0">Start</span>
              {breadcrumb.map((node, idx) => (
                <div key={node.id} className="flex items-center space-x-2 shrink-0">
                  <svg
                    className="w-4 h-4 text-gray-400"
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
                  <span
                    className={`${
                      idx === breadcrumb.length - 1
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-600'
                    }`}
                  >
                    {node.label.length > 40
                      ? node.label.substring(0, 40) + '...'
                      : node.label}
                  </span>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Node Grid */}
      <div className="p-4">
        <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
          {sortedNodes.map((node) => (
            <NodeCard key={node.id} node={node} onClick={() => onNavigate(node)} />
          ))}
        </div>

        {sortedNodes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No further navigation available at this level.</p>
            <p className="text-sm mt-2">
              This may be the target article you're looking for!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual node card for navigation
 */
function NodeCard({ node, onClick }: { node: NECNode; onClick: () => void }) {
  const hasChildren = node.children && Object.keys(node.children).length > 0;

  // Get icon based on node type
  const getIcon = () => {
    switch (node.type) {
      case 'index':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
      case 'chapter':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'article':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'section':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'table':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z"
              clipRule="evenodd"
            />
            <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
          </svg>
        );
    }
  };

  // Color scheme based on node type
  const getColorScheme = () => {
    switch (node.type) {
      case 'index':
        return 'border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-purple-700';
      case 'chapter':
        return 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700';
      case 'article':
        return 'border-green-200 hover:border-green-400 hover:bg-green-50 text-green-700';
      case 'section':
        return 'border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50 text-yellow-700';
      case 'table':
        return 'border-red-200 hover:border-red-400 hover:bg-red-50 text-red-700';
      default:
        return 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-lg border-2 transition-all
        ${getColorScheme()}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1 min-w-0">
          <div className="mt-0.5 mr-3 shrink-0">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium mb-1 break-words">{node.label}</div>
            {node.articleRef && (
              <div className="text-xs font-mono bg-white px-2 py-1 rounded border inline-block">
                {node.articleRef}
              </div>
            )}
          </div>
        </div>

        {hasChildren && (
          <svg
            className="w-5 h-5 ml-2 shrink-0 opacity-50"
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
        )}
      </div>
    </button>
  );
}
