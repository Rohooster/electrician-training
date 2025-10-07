'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';

/**
 * Practice Set Interface
 * Interactive practice session for a learning path step
 */
export default function PracticeSetPage() {
  const router = useRouter();
  const params = useParams();
  const pathId = params?.pathId as string;
  const stepId = params?.stepId as string;

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeStarted, setTimeStarted] = useState<number>(Date.now());
  const [results, setResults] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Fetch step details and questions
  const { data: pathData } = trpc.learningPath.getPath.useQuery({ pathId });

  // Submit attempt mutation
  const submitAttempt = trpc.learningPath.submitAttempt.useMutation({
    onSuccess: (data) => {
      // Store result
      const newResult = {
        question: questions[currentIndex],
        selected: selectedAnswer,
        isCorrect: data.isCorrect,
      };
      const newResults = [...results, newResult];
      setResults(newResults);

      // Move to next question or complete
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        setTimeStarted(Date.now());
      } else {
        setIsComplete(true);
      }

      // Show step completion feedback
      if (data.stepComplete) {
        setTimeout(() => {
          router.push(`/student/path/${pathId}`);
        }, 3000);
      }
    },
  });

  // Load questions on mount
  useEffect(() => {
    if (pathData && !questions.length) {
      const step = pathData.path.steps.find((s: any) => s.id === stepId);
      if (step && step.conceptId) {
        // Load items for this concept
        // For now, using mock data - you'll integrate with real data
        const mockQuestions = [
          {
            id: 'q1',
            stem: 'What is the minimum size conductor for a 20-ampere branch circuit?',
            optionA: '#14 AWG copper',
            optionB: '#12 AWG copper',
            optionC: '#10 AWG copper',
            optionD: '#8 AWG copper',
            correctAnswer: 'B',
            necArticleRefs: ['210.19(A)'],
          },
          {
            id: 'q2',
            stem: 'According to NEC, what is the maximum distance between supports for EMT conduit?',
            optionA: '6 feet',
            optionB: '8 feet',
            optionC: '10 feet',
            optionD: '12 feet',
            correctAnswer: 'C',
            necArticleRefs: ['358.30'],
          },
          {
            id: 'q3',
            stem: 'What is the minimum burial depth for direct-buried UF cable under a driveway?',
            optionA: '12 inches',
            optionB: '18 inches',
            optionC: '24 inches',
            optionD: '30 inches',
            correctAnswer: 'C',
            necArticleRefs: ['300.5'],
          },
        ];
        setQuestions(mockQuestions);
      }
    }
  }, [pathData, stepId]);

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const currentQ = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    const timeSeconds = Math.floor((Date.now() - timeStarted) / 1000);

    submitAttempt.mutate({
      stepId,
      itemId: currentQ.id,
      selectedAnswer,
      isCorrect,
      timeSeconds,
    });
  };

  if (!pathData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading practice questions...</p>
        </div>
      </div>
    );
  }

  const step = pathData.path.steps.find((s: any) => s.id === stepId);
  const currentQuestion = questions[currentIndex];
  const accuracy = results.length > 0
    ? (results.filter(r => r.isCorrect).length / results.length) * 100
    : 0;
  const requiredAccuracy = (step?.requiredAccuracy || 0.75) * 100;

  // Results view
  if (isComplete) {
    const passed = accuracy >= requiredAccuracy;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className={`rounded-lg border-2 p-8 text-center ${
            passed ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'
          }`}>
            {passed ? (
              <>
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h1 className="text-3xl font-bold text-green-900 mb-2">Great Job!</h1>
                <p className="text-lg text-green-800 mb-6">
                  You passed with {accuracy.toFixed(0)}% accuracy
                </p>
              </>
            ) : (
              <>
                <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h1 className="text-3xl font-bold text-yellow-900 mb-2">Keep Practicing</h1>
                <p className="text-lg text-yellow-800 mb-6">
                  You got {accuracy.toFixed(0)}%, but need {requiredAccuracy.toFixed(0)}%
                </p>
              </>
            )}

            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-4">Results Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{results.length}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.isCorrect).length}
                  </div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {results.filter(r => !r.isCorrect).length}
                  </div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              {!passed && (
                <button
                  onClick={() => {
                    setResults([]);
                    setCurrentIndex(0);
                    setSelectedAnswer(null);
                    setIsComplete(false);
                    setTimeStarted(Date.now());
                  }}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-100"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => router.push(`/student/path/${pathId}`)}
                className={`${passed ? 'w-full' : 'flex-1'} px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700`}
              >
                {passed ? 'Continue Learning Path' : 'Back to Path'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Practice question view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              Accuracy: {accuracy.toFixed(0)}% (Need {requiredAccuracy.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Question Stem */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                Practice Set
              </span>
              <span className="text-sm text-gray-600">
                {step?.title}
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {currentQuestion.stem}
            </h2>
            {currentQuestion.necArticleRefs && currentQuestion.necArticleRefs.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>NEC References: {currentQuestion.necArticleRefs.join(', ')}</span>
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
                  disabled={submitAttempt.isPending}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold ${
                        isSelected
                          ? 'border-purple-600 bg-purple-600 text-white'
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
              onClick={() => router.push(`/student/path/${pathId}`)}
              className="px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-100"
              disabled={submitAttempt.isPending}
            >
              Exit Practice
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer || submitAttempt.isPending}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitAttempt.isPending ? 'Submitting...' : 'Submit Answer'}
            </button>
          </div>
        </div>

        {/* Progress Stats */}
        {results.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Your Progress</h3>
            <div className="flex items-center gap-2">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                    result.isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
