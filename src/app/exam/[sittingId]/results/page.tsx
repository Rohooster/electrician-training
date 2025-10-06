/**
 * Exam Results Page
 *
 * Shows exam results after submission:
 * - Pass/Fail status
 * - Score breakdown
 * - Time taken
 * - Topic performance analysis
 * - Answer review (correct/incorrect)
 *
 * Provides actionable insights for improvement.
 */

'use client';

import { use, useState } from 'react';
import { trpc } from '@/lib/trpc-client';
import Link from 'next/link';
import { AnswerReview } from '@/components/exam/AnswerReview';

interface PageProps {
  params: Promise<{
    sittingId: string;
  }>;
}

export default function ResultsPage(props: PageProps) {
  const params = use(props.params);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(
    new Set()
  );

  console.log('[Results] Loading results for sitting:', params.sittingId);

  // Fetch sitting with responses
  const { data: sitting, isLoading } = trpc.exam.getSitting.useQuery({
    sittingId: params.sittingId,
  });

  // Handle bookmarking questions
  const handleBookmark = (questionNumber: number) => {
    setBookmarkedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionNumber)) {
        newSet.delete(questionNumber);
        console.log('[Results] Unbookmarked question:', questionNumber);
      } else {
        newSet.add(questionNumber);
        console.log('[Results] Bookmarked question:', questionNumber);
      }
      return newSet;
    });
  };

  if (isLoading || !sitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (sitting.status !== 'SUBMITTED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Exam not yet submitted</p>
        </div>
      </div>
    );
  }

  const score = sitting.score || 0;
  const passed = sitting.passed || false;
  const passThreshold = sitting.examForm.jurisdiction.ruleSet.passThresholdPercent;
  const totalQuestions = sitting.examForm.formItems.length;
  const correctCount = Math.round((score / 100) * totalQuestions);

  // Calculate time taken
  const startTime = sitting.startedAt
    ? new Date(sitting.startedAt).getTime()
    : 0;
  const endTime = sitting.submittedAt
    ? new Date(sitting.submittedAt).getTime()
    : 0;
  const timeTakenMinutes = Math.round((endTime - startTime) / 1000 / 60);

  // Topic breakdown (simplified - in production, group by item topics)
  const topicPerformance = calculateTopicPerformance(sitting);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
          <p className="text-sm text-gray-600 mt-1">
            {sitting.examForm.jurisdiction.name}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Pass/Fail Banner */}
        <div
          className={`rounded-lg p-8 mb-8 ${
            passed
              ? 'bg-green-50 border-2 border-green-500'
              : 'bg-red-50 border-2 border-red-500'
          }`}
        >
          <div className="text-center">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                passed ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {passed ? (
                <svg
                  className="w-12 h-12 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-12 h-12 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <h2
              className={`text-3xl font-bold mb-2 ${
                passed ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {passed ? 'Congratulations! You Passed!' : 'You Did Not Pass'}
            </h2>
            <p
              className={`text-lg ${
                passed ? 'text-green-700' : 'text-red-700'
              }`}
            >
              Your score: <strong>{score.toFixed(1)}%</strong> (Required:{' '}
              {passThreshold}%)
            </p>
          </div>
        </div>

        {/* Score Details */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Questions Correct</div>
            <div className="text-3xl font-bold text-gray-900">
              {correctCount} / {totalQuestions}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Time Taken</div>
            <div className="text-3xl font-bold text-gray-900">
              {timeTakenMinutes} min
            </div>
            <div className="text-xs text-gray-500 mt-1">
              of {sitting.timeLimitMinutes} min allowed
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm text-gray-600 mb-1">Percentage</div>
            <div className="text-3xl font-bold text-gray-900">
              {score.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Topic Performance */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Performance by Topic
          </h3>
          <div className="space-y-3">
            {topicPerformance.map((topic) => (
              <div key={topic.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{topic.name}</span>
                  <span className="text-gray-900 font-medium">
                    {topic.correct} / {topic.total} ({topic.percentage.toFixed(0)}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      topic.percentage >= 70
                        ? 'bg-green-500'
                        : topic.percentage >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${topic.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {!passed && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-3">
              Recommendations for Next Attempt
            </h3>
            <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
              {topicPerformance
                .filter((t) => t.percentage < 70)
                .map((topic) => (
                  <li key={topic.name}>
                    Review <strong>{topic.name}</strong> - scored{' '}
                    {topic.percentage.toFixed(0)}%
                  </li>
                ))}
              <li>Practice with NEC Navigator drills to improve code lookup speed</li>
              <li>Work through calculation practice problems with step-by-step solutions</li>
              <li>
                Retake window: {sitting.examForm.jurisdiction.ruleSet.retakeWaitDays}{' '}
                days after this attempt
              </li>
            </ul>
          </div>
        )}

        {/* Answer Review Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Answer Review
          </h2>
          <p className="text-gray-600 mb-6">
            Review each question to understand what you got right and where you can improve.
            Bookmark questions to study later.
          </p>
          <AnswerReview
            items={sitting.examForm.formItems.map((formItem, idx) => {
              const response = sitting.responses.find(
                (r) => r.itemId === formItem.item.id
              );
              return {
                questionNumber: idx + 1,
                stem: formItem.item.stem,
                optionA: formItem.item.optionA,
                optionB: formItem.item.optionB,
                optionC: formItem.item.optionC,
                optionD: formItem.item.optionD,
                correctAnswer: formItem.item.correctAnswer,
                userAnswer: response?.selectedAnswer || null,
                isCorrect: response?.isCorrect || false,
                explanation: formItem.item.explanation || undefined,
                necRefs: (formItem.item.necArticleRefs as string[]) || [],
                topic: formItem.item.topic,
              };
            })}
            onBookmark={handleBookmark}
            bookmarkedQuestions={bookmarkedQuestions}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Link
            href="/exam"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take Another Practice Exam
          </Link>
          <Link
            href="/trainer"
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Practice Code Lookups
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

/**
 * Calculate topic performance breakdown
 * Groups responses by topic and calculates accuracy
 */
function calculateTopicPerformance(sitting: any) {
  const topicMap = new Map<
    string,
    { correct: number; total: number; name: string }
  >();

  // Group by topic
  for (const formItem of sitting.examForm.formItems) {
    const item = formItem.item;
    const topic = item.topic || 'Unknown';

    if (!topicMap.has(topic)) {
      topicMap.set(topic, {
        name: formatTopicName(topic),
        correct: 0,
        total: 0,
      });
    }

    const response = sitting.responses.find((r: any) => r.itemId === item.id);
    const stats = topicMap.get(topic)!;
    stats.total++;

    if (response?.isCorrect) {
      stats.correct++;
    }
  }

  // Convert to array and calculate percentages
  return Array.from(topicMap.values()).map((topic) => ({
    ...topic,
    percentage: (topic.correct / topic.total) * 100,
  }));
}

/**
 * Format topic slug into readable name
 */
function formatTopicName(slug: string): string {
  return slug
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
