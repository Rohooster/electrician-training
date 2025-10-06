/**
 * Exam History Page
 *
 * Displays user's exam attempt history with:
 * - Chronological list of all exam attempts
 * - Pass/fail status for each
 * - Score and date for each attempt
 * - Links to review results
 * - Progress tracking over time
 *
 * Helps students track improvement and identify patterns.
 */

'use client';

import { trpc } from '@/lib/trpc-client';
import Link from 'next/link';

export default function ExamHistoryPage() {
  console.log('[History] Loading exam history');

  // Fetch user's exam history
  const { data: history, isLoading } = trpc.exam.getHistory.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam history...</p>
        </div>
      </div>
    );
  }

  const attempts = history || [];
  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter((a) => a.passed).length;
  const averageScore =
    totalAttempts > 0
      ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts
      : 0;

  // Calculate improvement trend
  const recentScores = attempts.slice(-3).map((a) => a.score || 0);
  const isImproving =
    recentScores.length >= 2 &&
    recentScores[recentScores.length - 1] > recentScores[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exam History</h1>
              <p className="text-sm text-gray-600 mt-1">
                Track your progress and review past attempts
              </p>
            </div>
            <Link
              href="/exam"
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Take New Exam
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Total Attempts</div>
            <div className="text-3xl font-bold text-gray-900">{totalAttempts}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Passed</div>
            <div className="text-3xl font-bold text-green-600">{passedAttempts}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Average Score</div>
            <div className="text-3xl font-bold text-gray-900">
              {averageScore.toFixed(1)}%
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
                  {totalAttempts < 2 ? 'Need more data' : 'Stable'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Attempts List */}
        {totalAttempts === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Exam History Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start your preparation by taking your first practice exam.
            </p>
            <Link
              href="/exam"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Take Your First Exam
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">
                All Attempts ({totalAttempts})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {attempts.map((attempt, idx) => {
                const attemptDate = new Date(attempt.submittedAt!);
                const timeSpent = attempt.startedAt && attempt.submittedAt
                  ? Math.round(
                      (new Date(attempt.submittedAt).getTime() -
                        new Date(attempt.startedAt).getTime()) /
                        1000 /
                        60
                    )
                  : 0;

                return (
                  <div
                    key={attempt.id}
                    className="px-6 py-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="font-semibold text-gray-900 mr-3">
                            Attempt #{totalAttempts - idx}
                          </span>
                          {attempt.passed ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Passed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ✗ Did Not Pass
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-6">
                            <span>
                              <span className="font-medium">Exam:</span>{' '}
                              {attempt.examForm.name}
                            </span>
                            <span>
                              <span className="font-medium">Score:</span>{' '}
                              <span
                                className={
                                  attempt.passed ? 'text-green-600' : 'text-red-600'
                                }
                              >
                                {attempt.score?.toFixed(1)}%
                              </span>
                            </span>
                            <span>
                              <span className="font-medium">Time:</span> {timeSpent}{' '}
                              min
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Date:</span>{' '}
                            {attemptDate.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="ml-6">
                        <Link
                          href={`/exam/${attempt.id}/results`}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Results
                        </Link>
                      </div>
                    </div>

                    {/* Score Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            attempt.passed ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${attempt.score || 0}%` }}
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
        {totalAttempts > 0 && passedAttempts === 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">
              💡 Tips to Improve Your Scores
            </h3>
            <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
              <li>Review incorrect answers from previous attempts</li>
              <li>Practice with NEC Navigator to improve code lookup speed</li>
              <li>Work through calculation problems step-by-step</li>
              <li>Focus on topics where you scored below 70%</li>
              <li>
                Study NEC articles that appear frequently in your weak areas
              </li>
              <li>Take practice exams under timed conditions</li>
            </ul>
          </div>
        )}

        {/* Congratulations for passing */}
        {passedAttempts > 0 && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-2">
              🎉 Congratulations!
            </h3>
            <p className="text-sm text-green-800">
              You've passed {passedAttempts} exam{passedAttempts > 1 ? 's' : ''}!
              Keep practicing to maintain your knowledge and prepare for the real
              certification exam.
            </p>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
