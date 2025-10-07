'use client';

/**
 * Student Learning Path View
 *
 * Main interface for following a learning path:
 * - Shows current step
 * - Displays progress bar
 * - Renders step-specific UI (study, practice, checkpoint, assessment)
 * - Shows milestones and achievements
 */

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';

export default function PathViewPage() {
  const params = useParams();
  const pathId = params?.pathId as string;

  const { data: pathData, isLoading: pathLoading } = trpc.learningPath.getPath.useQuery(
    { pathId },
    { enabled: !!pathId }
  );

  const { data: stats } = trpc.learningPath.getStudentStats.useQuery();

  if (pathLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!pathData) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-600">Learning path not found</p>
        </div>
      </div>
    );
  }

  const { path, progress } = pathData;
  const currentStep = path.steps[progress.currentStepIndex];
  const nextSteps = path.steps.slice(
    progress.currentStepIndex + 1,
    progress.currentStepIndex + 4
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{path.name}</h1>
        <p className="text-gray-600">{path.description}</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {progress.overallProgress.toFixed(0)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${progress.overallProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress.stepsCompleted} / {progress.stepsTotal} steps
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Study Time</span>
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.floor(progress.totalTimeSpent / 60)}h {progress.totalTimeSpent % 60}m
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress.estimatedTimeRemaining}m remaining
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Mastery</span>
            <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {progress.conceptsMastered}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress.conceptsDeveloping} developing, {progress.conceptsWeak} weak
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Level & XP</span>
            <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            Level {stats?.level || 1}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-yellow-600 h-2 rounded-full"
              style={{ width: `${stats ? ((stats.xp % 1000) / 1000) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.xpToNextLevel || 0} XP to next level
          </p>
        </div>
      </div>

      {/* Current Step */}
      {currentStep && (
        <div className="bg-white rounded-lg shadow-sm border-2 border-blue-500 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                  Current Step
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                  {currentStep.type}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentStep.title}
              </h2>
              <p className="text-gray-600 mt-2">{currentStep.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Estimated Time</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentStep.estimatedMinutes} min
              </div>
            </div>
          </div>

          {currentStep.type === 'CONCEPT_STUDY' && (
            <ConceptStudyStep stepId={currentStep.id} pathId={pathId} />
          )}

          {currentStep.type === 'PRACTICE_SET' && (
            <PracticeSetStep
              stepId={currentStep.id}
              pathId={pathId}
              requiredAccuracy={currentStep.requiredAccuracy || 0.75}
            />
          )}

          {currentStep.type === 'CHECKPOINT' && (
            <CheckpointStep stepId={currentStep.id} pathId={pathId} />
          )}

          {currentStep.type === 'ASSESSMENT' && (
            <AssessmentStep stepId={currentStep.id} pathId={pathId} />
          )}
        </div>
      )}

      {/* Upcoming Steps */}
      {nextSteps.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Coming Up Next
          </h3>
          <div className="space-y-3">
            {nextSteps.map((step, idx) => (
              <div
                key={step.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{step.title}</div>
                  <div className="text-sm text-gray-500">{step.type}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {step.estimatedMinutes} min
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {path.milestones && path.milestones.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Milestones ({progress.milestonesUnlocked} / {progress.milestonesTotal})
          </h3>
          <div className="space-y-3">
            {path.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${
                  milestone.status === 'UNLOCKED'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {milestone.status === 'UNLOCKED' ? (
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {milestone.title}
                  </div>
                  <div className="text-sm text-gray-600">{milestone.description}</div>
                  {milestone.rewardType && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300 mt-2">
                      {milestone.rewardType}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Concept Study Step Component
 */
function ConceptStudyStep({ stepId, pathId }: { stepId: string; pathId: string }) {
  const utils = trpc.useUtils();
  const completeStudy = trpc.learningPath.completeStudyStep.useMutation({
    onSuccess: () => {
      utils.learningPath.getPath.invalidate({ pathId });
    },
  });

  return (
    <div className="mt-6">
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <svg className="h-8 w-8 text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="text-center text-gray-700">
          Read through the concept materials and mark as complete when ready.
        </p>
      </div>

      <button
        onClick={() => completeStudy.mutate({ stepId })}
        disabled={completeStudy.isPending}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center"
      >
        {completeStudy.isPending ? 'Saving...' : 'Mark as Complete'}
        <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Practice Set Step Component (simplified)
 */
function PracticeSetStep({
  stepId,
  pathId,
  requiredAccuracy,
}: {
  stepId: string;
  pathId: string;
  requiredAccuracy: number;
}) {
  return (
    <div className="mt-6">
      <div className="bg-purple-50 p-4 rounded-lg mb-4">
        <svg className="h-8 w-8 text-purple-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-center text-gray-700">
          Complete practice questions with {(requiredAccuracy * 100).toFixed(0)}%
          accuracy to advance.
        </p>
      </div>

      <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center">
        Start Practice
        <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Checkpoint Step Component (simplified)
 */
function CheckpointStep({ stepId, pathId }: { stepId: string; pathId: string }) {
  return (
    <div className="mt-6">
      <div className="bg-yellow-50 p-4 rounded-lg mb-4">
        <svg className="h-8 w-8 text-yellow-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-center text-gray-700">
          Complete all previous steps to unlock this checkpoint.
        </p>
      </div>

      <button disabled className="w-full bg-gray-400 text-white py-3 px-4 rounded-lg cursor-not-allowed font-medium">
        Checkpoint Locked
      </button>
    </div>
  );
}

/**
 * Assessment Step Component (simplified)
 */
function AssessmentStep({ stepId, pathId }: { stepId: string; pathId: string }) {
  return (
    <div className="mt-6">
      <div className="bg-green-50 p-4 rounded-lg mb-4">
        <svg className="h-8 w-8 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-center text-gray-700">
          Take the final assessment to validate your knowledge.
        </p>
      </div>

      <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center">
        Start Assessment
        <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
