/**
 * Exam Taking Page
 *
 * Main exam interface that orchestrates all components:
 * - Timer (auto-submit on expiry)
 * - Question display
 * - Navigation sidebar
 * - Code panel
 * - Submit confirmation
 *
 * This page implements strict PSI-style exam behavior:
 * - No pausing
 * - No leaving page (warns on refresh)
 * - Auto-saves responses
 * - Confirmation before submit
 */

'use client';

import { use, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';
import { useExamTimer } from '@/hooks/useExamTimer';
import { useExamState } from '@/hooks/useExamState';
import { ExamHeader } from '@/components/exam/ExamHeader';
import { QuestionCard } from '@/components/exam/QuestionCard';
import { NavigationSidebar } from '@/components/exam/NavigationSidebar';
import { ExamFooter } from '@/components/exam/ExamFooter';
import { CodePanel } from '@/components/exam/CodePanel';

interface PageProps {
  params: Promise<{
    sittingId: string;
  }>;
}

export default function ExamTakingPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  console.log('[ExamTaking] Loaded exam sitting:', params.sittingId);

  // Fetch sitting data
  const { data: sitting, isLoading } = trpc.exam.getSitting.useQuery({
    sittingId: params.sittingId,
  });

  // Submit exam mutation
  const submitExam = trpc.exam.submit.useMutation({
    onSuccess: (result) => {
      console.log('[ExamTaking] Exam submitted successfully:', result);
      router.push(`/exam/${params.sittingId}/results`);
    },
    onError: (error) => {
      console.error('[ExamTaking] Failed to submit exam:', error);
      alert('Failed to submit exam. Please try again.');
    },
  });

  // Auto-submit callback when timer expires
  const handleTimerExpire = useCallback(() => {
    console.log('[ExamTaking] Timer expired - auto-submitting exam');
    alert('Time has expired! Your exam will be submitted automatically.');
    submitExam.mutate({ sittingId: params.sittingId });
  }, [submitExam, params.sittingId]);

  // Initialize timer (only if sitting is loaded)
  const timer = useExamTimer({
    startTime: sitting?.startedAt || new Date(),
    timeLimitMinutes: sitting?.timeLimitMinutes || 240,
    onExpire: handleTimerExpire,
  });

  // Initialize exam state
  const examState = useExamState({
    sittingId: params.sittingId,
    items: sitting?.examForm.formItems || [],
    existingResponses: sitting?.responses || [],
  });

  // Handle submit confirmation
  const handleSubmitClick = () => {
    console.log('[ExamTaking] User clicked submit - showing confirmation');
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = () => {
    console.log('[ExamTaking] User confirmed submission');

    // Check for unanswered questions
    const unanswered = sitting!.examForm.formItems.length - examState.answeredCount;

    if (unanswered > 0) {
      const proceed = confirm(
        `You have ${unanswered} unanswered question${
          unanswered === 1 ? '' : 's'
        }. Are you sure you want to submit?`
      );

      if (!proceed) {
        setShowSubmitModal(false);
        return;
      }
    }

    submitExam.mutate({ sittingId: params.sittingId });
  };

  // Loading state
  if (isLoading || !sitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Get current question
  const currentItem =
    sitting.examForm.formItems[examState.currentIndex]?.item;

  if (!currentItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Error loading question</p>
      </div>
    );
  }

  const currentResponse = examState.getCurrentResponse();

  return (
    <div className="exam-container">
      {/* Header with Timer */}
      <ExamHeader
        examTitle={sitting.examForm.jurisdiction.name}
        questionNumber={examState.currentIndex + 1}
        totalQuestions={sitting.examForm.formItems.length}
        formattedTime={timer.formattedTime}
        isWarning={timer.isWarning}
        isCritical={timer.isCritical}
      />

      {/* Main Content */}
      <div className="exam-main">
        {/* Navigation Sidebar */}
        <NavigationSidebar
          totalQuestions={sitting.examForm.formItems.length}
          currentIndex={examState.currentIndex}
          responses={examState.responses}
          items={sitting.examForm.formItems}
          onNavigate={examState.goToQuestion}
          answeredCount={examState.answeredCount}
          flaggedCount={examState.flaggedCount}
        />

        {/* Question Display */}
        <div className="exam-content">
          <QuestionCard
            questionNumber={examState.currentIndex + 1}
            totalQuestions={sitting.examForm.formItems.length}
            stem={currentItem.stem}
            optionA={currentItem.optionA}
            optionB={currentItem.optionB}
            optionC={currentItem.optionC}
            optionD={currentItem.optionD}
            selectedAnswer={currentResponse?.selectedAnswer || null}
            onSelectAnswer={examState.selectAnswer}
            isFlagged={currentResponse?.flaggedForReview || false}
          />
        </div>
      </div>

      {/* Footer Controls */}
      <ExamFooter
        currentIndex={examState.currentIndex}
        totalQuestions={sitting.examForm.formItems.length}
        isFlagged={currentResponse?.flaggedForReview || false}
        onPrevious={examState.prevQuestion}
        onNext={examState.nextQuestion}
        onToggleFlag={examState.toggleFlag}
        onToggleCodePanel={() => setIsCodePanelOpen(!isCodePanelOpen)}
        onSubmit={handleSubmitClick}
        isCodePanelOpen={isCodePanelOpen}
      />

      {/* Code Panel Overlay */}
      <CodePanel
        isOpen={isCodePanelOpen}
        onClose={() => setIsCodePanelOpen(false)}
        codeBooks={
          sitting.examForm.jurisdiction.ruleSet.allowedCodeBooks as string[]
        }
      />

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowSubmitModal(false)}
            />

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Submit Exam?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to submit your exam? You will not be able to
                change your answers after submission.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-medium text-gray-900">
                      {sitting.examForm.formItems.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Answered:</span>
                    <span className="font-medium text-blue-600">
                      {examState.answeredCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unanswered:</span>
                    <span className="font-medium text-orange-600">
                      {sitting.examForm.formItems.length -
                        examState.answeredCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Remaining:</span>
                    <span className="font-medium text-gray-900">
                      {timer.formattedTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={submitExam.isLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                >
                  {submitExam.isLoading ? 'Submitting...' : 'Submit Exam'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
