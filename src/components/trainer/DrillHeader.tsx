/**
 * Drill Header Component
 *
 * Shows drill prompt and timer at the top of drill interface.
 * Clean, focused design to minimize distraction during timed drill.
 */

'use client';

interface DrillHeaderProps {
  prompt: string;
  formattedTime: string;
  isRunning: boolean;
}

export function DrillHeader({
  prompt,
  formattedTime,
  isRunning,
}: DrillHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-start justify-between">
          {/* Prompt */}
          <div className="flex-1 mr-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Find:
            </h2>
            <p className="text-xl font-medium text-gray-900">{prompt}</p>
          </div>

          {/* Timer */}
          <div className="shrink-0">
            <div className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide text-right">
              Time
            </div>
            <div
              className={`
                font-mono text-3xl font-bold px-6 py-3 rounded-lg
                ${
                  isRunning
                    ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                    : 'bg-gray-50 text-gray-600 border-2 border-gray-200'
                }
              `}
            >
              {formattedTime}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
