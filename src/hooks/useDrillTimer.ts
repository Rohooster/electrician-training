/**
 * Drill Timer Hook
 *
 * Count-up timer for measuring drill performance.
 * Unlike exam timer (counts down), this measures elapsed time.
 *
 * Features:
 * - Starts from 0 and counts up
 * - No time limit (measures performance)
 * - Can be stopped/paused
 * - Formats time as MM:SS
 * - Logs milestones for analytics
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseDrillTimerOptions {
  autoStart?: boolean; // Start immediately on mount
}

interface UseDrillTimerReturn {
  elapsedSeconds: number; // Total seconds elapsed
  formattedTime: string; // "MM:SS" format
  isRunning: boolean;
  start: () => void;
  stop: () => number; // Returns final time
  reset: () => void;
}

export function useDrillTimer({
  autoStart = false,
}: UseDrillTimerOptions = {}): UseDrillTimerReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer
  const start = useCallback(() => {
    if (isRunning) return; // Already running

    console.log('[DrillTimer] Started');
    startTimeRef.current = Date.now() - elapsedSeconds * 1000;
    setIsRunning(true);
  }, [isRunning, elapsedSeconds]);

  // Stop timer and return final time
  const stop = useCallback(() => {
    if (!isRunning) return elapsedSeconds;

    console.log('[DrillTimer] Stopped at', elapsedSeconds, 'seconds');
    setIsRunning(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return elapsedSeconds;
  }, [isRunning, elapsedSeconds]);

  // Reset timer to 0
  const reset = useCallback(() => {
    console.log('[DrillTimer] Reset');
    setElapsedSeconds(0);
    setIsRunning(false);
    startTimeRef.current = null;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Update timer every 100ms for smooth display
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);

        // Log milestones for analytics
        if (elapsed === 10) {
          console.log('[DrillTimer] 10 seconds elapsed');
        } else if (elapsed === 30) {
          console.log('[DrillTimer] 30 seconds elapsed');
        } else if (elapsed === 60) {
          console.log('[DrillTimer] 1 minute elapsed');
        }
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && !isRunning && elapsedSeconds === 0) {
      start();
    }
  }, [autoStart, isRunning, elapsedSeconds, start]);

  const formattedTime = formatDrillTime(elapsedSeconds);

  return {
    elapsedSeconds,
    formattedTime,
    isRunning,
    start,
    stop,
    reset,
  };
}

/**
 * Format seconds into MM:SS for drill display
 * No hours needed since drills should be quick (<5 min ideally)
 */
function formatDrillTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
