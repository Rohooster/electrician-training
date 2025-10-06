/**
 * Answer Review Component
 *
 * Displays detailed review of exam responses with:
 * - Correct/incorrect indication
 * - User's answer vs correct answer
 * - Explanation with NEC citations
 * - Study tips for missed questions
 *
 * Helps students learn from mistakes.
 */

'use client';

import { useState } from 'react';

interface ReviewItem {
  questionNumber: number;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
  explanation?: string;
  necRefs: string[];
  topic: string;
}

interface AnswerReviewProps {
  items: ReviewItem[];
  onBookmark?: (questionNumber: number) => void;
  bookmarkedQuestions?: Set<number>;
}

export function AnswerReview({
  items,
  onBookmark,
  bookmarkedQuestions = new Set(),
}: AnswerReviewProps) {
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'correct'>('all');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  // Filter items based on selection
  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'incorrect') return !item.isCorrect;
    if (filter === 'correct') return item.isCorrect;
    return true;
  });

  const incorrectCount = items.filter((i) => !i.isCorrect).length;

  const getOptionStyle = (
    optionLetter: string,
    correctAnswer: string,
    userAnswer: string | null,
    isExpanded: boolean
  ) => {
    if (!isExpanded) return 'border-gray-200 bg-white';

    const isCorrect = optionLetter === correctAnswer;
    const isUserAnswer = optionLetter === userAnswer;

    if (isCorrect && isUserAnswer) {
      return 'border-green-500 bg-green-50'; // Correct answer, user selected it
    } else if (isCorrect) {
      return 'border-green-500 bg-green-50'; // Correct answer
    } else if (isUserAnswer) {
      return 'border-red-500 bg-red-50'; // User's incorrect answer
    }
    return 'border-gray-200 bg-white';
  };

  const getOptionLabel = (
    optionLetter: string,
    correctAnswer: string,
    userAnswer: string | null,
    isExpanded: boolean
  ) => {
    if (!isExpanded) return null;

    const isCorrect = optionLetter === correctAnswer;
    const isUserAnswer = optionLetter === userAnswer;

    if (isCorrect && isUserAnswer) {
      return (
        <span className="text-xs font-medium text-green-700 ml-2">
          ✓ Your answer (Correct)
        </span>
      );
    } else if (isCorrect) {
      return (
        <span className="text-xs font-medium text-green-700 ml-2">
          ✓ Correct answer
        </span>
      );
    } else if (isUserAnswer) {
      return (
        <span className="text-xs font-medium text-red-700 ml-2">
          ✗ Your answer
        </span>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Questions ({items.length})
          </button>
          <button
            onClick={() => setFilter('incorrect')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'incorrect'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Incorrect ({incorrectCount})
          </button>
          <button
            onClick={() => setFilter('correct')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'correct'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Correct ({items.length - incorrectCount})
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Click any question to see detailed explanation
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredItems.map((item) => {
          const isExpanded = expandedQuestion === item.questionNumber;
          const isBookmarked = bookmarkedQuestions.has(item.questionNumber);

          return (
            <div
              key={item.questionNumber}
              className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                item.isCorrect
                  ? 'border-green-200'
                  : 'border-red-200'
              }`}
            >
              {/* Question Header */}
              <button
                onClick={() =>
                  setExpandedQuestion(
                    isExpanded ? null : item.questionNumber
                  )
                }
                className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold text-gray-900 mr-3">
                        Question {item.questionNumber}
                      </span>
                      {item.isCorrect ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ✗ Incorrect
                        </span>
                      )}
                      <span className="ml-2 text-xs text-gray-500">
                        {formatTopicName(item.topic)}
                      </span>
                    </div>
                    <p className="text-gray-700 line-clamp-2">{item.stem}</p>
                  </div>

                  <div className="flex items-center ml-4 space-x-2">
                    {/* Bookmark Button */}
                    {onBookmark && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookmark(item.questionNumber);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isBookmarked
                            ? 'text-yellow-600 hover:text-yellow-700'
                            : 'text-gray-400 hover:text-yellow-600'
                        }`}
                        aria-label="Bookmark question"
                      >
                        <svg
                          className="w-5 h-5"
                          fill={isBookmarked ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                          />
                        </svg>
                      </button>
                    )}

                    {/* Expand/Collapse Icon */}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-200">
                  {/* Question Stem */}
                  <div className="mt-4 mb-6">
                    <p className="text-lg text-gray-800">{item.stem}</p>
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-2 mb-6">
                    {['A', 'B', 'C', 'D'].map((letter) => (
                      <div
                        key={letter}
                        className={`p-4 rounded-lg border-2 ${getOptionStyle(
                          letter,
                          item.correctAnswer,
                          item.userAnswer,
                          isExpanded
                        )}`}
                      >
                        <div className="flex items-start">
                          <span className="font-bold text-gray-700 mr-3">
                            {letter}.
                          </span>
                          <div className="flex-1">
                            <span className="text-gray-800">
                              {item[`option${letter}` as keyof ReviewItem] as string}
                            </span>
                            {getOptionLabel(
                              letter,
                              item.correctAnswer,
                              item.userAnswer,
                              isExpanded
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Explanation */}
                  {item.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Explanation
                      </h4>
                      <p className="text-sm text-blue-800">{item.explanation}</p>
                    </div>
                  )}

                  {/* NEC References */}
                  {item.necRefs.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                        NEC References
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.necRefs.map((ref) => (
                          <span
                            key={ref}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-white border border-gray-300 text-gray-700"
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            </svg>
                            {ref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Study Tips for Incorrect Answers */}
                  {!item.isCorrect && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-2 text-sm">
                        💡 Study Tips
                      </h4>
                      <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        <li>
                          Review NEC {item.necRefs[0] || 'article'} thoroughly
                        </li>
                        <li>Practice similar {formatTopicName(item.topic)} questions</li>
                        <li>Use NEC Navigator to improve lookup speed for this topic</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">No questions match this filter</p>
        </div>
      )}
    </div>
  );
}

function formatTopicName(slug: string): string {
  return slug
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
