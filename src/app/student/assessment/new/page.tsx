'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';

/**
 * Assessment Start Page - Redesigned
 * Allows students to configure and start a new adaptive assessment
 */
export default function NewAssessmentPage() {
  const router = useRouter();
  const [minQuestions, setMinQuestions] = useState(15);
  const [maxQuestions, setMaxQuestions] = useState(20);
  const [seThreshold, setSeThreshold] = useState(0.3);

  const startMutation = trpc.assessment.start.useMutation({
    onSuccess: (data) => {
      sessionStorage.setItem(`assessment-${data.assessmentId}-current`, JSON.stringify(data.firstQuestion));
      router.push(`/student/assessment/${data.assessmentId}/take`);
    },
    onError: (error) => {
      alert(`Failed to start assessment: ${error.message}`);
    },
  });

  const handleStart = () => {
    startMutation.mutate({
      jurisdictionId: 'cmgg82b8t0003h4nn0f7iiw3x',
      config: {
        minQuestions,
        maxQuestions,
        seThreshold,
      },
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Find Your Knowledge Gaps
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed">
              Our adaptive assessment figures out exactly what you know and what you need to work on—in just 15-20 questions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Question Selection</h3>
              <p className="text-gray-700 leading-relaxed">
                Questions automatically adjust to your skill level—if you get one right, the next gets harder. If you miss one, we'll try something easier
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Track Your Progress</h3>
              <p className="text-gray-700 leading-relaxed">
                Watch your skill level update in real-time as you answer questions—you'll see exactly where you stand
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Done When You're Done</h3>
              <p className="text-gray-700 leading-relaxed">
                The assessment stops automatically once we have a clear picture of your skills—no wasted time on extra questions
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Get Your Study Plan</h3>
              <p className="text-gray-700 leading-relaxed">
                Get a detailed breakdown of what topics you've mastered and what you need to study—plus a personalized learning path to help you improve
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-10 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Configuration</h2>
          <p className="text-gray-700 mb-8">Customize your assessment parameters below</p>

          <div className="space-y-8">
            {/* Min Questions */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-lg font-semibold text-gray-900">
                  Minimum Questions
                </label>
                <span className="text-2xl font-bold text-blue-600">{minQuestions}</span>
              </div>
              <input
                type="range"
                min="10"
                max="25"
                value={minQuestions}
                onChange={(e) => setMinQuestions(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-sm text-gray-600 mt-3">
                Minimum number of questions before assessment can terminate
              </p>
            </div>

            {/* Max Questions */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-lg font-semibold text-gray-900">
                  Maximum Questions
                </label>
                <span className="text-2xl font-bold text-blue-600">{maxQuestions}</span>
              </div>
              <input
                type="range"
                min={minQuestions}
                max="30"
                value={maxQuestions}
                onChange={(e) => setMaxQuestions(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-sm text-gray-600 mt-3">
                Assessment will terminate after this many questions regardless of precision
              </p>
            </div>

            {/* SE Threshold */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-lg font-semibold text-gray-900">
                  Precision Threshold
                </label>
                <span className="text-2xl font-bold text-blue-600">{seThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.5"
                step="0.05"
                value={seThreshold}
                onChange={(e) => setSeThreshold(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-sm text-gray-600 mt-3">
                Lower values require more precision (more questions), higher values end sooner
              </p>
            </div>
          </div>
        </div>

        {/* Expected Duration */}
        <div className="bg-blue-600 text-white rounded-xl p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Expected Duration</h3>
              <p className="text-xl text-blue-50 mb-4">
                Approximately {Math.ceil((minQuestions + maxQuestions) / 2)} questions • {Math.ceil((minQuestions + maxQuestions) / 2 * 1.5)} minutes
              </p>
              <p className="text-blue-100 leading-relaxed">
                Most assessments terminate between minimum and maximum questions when sufficient
                precision is achieved. Your progress is saved automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-8 py-4 bg-white border-2 border-gray-900 text-gray-900 rounded-xl text-lg font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={startMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={startMutation.isPending}
            className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-300 shadow-lg shadow-blue-600/30"
          >
            {startMutation.isPending ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting Assessment...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Start Assessment
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
