/**
 * Drill Footer Component
 *
 * Control bar for drill submission.
 * Shows current selection and submit button.
 */

'use client';

interface DrillFooterProps {
  selectedArticleRef: string | null;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function DrillFooter({
  selectedArticleRef,
  onSubmit,
  isSubmitting = false,
}: DrillFooterProps) {
  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Current Selection */}
        <div>
          {selectedArticleRef ? (
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">Selected:</span>
              <span className="font-mono font-semibold text-gray-900 bg-blue-50 px-3 py-1 rounded border border-blue-200">
                {selectedArticleRef}
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Navigate to an article or table and click Submit
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={!selectedArticleRef || isSubmitting}
          className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </button>
      </div>
    </footer>
  );
}
