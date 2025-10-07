'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';

/**
 * Assessment Taking Interface
 * Main interface for answering adaptive assessment questions
 */
export default function TakeAssessmentPage({ params }: { params: { assessmentId: string } }) {
  const router = useRouter();
  const { assessmentId } = params;

  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeStarted, setTimeStarted] = useState<number>(Date.now());
  const [questionHistory, setQuestionHistory] = useState<any[]>([]);

  // Get assessment state
  const { data: assessment, isLoading } = trpc.assessment.getAssessment.useQuery({
    assessmentId,
  });

  // Submit response mutation
  const submitMutation = trpc.assessment.submitResponse.useMutation({
    onSuccess: (data) => {
      setQuestionHistory((prev) => [
        ...prev,
        {
          question: currentQuestion,
          answer: selectedAnswer,
          isCorrect: data.isCorrect,
        },
      ]);

      if (data.complete) {
        // Assessment completed, clear storage and redirect to results
        sessionStorage.removeItem(`assessment-${assessmentId}-current`);
        router.push(`/student/assessment/${assessmentId}/results`);
      } else {
        // Load next question and store it
        setCurrentQuestion(data.nextQuestion);
        sessionStorage.setItem(`assessment-${assessmentId}-current`, JSON.stringify(data.nextQuestion));
        setSelectedAnswer(null);
        setTimeStarted(Date.now());
      }
    },
    onError: (error) => {
      alert(`Error submitting answer: ${error.message}`);
    },
  });

  // Load first question on mount
  useEffect(() => {
    if (!currentQuestion) {
      // Try to load from sessionStorage
      const storedQuestion = sessionStorage.getItem(`assessment-${assessmentId}-current`);
      if (storedQuestion) {
        setCurrentQuestion(JSON.parse(storedQuestion));
      } else if (assessment && assessment.responses.length === 0) {
        // No stored question and no responses - user refreshed or navigated directly
        alert('Please start a new assessment from the beginning.');
        router.push('/student/assessment/new');
      }
    }
  }, [assessment, assessmentId]);

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const timeSeconds = Math.floor((Date.now() - timeStarted) / 1000);

    submitMutation.mutate({
      assessmentId,
      itemId: currentQuestion.itemId,
      selectedAnswer: selectedAnswer as 'A' | 'B' | 'C' | 'D',
      timeSeconds,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No question available</p>
          <button
            onClick={() => router.push('/student/assessment/new')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Start New Assessment
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion.sequence + 1) / 20) * 100; // Assume max 20 questions

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Progress */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestion.sequence + 1}
            </span>
            <span className="text-sm text-gray-600">
              {assessment.questionsAsked} answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Question Stem */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {currentQuestion.stem}
            </h2>
            {currentQuestion.necArticleRefs && currentQuestion.necArticleRefs.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>NEC References: {JSON.stringify(currentQuestion.necArticleRefs)}</span>
              </div>
            )}
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {['A', 'B', 'C', 'D'].map((option) => {
              const isSelected = selectedAnswer === option;
              return (
                <button
                  key={option}
                  onClick={() => setSelectedAnswer(option)}
                  disabled={submitMutation.isPending}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      {option}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-gray-900">{currentQuestion[`option${option}`]}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
                  router.push('/student/dashboard');
                }
              }}
              className="px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-100"
              disabled={submitMutation.isPending}
            >
              Pause & Exit
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer || submitMutation.isPending}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Answer'}
            </button>
          </div>
        </div>

        {/* Ability Indicator */}
        {assessment.currentTheta !== undefined && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Performance</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Beginner</span>
                  <span>Intermediate</span>
                  <span>Expert</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((assessment.currentTheta + 3) / 6) * 100))}%`,
                    }}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {assessment.currentTheta.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">Ability (θ)</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Standard Error: {assessment.currentSE.toFixed(3)} • Lower is better
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
