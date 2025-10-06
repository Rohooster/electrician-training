/**
 * Exam Header Component
 *
 * PSI-style header showing:
 * - Exam title
 * - Countdown timer (with color warnings)
 * - Current question indicator
 *
 * Timer colors:
 * - Green: > 30 minutes
 * - Yellow: 10-30 minutes
 * - Red: < 10 minutes (critical)
 */

'use client';

interface ExamHeaderProps {
  examTitle: string;
  questionNumber: number;
  totalQuestions: number;
  formattedTime: string;
  isWarning: boolean;
  isCritical: boolean;
}

export function ExamHeader({
  examTitle,
  questionNumber,
  totalQuestions,
  formattedTime,
  isWarning,
  isCritical,
}: ExamHeaderProps) {
  // Determine timer color based on warning state
  const getTimerColor = () => {
    if (isCritical) return 'text-red-600 bg-red-50 border-red-600';
    if (isWarning) return 'text-yellow-600 bg-yellow-50 border-yellow-600';
    return 'text-green-600 bg-green-50 border-green-600';
  };

  return (
    <header className="bg-blue-600 text-white px-6 py-4 shadow-md">
      <div className="flex items-center justify-between">
        {/* Exam Title & Question Counter */}
        <div>
          <h1 className="text-xl font-bold">{examTitle}</h1>
          <p className="text-sm text-blue-100 mt-1">
            Question {questionNumber} of {totalQuestions}
          </p>
        </div>

        {/* Timer Display */}
        <div className="flex items-center space-x-4">
          {/* Timer Box */}
          <div
            className={`
              px-6 py-3 rounded-lg border-2 font-mono text-2xl font-bold
              ${getTimerColor()}
            `}
          >
            {formattedTime}
          </div>

          {/* Timer Icon */}
          <svg
            className={`w-8 h-8 ${
              isCritical
                ? 'text-red-200'
                : isWarning
                ? 'text-yellow-200'
                : 'text-white'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      {/* Critical Time Warning Banner */}
      {isCritical && (
        <div className="mt-3 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Less than 10 minutes remaining! Complete your exam soon.
        </div>
      )}
    </header>
  );
}
