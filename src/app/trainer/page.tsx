/**
 * NEC Navigator Trainer - Selection Page
 *
 * Landing page for code lookup drill training.
 * Shows user stats and allows starting new drills.
 *
 * Features:
 * - Start drill button (adaptive - picks weak topics)
 * - Overall statistics (accuracy, avg time, etc.)
 * - Link to drill history
 * - Quick tips for effective code lookup
 */

'use client';

import { trpc } from '@/lib/trpc-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const JURISDICTION_ID = 'ca-general-electrician';

export default function TrainerPage() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  console.log('[Trainer] Loading trainer page');

  // Fetch user's drill statistics
  const { data: stats, isLoading: statsLoading } = trpc.trainer.getStats.useQuery();

  // Start new drill mutation
  const startDrill = trpc.trainer.nextDrill.useMutation({
    onSuccess: (drill) => {
      console.log('[Trainer] Drill created:', drill.id);
      router.push(`/trainer/${drill.id}`);
    },
    onError: (error) => {
      console.error('[Trainer] Failed to create drill:', error);
      alert('Failed to start drill. Please try again.');
      setIsStarting(false);
    },
  });

  const handleStartDrill = async () => {
    setIsStarting(true);
    console.log('[Trainer] Initiating drill creation');

    try {
      await startDrill.mutateAsync({
        jurisdictionId: JURISDICTION_ID,
        drillType: 'ARTICLE_LOOKUP',
      });
    } catch (error) {
      console.error('[Trainer] Error in handleStartDrill:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                NEC Navigator Trainer
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Master code lookup speed and accuracy
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Ready to Practice?
              </h2>
              <p className="text-green-100 mb-6">
                Timed drills to improve your NEC navigation skills. Find articles faster and more accurately.
              </p>
              <button
                onClick={handleStartDrill}
                disabled={isStarting}
                className="px-8 py-4 bg-white text-green-600 font-bold rounded-lg hover:bg-green-50 disabled:bg-gray-200 disabled:text-gray-500 transition-colors shadow-md text-lg"
              >
                {isStarting ? 'Starting Drill...' : 'Start New Drill'}
              </button>
            </div>
            <div className="hidden md:block">
              <svg
                className="w-32 h-32 opacity-20"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {!statsLoading && stats && stats.total > 0 ? (
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
              <div className="text-sm text-gray-600 mb-1">Efficiency</div>
              <div className="text-3xl font-bold text-blue-600">
                {(stats.avgEfficiency * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">
              👋 Welcome to NEC Navigator!
            </h3>
            <p className="text-sm text-blue-800">
              This is your first drill. You'll practice finding articles in the NEC
              code book as quickly and accurately as possible. Start a drill above!
            </p>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">How It Works</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mr-3">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  You'll get a prompt
                </h4>
                <p className="text-sm text-gray-600">
                  For example: "Find the minimum size grounding electrode conductor
                  for a 200A service"
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mr-3">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Navigate the NEC tree
                </h4>
                <p className="text-sm text-gray-600">
                  Click through Index → Articles → Sections → Tables to find the
                  answer
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mr-3">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Get graded</h4>
                <p className="text-sm text-gray-600">
                  We'll measure your speed, accuracy, and navigation efficiency
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-yellow-900 mb-3">
            💡 Tips for Success
          </h3>
          <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
            <li>Start with the Index - it's organized by keyword</li>
            <li>Learn common article numbers (310, 240, 250, etc.)</li>
            <li>Tables are usually under their parent article</li>
            <li>The optimal path is usually 3-4 clicks</li>
            <li>Speed matters, but accuracy matters more!</li>
            <li>Practice regularly to build muscle memory</li>
          </ul>
        </div>

        {/* Action Links */}
        <div className="flex justify-center space-x-4">
          <Link
            href="/trainer/history"
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            View History
          </Link>
          <Link
            href="/exam"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take Practice Exam
          </Link>
        </div>
      </main>
    </div>
  );
}
