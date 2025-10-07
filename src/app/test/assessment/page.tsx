'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc-client';

/**
 * Test page for assessment API endpoints
 * Navigate to /test/assessment to test the assessment flow
 */
export default function AssessmentTestPage() {
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Mutation to start assessment
  const startMutation = trpc.assessment.start.useMutation({
    onSuccess: (data) => {
      setAssessmentId(data.assessmentId);
      setCurrentQuestion(data.firstQuestion);
      addLog(`✓ Assessment started: ${data.assessmentId}`);
      addLog(`✓ First question loaded (topic: ${data.firstQuestion.itemId})`);
    },
    onError: (error) => {
      addLog(`✗ Start failed: ${error.message}`);
    },
  });

  // Mutation to submit response
  const submitMutation = trpc.assessment.submitResponse.useMutation({
    onSuccess: (data) => {
      if (data.complete) {
        addLog(`✓ Assessment completed!`);
        addLog(`  - Final theta: ${data.currentTheta.toFixed(3)}`);
        addLog(`  - Final SE: ${data.currentSE.toFixed(3)}`);
        addLog(`  - Total questions: ${data.questionsAsked}`);
        addLog(`  - Reason: ${data.reason}`);
        setCurrentQuestion(null);
      } else {
        addLog(`✓ Response submitted (${data.isCorrect ? 'Correct' : 'Incorrect'})`);
        addLog(`  - New theta: ${data.currentTheta.toFixed(3)}`);
        addLog(`  - New SE: ${data.currentSE.toFixed(3)}`);
        setCurrentQuestion(data.nextQuestion);
      }
    },
    onError: (error) => {
      addLog(`✗ Submit failed: ${error.message}`);
    },
  });

  // Query to get report
  const reportQuery = trpc.assessment.getReport.useQuery(
    { assessmentId },
    { enabled: false }
  );

  const handleStart = async () => {
    addLog('Starting new assessment...');
    // Get CA jurisdiction ID (hardcoded for test)
    startMutation.mutate({
      jurisdictionId: 'cmgg82b8t0003h4nn0f7iiw3x',
      config: {
        minQuestions: 5,
        maxQuestions: 10,
        seThreshold: 0.3,
      },
    });
  };

  const handleAnswer = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;
    addLog(`Submitting answer: ${answer}`);
    submitMutation.mutate({
      assessmentId,
      itemId: currentQuestion.itemId,
      selectedAnswer: answer,
      timeSeconds: Math.floor(Math.random() * 60) + 20,
    });
  };

  const handleGetReport = async () => {
    if (!assessmentId) return;
    addLog('Fetching diagnostic report...');
    const result = await reportQuery.refetch();
    if (result.data) {
      addLog(`✓ Report generated:`);
      addLog(`  - Final ability: ${result.data.finalAbility.toFixed(3)}`);
      addLog(`  - Estimated exam score: ${result.data.estimatedExamScore.toFixed(1)}%`);
      addLog(`  - Readiness: ${result.data.readinessLevel}`);
      addLog(`  - Weak concepts: ${result.data.weakConcepts.length}`);
      addLog(`  - Strong concepts: ${result.data.strongConcepts.length}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Assessment API Test Page</h1>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={handleStart}
              disabled={startMutation.isPending || !!assessmentId}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
            >
              Start Assessment
            </button>
            <button
              onClick={handleGetReport}
              disabled={!assessmentId || !!currentQuestion || reportQuery.isFetching}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
            >
              Get Report
            </button>
          </div>
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Question {currentQuestion.sequence + 1}
            </h2>
            <p className="text-lg mb-4">{currentQuestion.stem}</p>
            <div className="space-y-2">
              {['A', 'B', 'C', 'D'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option as 'A' | 'B' | 'C' | 'D')}
                  disabled={submitMutation.isPending}
                  className="block w-full text-left px-4 py-3 border rounded hover:bg-blue-50 disabled:bg-gray-100"
                >
                  <span className="font-semibold">{option}.</span>{' '}
                  {currentQuestion[`option${option}`]}
                </button>
              ))}
            </div>
            {currentQuestion.necArticleRefs && (
              <p className="text-sm text-gray-600 mt-4">
                NEC References: {JSON.stringify(currentQuestion.necArticleRefs)}
              </p>
            )}
          </div>
        )}

        {/* Log */}
        <div className="bg-black rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">API Log</h2>
          <div className="font-mono text-sm text-green-400 space-y-1 max-h-96 overflow-y-auto">
            {log.length === 0 ? (
              <p className="text-gray-500">No activity yet. Click "Start Assessment" to begin.</p>
            ) : (
              log.map((entry, i) => (
                <div key={i}>{entry}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
