'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';

/**
 * Assessment Results Page
 * Displays diagnostic report with ability estimate, weak/strong concepts, and learning path generation
 */
export default function AssessmentResultsPage({ params }: { params: { assessmentId: string } }) {
  const router = useRouter();
  const { assessmentId } = params;

  // Fetch diagnostic report
  const { data: report, isLoading, error } = trpc.assessment.getReport.useQuery({
    assessmentId,
  });

  const generatePathMutation = trpc.learningPath.generateFromAssessment.useMutation({
    onSuccess: (data) => {
      router.push(`/student/path/${data.id}`);
    },
    onError: (error) => {
      if (error.data?.code === 'UNAUTHORIZED') {
        // Redirect to sign in with return path
        router.push(`/auth/signin?callbackUrl=/student/assessment/${assessmentId}/results`);
      } else {
        alert(`Failed to generate learning path: ${error.message}`);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your diagnostic report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load report: {error?.message}</p>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Determine readiness color
  const readinessColors: Record<string, string> = {
    NOT_READY: 'text-red-600 bg-red-50 border-red-200',
    DEVELOPING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    READY: 'text-blue-600 bg-blue-50 border-blue-200',
    EXAM_READY: 'text-green-600 bg-green-50 border-green-200',
  };

  const readinessLabels: Record<string, string> = {
    NOT_READY: 'Not Ready',
    DEVELOPING: 'Developing',
    READY: 'Ready',
    EXAM_READY: 'Exam Ready',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Assessment Complete!
          </h1>
          <p className="text-lg text-gray-600">
            Here's your personalized diagnostic report
          </p>
        </div>

        {/* Readiness Level */}
        <div className={`rounded-lg border-2 p-8 mb-8 ${readinessColors[report.readinessLevel]}`}>
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">
              {readinessLabels[report.readinessLevel]}
            </h2>
            <p className="text-2xl font-semibold">
              Estimated Exam Score: {report.estimatedExamScore.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Ability Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Final Ability (θ)</h3>
            <p className="text-3xl font-bold text-blue-600">{report.finalAbility.toFixed(3)}</p>
            <p className="text-xs text-gray-500 mt-2">
              Range: -3 (beginner) to +3 (expert)
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Precision (SE)</h3>
            <p className="text-3xl font-bold text-blue-600">{report.finalSE.toFixed(3)}</p>
            <p className="text-xs text-gray-500 mt-2">
              Lower is better • &lt;0.3 is excellent
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Questions Asked</h3>
            <p className="text-3xl font-bold text-blue-600">{report.questionsAsked}</p>
            <p className="text-xs text-gray-500 mt-2">
              Adaptive algorithm optimized for you
            </p>
          </div>
        </div>

        {/* Confidence Interval */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">95% Confidence Interval</h3>
          <div className="relative">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>-3</span>
              <span>0</span>
              <span>+3</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8 relative">
              <div
                className="absolute bg-blue-300 h-8 rounded-full"
                style={{
                  left: `${((report.confidenceInterval95[0] + 3) / 6) * 100}%`,
                  width: `${((report.confidenceInterval95[1] - report.confidenceInterval95[0]) / 6) * 100}%`,
                }}
              />
              <div
                className="absolute w-1 bg-blue-600 h-8"
                style={{
                  left: `${((report.finalAbility + 3) / 6) * 100}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              We're 95% confident your true ability is between{' '}
              <span className="font-semibold">{report.confidenceInterval95[0].toFixed(3)}</span> and{' '}
              <span className="font-semibold">{report.confidenceInterval95[1].toFixed(3)}</span>
            </p>
          </div>
        </div>

        {/* Topic Performance */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Performance by Topic</h3>
          <div className="space-y-4">
            {report.topicPerformance.map((topic) => (
              <div key={topic.topic}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{topic.topic}</span>
                  <span className="text-sm text-gray-600">
                    {topic.correctCount}/{topic.questionsAsked} ({(topic.accuracy * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      topic.accuracy >= 0.8
                        ? 'bg-green-500'
                        : topic.accuracy >= 0.6
                        ? 'bg-blue-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${topic.accuracy * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Concepts */}
        {report.weakConcepts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              Concepts Needing Improvement
            </h3>
            <div className="space-y-3">
              {report.weakConcepts.map((concept, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{concept.topic}</p>
                    <p className="text-sm text-gray-600">Accuracy: {(concept.accuracy * 100).toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strong Concepts */}
        {report.strongConcepts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-green-600">
              Your Strong Areas
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {report.strongConcepts.map((concept, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-gray-900">{concept.topic}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="flex-1 px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-100"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => generatePathMutation.mutate({ assessmentId })}
            disabled={generatePathMutation.isPending}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
          >
            {generatePathMutation.isPending ? 'Generating...' : 'Generate Learning Path'}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">What's Next?</h4>
              <p className="text-sm text-blue-800">
                Click "Generate Learning Path" to create a personalized study plan focusing on your weak concepts.
                The adaptive algorithm will create a sequence of practice sets to build your mastery progressively.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
