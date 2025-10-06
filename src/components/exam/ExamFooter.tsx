/**
 * Exam Footer Component
 *
 * Control bar with:
 * - Previous/Next navigation
 * - Flag for review button
 * - Code panel toggle
 * - Submit exam button
 *
 * PSI-style layout with clear CTAs.
 */

'use client';

interface ExamFooterProps {
  currentIndex: number;
  totalQuestions: number;
  isFlagged: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleFlag: () => void;
  onToggleCodePanel: () => void;
  onSubmit: () => void;
  isCodePanelOpen: boolean;
}

export function ExamFooter({
  currentIndex,
  totalQuestions,
  isFlagged,
  onPrevious,
  onNext,
  onToggleFlag,
  onToggleCodePanel,
  onSubmit,
  isCodePanelOpen,
}: ExamFooterProps) {
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left: Previous Button */}
        <div>
          <button
            onClick={onPrevious}
            disabled={isFirstQuestion}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
        </div>

        {/* Center: Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Flag Button */}
          <button
            onClick={onToggleFlag}
            className={`
              px-5 py-2.5 font-medium rounded-lg border-2 transition-all
              ${
                isFlagged
                  ? 'bg-orange-100 border-orange-500 text-orange-700 hover:bg-orange-200'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-600'
              }
            `}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" />
              </svg>
              {isFlagged ? 'Unflag' : 'Flag for Review'}
            </div>
          </button>

          {/* Code Panel Button */}
          <button
            onClick={onToggleCodePanel}
            className={`
              px-5 py-2.5 font-medium rounded-lg border-2 transition-all
              ${
                isCodePanelOpen
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600'
              }
            `}
          >
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
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
              Code Panel
            </div>
          </button>

          {/* Submit Button */}
          <button
            onClick={onSubmit}
            className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            Submit Exam
          </button>
        </div>

        {/* Right: Next Button */}
        <div>
          <button
            onClick={onNext}
            disabled={isLastQuestion}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </footer>
  );
}
