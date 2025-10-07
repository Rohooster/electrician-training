'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';

/**
 * Assessment Start Page
 * Allows students to configure and start a new adaptive assessment
 */
export default function NewAssessmentPage() {
  const router = useRouter();
  const [minQuestions, setMinQuestions] = useState(15);
  const [maxQuestions, setMaxQuestions] = useState(20);
  const [seThreshold, setSeThreshold] = useState(0.3);

  const startMutation = trpc.assessment.start.useMutation({
    onSuccess: (data) => {
      // Store first question in sessionStorage for take page
      sessionStorage.setItem(`assessment-${data.assessmentId}-current`, JSON.stringify(data.firstQuestion));
      router.push(`/student/assessment/${data.assessmentId}/take`);
    },
    onError: (error) => {
      alert(`Failed to start assessment: ${error.message}`);
    },
  });

  const handleStart = () => {
    startMutation.mutate({
      jurisdictionId: 'cmgg82b8t0003h4nn0f7iiw3x', // CA General Electrician
      config: {
        minQuestions,
        maxQuestions,
        seThreshold,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Start Adaptive Assessment
          </h1>
          <p className="text-lg text-gray-600">
            This adaptive assessment uses Item Response Theory (IRT) to accurately measure your ability level
          </p>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex gap-4">
              <div className="text-blue-600 font-bold text-xl">1</div>
              <div>
                <h3 className="font-semibold mb-1">Dynamic Question Selection</h3>
                <p>Questions are selected based on your current ability estimate, ensuring optimal precision</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-blue-600 font-bold text-xl">2</div>
              <div>
                <h3 className="font-semibold mb-1">Real-time Ability Estimation</h3>
                <p>Your ability is re-estimated after each question using advanced IRT algorithms</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-blue-600 font-bold text-xl">3</div>
              <div>
                <h3 className="font-semibold mb-1">Intelligent Termination</h3>
                <p>Assessment ends when sufficient precision is achieved or maximum questions reached</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-blue-600 font-bold text-xl">4</div>
              <div>
                <h3 className="font-semibold mb-1">Diagnostic Report</h3>
                <p>Receive a detailed report showing your ability level, weak concepts, and personalized learning path</p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Assessment Configuration</h2>

          <div className="space-y-6">
            {/* Min Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Questions: {minQuestions}
              </label>
              <input
                type="range"
                min="10"
                max="25"
                value={minQuestions}
                onChange={(e) => setMinQuestions(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum number of questions before assessment can terminate
              </p>
            </div>

            {/* Max Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Questions: {maxQuestions}
              </label>
              <input
                type="range"
                min={minQuestions}
                max="30"
                value={maxQuestions}
                onChange={(e) => setMaxQuestions(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                Assessment will terminate after this many questions regardless of precision
              </p>
            </div>

            {/* SE Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precision Threshold: {seThreshold.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.2"
                max="0.5"
                step="0.05"
                value={seThreshold}
                onChange={(e) => setSeThreshold(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                Lower values require more precision (more questions), higher values end sooner
              </p>
            </div>
          </div>
        </div>

        {/* Expected Duration */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Expected Duration</h3>
              <p className="text-blue-800">
                Approximately {Math.ceil((minQuestions + maxQuestions) / 2)} questions • {Math.ceil((minQuestions + maxQuestions) / 2 * 1.5)} minutes
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Most assessments terminate between minimum and maximum questions when sufficient precision is achieved
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="flex-1 px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition"
            disabled={startMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={startMutation.isPending}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300"
          >
            {startMutation.isPending ? 'Starting...' : 'Start Assessment'}
          </button>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Your progress will be saved automatically. You can pause at any time.
        </p>
      </div>
    </div>
  );
}
