/**
 * Drill Results Page
 *
 * Shows performance analysis after completing a drill.
 * Displays accuracy, time, efficiency, and study recommendations.
 *
 * Features:
 * - Correct/incorrect visual feedback
 * - Navigation path review
 * - Time comparison with optimal
 * - Study recommendations based on performance
 * - Quick action buttons (retry, new drill, history)
 */

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';
import { getOptimalPathLength } from '@/lib/trainer/nec-tree';

interface PageProps {
  params: Promise<{
    drillId: string;
  }>;
}

export default function DrillResultsPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();

  console.log('[DrillResults] Loading results for:', params.drillId);

  // Fetch drill results
  const { data: drill, isLoading } = trpc.trainer.getDrill.useQuery({
    drillId: params.drillId,
  });

  if (isLoading || !drill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (drill.status !== 'COMPLETED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">This drill is not yet completed.</p>
          <Link
            href={`/trainer/${drill.id}`}
            className="mt-4 inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Continue Drill
          </Link>
        </div>
      </div>
    );
  }

  const navigationPath = (drill.navigationPath as string[]) || [];
  const optimalPathLength = getOptimalPathLength(drill.targetArticle);
  const optimalTime = optimalPathLength * 10; // ~10 seconds per click is ideal

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Drill Results</h1>
            <Link
              href="/trainer"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ← Back to Trainer
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Overall Result Banner */}
        <div
          className={`rounded-lg shadow-lg p-8 mb-8 ${
            drill.isCorrect
              ? 'bg-gradient-to-r from-green-500 to-green-600'
              : 'bg-gradient-to-r from-red-500 to-red-600'
          }`}
        >
          <div className="text-center text-white">
            <div className="text-6xl mb-4">
              {drill.isCorrect ? '✓' : '✗'}
            </div>
            <h2 className="text-3xl font-bold mb-2">
              {drill.isCorrect ? 'Correct!' : 'Incorrect'}
            </h2>
            <p className="text-lg opacity-90">
              {drill.isCorrect
                ? 'You successfully found the target article.'
                : `You were ${drill.articleMissBy} article${
                    drill.articleMissBy === 1 ? '' : 's'
                  } away from the target.`}
            </p>
          </div>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Time */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Time Taken</div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {drill.timeSpentSeconds}s
            </div>
            <div className="text-xs text-gray-500">
              Optimal: ~{optimalTime}s
            </div>
            <div className="mt-3">
              {drill.timeSpentSeconds! <= optimalTime ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  Excellent speed!
                </span>
              ) : drill.timeSpentSeconds! <= optimalTime * 2 ? (
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  Good pace
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                  Practice more
                </span>
              )}
            </div>
          </div>

          {/* Path Efficiency */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Path Efficiency</div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {((drill.efficiency || 0) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">
              {navigationPath.length} clicks (optimal: {optimalPathLength})
            </div>
            <div className="mt-3">
              {(drill.efficiency || 0) >= 0.8 ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  Efficient path!
                </span>
              ) : (drill.efficiency || 0) >= 0.5 ? (
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  Room to improve
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                  Too many clicks
                </span>
              )}
            </div>
          </div>

          {/* Accuracy */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Accuracy</div>
            <div
              className={`text-3xl font-bold mb-2 ${
                drill.isCorrect ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {drill.isCorrect ? '100%' : '0%'}
            </div>
            <div className="text-xs text-gray-500">
              Target: {drill.targetArticle}
            </div>
            <div className="mt-3">
              {drill.isCorrect ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  Perfect!
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                  Missed by {drill.articleMissBy}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Prompt Review */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="font-bold text-gray-900 mb-3">Drill Prompt</h3>
          <p className="text-gray-700 mb-4">{drill.prompt}</p>
          <div className="flex items-center text-sm">
            <span className="text-gray-600 mr-2">Target Article:</span>
            <span className="font-mono font-bold text-green-600 bg-green-50 px-3 py-1 rounded border border-green-200">
              {drill.targetArticle}
            </span>
            {drill.targetTable && (
              <>
                <span className="text-gray-600 mx-2">→</span>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded border border-blue-200">
                  {drill.targetTable}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Navigation Path Review */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="font-bold text-gray-900 mb-4">Your Navigation Path</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Start</span>
            {navigationPath.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
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
                  className={`text-sm font-medium px-3 py-1 rounded ${
                    idx === navigationPath.length - 1
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  {step.length > 40 ? step.substring(0, 40) + '...' : step}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Total clicks: {navigationPath.length} | Optimal: ~{optimalPathLength}{' '}
            clicks
          </p>
        </div>

        {/* Study Recommendations */}
        {!drill.isCorrect && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-yellow-900 mb-3">
              💡 Study Recommendations
            </h3>
            <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
              <li>
                Review Article {drill.targetArticle} in your NEC code book
              </li>
              <li>
                Practice using the Index - search for keywords related to "
                {drill.prompt.split(' ').slice(0, 5).join(' ')}..."
              </li>
              <li>
                Common articles to memorize: 100 (Definitions), 110 (Requirements),
                210 (Branch Circuits), 220 (Calculations), 240 (Overcurrent
                Protection), 250 (Grounding), 310 (Conductors)
              </li>
              {(drill.efficiency || 0) < 0.5 && (
                <li>
                  Your navigation path was inefficient. Try using the Index first
                  to narrow down the chapter, then browse directly to the article.
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/trainer"
            className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            Start New Drill
          </Link>
          <Link
            href="/trainer/history"
            className="px-8 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            View History
          </Link>
          <Link
            href="/exam"
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take Practice Exam
          </Link>
        </div>
      </main>
    </div>
  );
}
