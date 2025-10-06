/**
 * Pre-Exam Instructions Page
 *
 * Mimics PSI's pre-exam instruction screen. Shows exam rules, format,
 * and requires explicit agreement before entering the exam room.
 *
 * This is a critical checkpoint that sets expectations and prevents
 * accidental exam starts.
 */

'use client';

import { trpc } from '@/lib/trpc-client';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';

interface PageProps {
  params: Promise<{
    sittingId: string;
  }>;
}

export default function InstructionsPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Fetch sitting details to get exam form info
  const { data: sitting, isLoading } = trpc.exam.getSitting.useQuery({
    sittingId: params.sittingId,
  });

  console.log('[Instructions] Loaded sitting:', params.sittingId);

  const handleBeginExam = () => {
    if (!agreed) {
      alert('Please check the box to confirm you have read the instructions.');
      return;
    }

    console.log('[Instructions] User agreed to terms, entering exam room');
    setIsStarting(true);

    // Navigate to exam taking interface
    router.push(`/exam/${params.sittingId}/take`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam details...</p>
        </div>
      </div>
    );
  }

  if (!sitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Exam sitting not found</p>
        </div>
      </div>
    );
  }

  const ruleSet = sitting.examForm.jurisdiction.ruleSet;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - PSI style */}
      <header className="bg-blue-600 text-white px-6 py-4">
        <h1 className="text-xl font-bold">
          {sitting.examForm.jurisdiction.name} - Certification Examination
        </h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Main Instructions Panel */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Examination Instructions
          </h2>

          {/* Exam Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-4">Exam Format</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-blue-900">Questions:</span>
                <span className="text-blue-700">{ruleSet.questionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-blue-900">Time Limit:</span>
                <span className="text-blue-700">{ruleSet.timeLimitMinutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-blue-900">Passing Score:</span>
                <span className="text-blue-700">{ruleSet.passThresholdPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-blue-900">Question Type:</span>
                <span className="text-blue-700">Multiple Choice</span>
              </div>
            </div>
          </div>

          {/* Instructions List */}
          <div className="space-y-6 mb-8">
            <section>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">
                  1
                </span>
                Exam Rules
              </h3>
              <ul className="ml-8 space-y-2 text-gray-700 text-sm list-disc">
                <li>Once you click "Begin Exam", the timer will start immediately</li>
                <li>
                  The timer <strong>cannot be paused</strong> for any reason
                </li>
                <li>You must complete the exam within {ruleSet.timeLimitMinutes} minutes</li>
                <li>The exam will auto-submit when time expires</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">
                  2
                </span>
                Allowed Materials
              </h3>
              <ul className="ml-8 space-y-2 text-gray-700 text-sm list-disc">
                {ruleSet.allowedCodeBooks && (ruleSet.allowedCodeBooks as string[]).map((book, idx) => (
                  <li key={idx}>
                    <strong>Code Book:</strong> {book}
                  </li>
                ))}
                {ruleSet.allowedCalculator && (
                  <li>
                    <strong>Calculator:</strong> Basic or scientific only (
                    {(ruleSet.calculatorTypes as string[])?.join(', ')})
                  </li>
                )}
                {ruleSet.allowTabbing && (
                  <li>
                    <strong>Tabs/Highlighting:</strong> Pre-placed tabs and highlighting
                    are allowed in your code book
                  </li>
                )}
                {!ruleSet.allowNotes && (
                  <li className="text-red-600">
                    <strong>Handwritten Notes:</strong> NOT allowed in code book
                  </li>
                )}
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">
                  3
                </span>
                Navigation & Features
              </h3>
              <ul className="ml-8 space-y-2 text-gray-700 text-sm list-disc">
                <li>Use the question navigator on the left to jump between questions</li>
                <li>Click "Flag" to mark questions for review</li>
                <li>You can change answers anytime before final submission</li>
                <li>Click "Code Panel" to access a searchable code reference</li>
                <li>Review all flagged questions before submitting</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">
                  4
                </span>
                Submitting Your Exam
              </h3>
              <ul className="ml-8 space-y-2 text-gray-700 text-sm list-disc">
                <li>Click "Submit Exam" when you are finished</li>
                <li>You will be asked to confirm your submission</li>
                <li>Once submitted, you <strong>cannot</strong> change your answers</li>
                <li>You will see your results immediately after submission</li>
              </ul>
            </section>
          </div>

          {/* Agreement Checkbox */}
          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I have read and understand the exam instructions and rules. I am ready
                to begin the examination.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/exam')}
              className="px-6 py-3 text-gray-700 font-medium hover:text-gray-900 transition-colors"
            >
              ← Cancel
            </button>

            <button
              onClick={handleBeginExam}
              disabled={!agreed || isStarting}
              className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {isStarting ? 'Starting Exam...' : 'Begin Exam →'}
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Important:</strong> Make sure you have {ruleSet.timeLimitMinutes}{' '}
                minutes of uninterrupted time before starting. The timer cannot be paused.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
