/**
 * Active Drill Page
 *
 * Main interface for performing NEC lookup drills.
 * Timer starts immediately, tracks navigation path, grades on submission.
 *
 * Features:
 * - Auto-start timer on load
 * - Interactive navigation tree
 * - Breadcrumb trail
 * - Submit button
 * - No pause (realistic exam pressure)
 */

'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';
import { useDrillTimer } from '@/hooks/useDrillTimer';
import { useDrillState } from '@/hooks/useDrillState';
import { DrillHeader } from '@/components/trainer/DrillHeader';
import { NavigationTree } from '@/components/trainer/NavigationTree';
import { DrillFooter } from '@/components/trainer/DrillFooter';

interface PageProps {
  params: Promise<{
    drillId: string;
  }>;
}

export default function DrillPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('[Drill] Loaded drill:', params.drillId);

  // Fetch drill data (for prompt)
  const { data: drill, isLoading } = trpc.trainer.getDrill.useQuery({
    drillId: params.drillId,
  });

  // Initialize timer (auto-start)
  const timer = useDrillTimer({ autoStart: true });

  // Initialize drill state
  const drillState = useDrillState();

  // Submit drill mutation
  const submitDrill = trpc.trainer.submitDrill.useMutation({
    onSuccess: () => {
      console.log('[Drill] Submitted successfully');
      router.push(`/trainer/${params.drillId}/results`);
    },
    onError: (error) => {
      console.error('[Drill] Failed to submit:', error);
      alert('Failed to submit drill. Please try again.');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    if (!drillState.selectedArticleRef) {
      alert('Please navigate to an article or table before submitting.');
      return;
    }

    setIsSubmitting(true);
    const finalTime = timer.stop();

    console.log('[Drill] Submitting:', {
      selectedArticleRef: drillState.selectedArticleRef,
      navigationPath: drillState.navigationPath,
      timeSpent: finalTime,
    });

    try {
      await submitDrill.mutateAsync({
        drillId: params.drillId,
        navigationPath: drillState.navigationPath,
        foundArticle: drillState.selectedArticleRef,
      });
    } catch (error) {
      console.error('[Drill] Error in handleSubmit:', error);
    }
  };

  if (isLoading || !drill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading drill...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Prompt and Timer */}
      <DrillHeader
        prompt={drill.prompt}
        formattedTime={timer.formattedTime}
        isRunning={timer.isRunning}
      />

      {/* Main Content - Navigation Tree */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Navigate to Find Answer
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Click through the NEC structure to find the article or table. Your path is being tracked.
          </p>
        </div>

        <NavigationTree
          currentNode={drillState.currentNode}
          breadcrumb={drillState.breadcrumb}
          onNavigate={drillState.navigateTo}
          onBack={drillState.goBack}
        />

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Start with "Index" to search by keyword, or browse
            by "Chapter" if you know the article structure. The optimal path is
            usually 3-4 clicks. When you've found the target article or table, click
            "Submit Answer" below.
          </p>
        </div>
      </div>

      {/* Footer with Submit */}
      <DrillFooter
        selectedArticleRef={drillState.selectedArticleRef}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
