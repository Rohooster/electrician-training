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
import { trpc } from '~/lib/trpc-client';
import { Card } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import {
  BookOpen,
  Target,
  Award,
  CheckCircle,
  Clock,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

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
        <Card className="p-6">
          <p className="text-gray-600">Learning path not found</p>
        </Card>
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
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <Target className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {progress.overallProgress.toFixed(0)}%
          </div>
          <Progress value={progress.overallProgress} className="mt-2" />
          <p className="text-xs text-gray-500 mt-1">
            {progress.stepsCompleted} / {progress.stepsTotal} steps
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Study Time</span>
            <Clock className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.floor(progress.totalTimeSpent / 60)}h {progress.totalTimeSpent % 60}m
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress.estimatedTimeRemaining}m remaining
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Mastery</span>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {progress.conceptsMastered}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress.conceptsDeveloping} developing, {progress.conceptsWeak} weak
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Level & XP</span>
            <Award className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            Level {stats?.level || 1}
          </div>
          <Progress
            value={((stats?.xp || 0) % 1000) / 10}
            className="mt-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            {stats?.xpToNextLevel || 0} XP to next level
          </p>
        </Card>
      </div>

      {/* Current Step */}
      {currentStep && (
        <Card className="p-6 mb-8 border-2 border-blue-500">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default" className="bg-blue-500">
                  Current Step
                </Badge>
                <Badge variant="outline">{currentStep.type}</Badge>
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
        </Card>
      )}

      {/* Upcoming Steps */}
      {nextSteps.length > 0 && (
        <Card className="p-6 mb-8">
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
        </Card>
      )}

      {/* Milestones */}
      {path.milestones && path.milestones.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
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
                    <CheckCircle className="h-6 w-6 text-green-500" />
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
                    <Badge variant="outline" className="mt-2">
                      {milestone.rewardType}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
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
        <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-2" />
        <p className="text-center text-gray-700">
          Read through the concept materials and mark as complete when ready.
        </p>
      </div>

      <Button
        onClick={() => completeStudy.mutate({ stepId })}
        disabled={completeStudy.isPending}
        size="lg"
        className="w-full"
      >
        {completeStudy.isPending ? 'Saving...' : 'Mark as Complete'}
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
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
        <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
        <p className="text-center text-gray-700">
          Complete practice questions with {(requiredAccuracy * 100).toFixed(0)}%
          accuracy to advance.
        </p>
      </div>

      <Button size="lg" className="w-full">
        Start Practice
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
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
        <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <p className="text-center text-gray-700">
          Complete all previous steps to unlock this checkpoint.
        </p>
      </div>

      <Button size="lg" className="w-full" disabled>
        Checkpoint Locked
      </Button>
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
        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
        <p className="text-center text-gray-700">
          Take the final assessment to validate your knowledge.
        </p>
      </div>

      <Button size="lg" className="w-full">
        Start Assessment
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}
