/**
 * Exam List Page
 *
 * Displays available practice exams for the selected jurisdiction.
 * Students can start new exams or resume in-progress sittings.
 *
 * Backend Configuration:
 * - Exam forms are built via admin panel
 * - Forms follow jurisdiction blueprint weights
 * - Rules (time, questions, etc.) come from RuleSet
 */

'use client';

import { trpc } from '@/lib/trpc-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Hard-coded CA jurisdiction for now (could be made dynamic via URL param)
const JURISDICTION_ID = 'ca-general-electrician';

export default function ExamListPage() {
  const router = useRouter();
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  // Fetch available exam forms for CA
  const { data: forms, isLoading } = trpc.exam.listForms.useQuery({
    jurisdictionId: JURISDICTION_ID,
    publishedOnly: true,
  });

  // Start exam mutation
  const startExam = trpc.exam.start.useMutation({
    onSuccess: (sitting) => {
      console.log('[Exam] Started sitting:', sitting.id);
      // Redirect to pre-exam instructions
      router.push(`/exam/${sitting.id}/instructions`);
    },
    onError: (error) => {
      console.error('[Exam] Failed to start exam:', error);
      alert('Failed to start exam. Please try again.');
    },
  });

  const handleStartExam = async (formId: string) => {
    setSelectedFormId(formId);
    console.log('[Exam] Initiating exam start for form:', formId);

    try {
      await startExam.mutateAsync({ examFormId: formId });
    } catch (error) {
      console.error('[Exam] Error in handleStartExam:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                California General Electrician Exam
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                NEC 2020 / CEC 2022 • PSI Format
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
        {/* Exam Information Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            Exam Format
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-900">Questions:</span>
              <span className="text-blue-700 ml-2">100</span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Time Limit:</span>
              <span className="text-blue-700 ml-2">240 minutes (4 hours)</span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Passing Score:</span>
              <span className="text-blue-700 ml-2">70%</span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Format:</span>
              <span className="text-blue-700 ml-2">Multiple Choice (A-D)</span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Code Book:</span>
              <span className="text-blue-700 ml-2">Open Book</span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Calculator:</span>
              <span className="text-blue-700 ml-2">Allowed</span>
            </div>
          </div>
        </div>

        {/* Available Exams */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Available Practice Exams
          </h2>

          {!forms || forms.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-600 mb-4">
                No practice exams available. Please run the seed script first.
              </p>
              <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                pnpm seed:ca
              </code>
            </div>
          ) : (
            <div className="space-y-4">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {form.name}
                      </h3>
                      {form.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {form.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span>
                          {form._count.formItems} questions
                        </span>
                        <span>•</span>
                        <span>
                          {form.jurisdiction.name}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartExam(form.id)}
                      disabled={startExam.isLoading && selectedFormId === form.id}
                      className="ml-4 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {startExam.isLoading && selectedFormId === form.id
                        ? 'Starting...'
                        : 'Start Exam'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">
            ⚠️ Before You Begin
          </h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Once started, the timer cannot be paused</li>
            <li>Ensure you have 4 hours of uninterrupted time</li>
            <li>Have your NEC 2020 and CEC 2022 code books ready</li>
            <li>Use a basic or scientific calculator (no programmable)</li>
            <li>You can flag questions for review before submitting</li>
            <li>Answers can be changed anytime before final submission</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
