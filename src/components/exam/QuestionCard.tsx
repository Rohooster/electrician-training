/**
 * Question Card Component
 *
 * Displays a single exam question with multiple choice options (A-D).
 * Handles answer selection and visual feedback.
 *
 * PSI-style presentation:
 * - Clean, single-column layout
 * - Large, easy-to-read text
 * - Clear visual indication of selected answer
 * - Keyboard shortcuts (A/B/C/D keys)
 */

'use client';

import { useEffect } from 'react';

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  onSelectAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void;
  isFlagged: boolean;
}

export function QuestionCard({
  questionNumber,
  totalQuestions,
  stem,
  optionA,
  optionB,
  optionC,
  optionD,
  selectedAnswer,
  onSelectAnswer,
  isFlagged,
}: QuestionCardProps) {
  // Keyboard shortcuts for answer selection
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        e.preventDefault();
        onSelectAnswer(key as 'A' | 'B' | 'C' | 'D');
        console.log(`[Question] Keyboard shortcut: Selected ${key}`);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onSelectAnswer]);

  const options = [
    { letter: 'A' as const, text: optionA },
    { letter: 'B' as const, text: optionB },
    { letter: 'C' as const, text: optionC },
    { letter: 'D' as const, text: optionD },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Question {questionNumber} of {totalQuestions}
        </h2>
        {isFlagged && (
          <span className="flex items-center text-orange-600 text-sm font-medium">
            <svg
              className="w-5 h-5 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" />
            </svg>
            Flagged for Review
          </span>
        )}
      </div>

      {/* Question Stem */}
      <div className="mb-8">
        <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
          {stem}
        </p>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.letter}
            onClick={() => onSelectAnswer(option.letter)}
            className={`
              w-full text-left p-5 rounded-lg border-2 transition-all duration-150
              ${
                selectedAnswer === option.letter
                  ? 'border-blue-600 bg-blue-50 shadow-sm'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }
            `}
            aria-label={`Option ${option.letter}`}
          >
            <div className="flex items-start">
              {/* Letter Badge */}
              <div
                className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4
                  ${
                    selectedAnswer === option.letter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }
                `}
              >
                {option.letter}
              </div>

              {/* Option Text */}
              <div className="flex-1 pt-1">
                <p className="text-base leading-relaxed text-gray-800">
                  {option.text}
                </p>
              </div>

              {/* Selected Indicator */}
              {selectedAnswer === option.letter && (
                <div className="flex-shrink-0 ml-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          💡 Tip: Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">A</kbd>,{' '}
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">B</kbd>,{' '}
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">C</kbd>, or{' '}
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">D</kbd> to select an answer
        </p>
      </div>
    </div>
  );
}
