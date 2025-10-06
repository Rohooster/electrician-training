/**
 * Drill History Page
 *
 * Displays user's NEC navigation drill history with:
 * - Chronological list of all drill attempts
 * - Correct/incorrect status for each
 * - Time and efficiency metrics
 * - Links to review results
 * - Progress tracking over time
 *
 * Helps students track improvement in code lookup skills.
 */

'use client';

import { trpc } from '@/lib/trpc-client';
import Link from 'next/link';

export default function DrillHistoryPage() {
  console.log('[DrillHistory] Loading drill history');

  // Fetch user's drill history
  const { data: history, isLoading } = trpc.trainer.getHistory.useQuery({
    limit: 50,
  });

  // Fetch summary stats
  const { data: stats } = trpc.trainer.getStats.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading drill history...</p>
        </div>
      </div>
    );
  }

  const drills = history || [];
  const totalDrills = drills.length;
  const correctDrills = drills.filter((d) => d.isCorrect).length;
  const averageTime =
    totalDrills > 0
      ? drills.reduce((sum, d) => sum + (d.timeSpentSeconds || 0), 0) /
        totalDrills
      : 0;
  const averageEfficiency =
    totalDrills > 0
      ? drills.reduce((sum, d) => sum + (d.efficiency || 0), 0) / totalDrills
      : 0;

  // Calculate improvement trend
  const recentDrills = drills.slice(0, 5); // Most recent 5
  const recentAccuracy =
    recentDrills.length > 0
      ? (recentDrills.filter((d) => d.isCorrect).length / recentDrills.length) *
        100
      : 0;

  const olderDrills = drills.slice(5, 10); // Previous 5
  const olderAccuracy =
    olderDrills.length > 0
      ? (olderDrills.filter((d) => d.isCorrect).length / olderDrills.length) *
        100
      : 0;

  const isImproving =
    recentDrills.length >= 3 &&
    olderDrills.length >= 3 &&
    recentAccuracy > olderAccuracy;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Drill History</h1>
              <p className="text-sm text-gray-600 mt-1">
                Track your NEC navigation progress
              </p>
            </div>
            <Link
              href="/trainer"
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Start New Drill
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary Stats */}
        {stats && stats.total > 0 && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-sm text-gray-600 mb-1">Total Drills</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-sm text-gray-600 mb-1">Accuracy</div>
              <div className="text-3xl font-bold text-green-600">
                {stats.accuracy.toFixed(0)}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-sm text-gray-600 mb-1">Avg Time</div>
              <div className="text-3xl font-bold text-gray-900">
                {Math.round(stats.avgTimeSeconds)}s
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-sm text-gray-600 mb-1">Trend</div>
              <div className="flex items-center">
                {isImproving ? (
                  <>
                    <svg
                      className="w-8 h-8 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-lg font-semibold text-green-600">
                      Improving
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-semibold text-gray-600">
                    {totalDrills < 5 ? 'Need more data' : 'Stable'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Drills List */}
        {totalDrills === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Drill History Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start practicing NEC navigation to build your code lookup skills.
            </p>
            <Link
              href="/trainer"
              className="inline-block px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Start Your First Drill
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">
                All Drills ({totalDrills})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {drills.map((drill, idx) => {
                const completedDate = drill.completedAt
                  ? new Date(drill.completedAt)
                  : null;
                const navigationPath =
                  (drill.navigationPath as string[]) || [];

                return (
                  <div
                    key={drill.id}
                    className="px-6 py-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="font-semibold text-gray-900 mr-3">
                            Drill #{totalDrills - idx}
                          </span>
                          {drill.isCorrect ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ✗ Incorrect
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          <p className="line-clamp-1">{drill.prompt}</p>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center flex-wrap gap-4">
                            <span>
                              <span className="font-medium">Target:</span>{' '}
                              <span className="font-mono">
                                {drill.targetArticle}
                              </span>
                            </span>
                            <span>
                              <span className="font-medium">Time:</span>{' '}
                              <span
                                className={
                                  (drill.timeSpentSeconds || 0) <= 30
                                    ? 'text-green-600'
                                    : (drill.timeSpentSeconds || 0) <= 60
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }
                              >
                                {drill.timeSpentSeconds}s
                              </span>
                            </span>
                            <span>
                              <span className="font-medium">Efficiency:</span>{' '}
                              <span
                                className={
                                  (drill.efficiency || 0) >= 0.8
                                    ? 'text-green-600'
                                    : (drill.efficiency || 0) >= 0.5
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }
                              >
                                {((drill.efficiency || 0) * 100).toFixed(0)}%
                              </span>
                            </span>
                            <span>
                              <span className="font-medium">Clicks:</span>{' '}
                              {navigationPath.length}
                            </span>
                          </div>
                          {completedDate && (
                            <div>
                              <span className="font-medium">Date:</span>{' '}
                              {completedDate.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-6">
                        <Link
                          href={`/trainer/${drill.id}/results`}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          View Results
                        </Link>
                      </div>
                    </div>

                    {/* Efficiency Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            (drill.efficiency || 0) >= 0.8
                              ? 'bg-green-500'
                              : (drill.efficiency || 0) >= 0.5
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            width: `${(drill.efficiency || 0) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Improvement Tips */}
        {totalDrills > 0 && stats && stats.accuracy < 70 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 mb-3">
              💡 Tips to Improve Your Navigation Skills
            </h3>
            <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
              <li>
                Start with the Index - it's organized by keyword and topic
              </li>
              <li>
                Memorize common article numbers: 100 (Definitions), 110
                (Requirements), 210 (Branch Circuits), 220 (Calculations), 240
                (Overcurrent), 250 (Grounding), 310 (Conductors)
              </li>
              <li>
                Tables are usually nested under their parent article (e.g., Table
                310.16 is under Article 310)
              </li>
              <li>
                Practice daily for 10-15 minutes to build muscle memory
              </li>
              <li>
                The optimal path is usually 3-4 clicks: Index → Topic → Article →
                Table
              </li>
              <li>
                Speed matters, but accuracy matters more - slow down if needed
              </li>
            </ul>
          </div>
        )}

        {/* Congratulations for high accuracy */}
        {stats && stats.accuracy >= 80 && stats.total >= 10 && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-2">
              🎉 Excellent Work!
            </h3>
            <p className="text-sm text-green-800">
              You've achieved {stats.accuracy.toFixed(0)}% accuracy over{' '}
              {stats.total} drills! Your code lookup skills are strong. Keep
              practicing to maintain this level and improve your speed even more.
            </p>
          </div>
        )}

        {/* Links */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/trainer"
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Practice More
          </Link>
          <Link
            href="/exam"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take Practice Exam
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
