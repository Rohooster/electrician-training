/**
 * Navigation Sidebar Component
 *
 * Displays question navigator grid (PSI-style).
 * Shows status of each question: answered, unanswered, flagged.
 * Allows quick navigation to any question.
 *
 * Visual Legend:
 * - Gray: Unanswered
 * - Blue: Answered
 * - Orange: Flagged for review
 * - Bold border: Current question
 */

'use client';

interface NavigationSidebarProps {
  totalQuestions: number;
  currentIndex: number;
  responses: Map<
    string,
    {
      itemId: string;
      selectedAnswer: string | null;
      flaggedForReview: boolean;
    }
  >;
  items: Array<{ id: string; position: number }>;
  onNavigate: (index: number) => void;
  answeredCount: number;
  flaggedCount: number;
}

export function NavigationSidebar({
  totalQuestions,
  currentIndex,
  responses,
  items,
  onNavigate,
  answeredCount,
  flaggedCount,
}: NavigationSidebarProps) {
  /**
   * Get status class for question button
   */
  const getQuestionStatus = (index: number) => {
    const item = items[index];
    if (!item) return 'unanswered';

    const response = responses.get(item.id);
    if (!response) return 'unanswered';

    if (response.flaggedForReview) return 'flagged';
    if (response.selectedAnswer) return 'answered';
    return 'unanswered';
  };

  const getStatusStyles = (status: string, isCurrent: boolean) => {
    const baseStyles = 'w-10 h-10 rounded font-medium text-sm transition-all cursor-pointer';

    if (isCurrent) {
      return `${baseStyles} ring-2 ring-offset-2 ring-blue-600 font-bold`;
    }

    switch (status) {
      case 'answered':
        return `${baseStyles} bg-blue-100 border-2 border-blue-500 text-blue-700 hover:bg-blue-200`;
      case 'flagged':
        return `${baseStyles} bg-orange-100 border-2 border-orange-500 text-orange-700 hover:bg-orange-200`;
      case 'unanswered':
      default:
        return `${baseStyles} bg-white border-2 border-gray-300 text-gray-600 hover:bg-gray-100`;
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        {/* Progress Summary */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Progress</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Answered:</span>
              <span className="font-medium text-blue-600">
                {answeredCount} / {totalQuestions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Flagged:</span>
              <span className="font-medium text-orange-600">{flaggedCount}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(answeredCount / totalQuestions) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question Grid */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalQuestions }, (_, i) => {
              const status = getQuestionStatus(i);
              const isCurrent = i === currentIndex;

              return (
                <button
                  key={i}
                  onClick={() => {
                    console.log(`[Navigation] Jumping to question ${i + 1}`);
                    onNavigate(i);
                  }}
                  className={getStatusStyles(status, isCurrent)}
                  aria-label={`Go to question ${i + 1}`}
                  aria-current={isCurrent ? 'true' : 'false'}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">LEGEND</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-blue-100 border-2 border-blue-500 mr-2"></div>
              <span className="text-gray-600">Answered</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-white border-2 border-gray-300 mr-2"></div>
              <span className="text-gray-600">Unanswered</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-orange-100 border-2 border-orange-500 mr-2"></div>
              <span className="text-gray-600">Flagged</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
