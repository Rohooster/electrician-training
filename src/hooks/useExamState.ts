/**
 * Exam State Hook
 *
 * Manages exam taking state including:
 * - Current question index
 * - Response tracking (answers, flags)
 * - Navigation between questions
 * - Auto-save responses to backend
 *
 * This hook is the single source of truth for exam progress.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc-client';

interface Response {
  itemId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  flaggedForReview: boolean;
  timeSpentSeconds?: number;
}

interface UseExamStateOptions {
  sittingId: string;
  items: Array<{ id: string; position: number }>;
  existingResponses?: Array<{
    itemId: string;
    selectedAnswer: string | null;
    flaggedForReview: boolean;
  }>;
}

interface UseExamStateReturn {
  currentIndex: number;
  currentItemId: string;
  responses: Map<string, Response>;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  selectAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void;
  toggleFlag: () => void;
  getCurrentResponse: () => Response | undefined;
  answeredCount: number;
  flaggedCount: number;
}

export function useExamState({
  sittingId,
  items,
  existingResponses = [],
}: UseExamStateOptions): UseExamStateReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, Response>>(
    new Map()
  );

  // Track time spent per question
  const questionStartTimeRef = useRef<number>(Date.now());

  // tRPC mutation for saving responses
  const saveResponse = trpc.exam.submitResponse.useMutation({
    onError: (error) => {
      console.error('[ExamState] Failed to save response:', error);
      // Don't alert user - we'll retry on next interaction
    },
  });

  // Initialize responses from existing data
  useEffect(() => {
    console.log('[ExamState] Initializing with existing responses');
    const initialResponses = new Map<string, Response>();

    for (const item of items) {
      const existing = existingResponses.find((r) => r.itemId === item.id);
      initialResponses.set(item.id, {
        itemId: item.id,
        selectedAnswer: (existing?.selectedAnswer as 'A' | 'B' | 'C' | 'D') || null,
        flaggedForReview: existing?.flaggedForReview || false,
      });
    }

    setResponses(initialResponses);
  }, [items, existingResponses]);

  // Get current item ID
  const currentItemId = items[currentIndex]?.id || '';

  // Navigate to specific question
  const goToQuestion = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) {
        console.warn('[ExamState] Invalid question index:', index);
        return;
      }

      // Calculate time spent on current question
      const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
      console.log(`[ExamState] Question ${currentIndex + 1} time spent: ${timeSpent}s`);

      // Update time spent for current question
      const currentItem = items[currentIndex];
      if (currentItem) {
        const response = responses.get(currentItem.id);
        if (response) {
          setResponses((prev) => {
            const updated = new Map(prev);
            updated.set(currentItem.id, {
              ...response,
              timeSpentSeconds: (response.timeSpentSeconds || 0) + timeSpent,
            });
            return updated;
          });
        }
      }

      console.log(`[ExamState] Navigating from Q${currentIndex + 1} to Q${index + 1}`);
      setCurrentIndex(index);
      questionStartTimeRef.current = Date.now();
    },
    [items, currentIndex, responses]
  );

  // Navigate to next question
  const nextQuestion = useCallback(() => {
    if (currentIndex < items.length - 1) {
      goToQuestion(currentIndex + 1);
    } else {
      console.log('[ExamState] Already at last question');
    }
  }, [currentIndex, items.length, goToQuestion]);

  // Navigate to previous question
  const prevQuestion = useCallback(() => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    } else {
      console.log('[ExamState] Already at first question');
    }
  }, [currentIndex, goToQuestion]);

  // Select an answer
  const selectAnswer = useCallback(
    (answer: 'A' | 'B' | 'C' | 'D') => {
      const response = responses.get(currentItemId);
      if (!response) return;

      console.log(`[ExamState] Q${currentIndex + 1} answered: ${answer}`);

      const updated = {
        ...response,
        selectedAnswer: answer,
      };

      // Update local state
      setResponses((prev) => {
        const newMap = new Map(prev);
        newMap.set(currentItemId, updated);
        return newMap;
      });

      // Save to backend
      saveResponse.mutate({
        sittingId,
        itemId: currentItemId,
        selectedAnswer: answer,
        flaggedForReview: updated.flaggedForReview,
        timeSpentSeconds: updated.timeSpentSeconds,
      });
    },
    [currentItemId, currentIndex, responses, sittingId, saveResponse]
  );

  // Toggle flag for review
  const toggleFlag = useCallback(() => {
    const response = responses.get(currentItemId);
    if (!response) return;

    const newFlagState = !response.flaggedForReview;
    console.log(`[ExamState] Q${currentIndex + 1} flag toggled:`, newFlagState);

    const updated = {
      ...response,
      flaggedForReview: newFlagState,
    };

    // Update local state
    setResponses((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentItemId, updated);
      return newMap;
    });

    // Save to backend
    saveResponse.mutate({
      sittingId,
      itemId: currentItemId,
      selectedAnswer: updated.selectedAnswer,
      flaggedForReview: newFlagState,
      timeSpentSeconds: updated.timeSpentSeconds,
    });
  }, [currentItemId, currentIndex, responses, sittingId, saveResponse]);

  // Get current question's response
  const getCurrentResponse = useCallback(() => {
    return responses.get(currentItemId);
  }, [currentItemId, responses]);

  // Calculate counts
  const answeredCount = Array.from(responses.values()).filter(
    (r) => r.selectedAnswer !== null
  ).length;

  const flaggedCount = Array.from(responses.values()).filter(
    (r) => r.flaggedForReview
  ).length;

  return {
    currentIndex,
    currentItemId,
    responses,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    selectAnswer,
    toggleFlag,
    getCurrentResponse,
    answeredCount,
    flaggedCount,
  };
}
