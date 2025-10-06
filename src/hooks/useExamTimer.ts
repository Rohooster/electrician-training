/**
 * Exam Timer Hook
 *
 * Manages countdown timer for exam sittings. Handles:
 * - Countdown from time limit to 0
 * - Auto-submit when time expires
 * - Warning thresholds (30 min, 10 min, 1 min)
 * - Persists time remaining in case of page refresh
 *
 * Timer runs in real-time and cannot be paused (PSI-style behavior).
 */

import { useEffect, useState, useRef, useCallback } from 'react';

interface UseExamTimerOptions {
  startTime: Date;
  timeLimitMinutes: number;
  onExpire: () => void; // Callback when timer hits 0
}

interface UseExamTimerReturn {
  timeRemaining: number; // Seconds remaining
  formattedTime: string; // "HH:MM:SS" format
  isExpired: boolean;
  isWarning: boolean; // True if < 30 minutes remaining
  isCritical: boolean; // True if < 10 minutes remaining
  percentRemaining: number; // 0-100
}

export function useExamTimer({
  startTime,
  timeLimitMinutes,
  onExpire,
}: UseExamTimerOptions): UseExamTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const expireCallbackRef = useRef(onExpire);

  // Update callback ref when it changes
  useEffect(() => {
    expireCallbackRef.current = onExpire;
  }, [onExpire]);

  // Calculate time remaining
  const calculateTimeRemaining = useCallback(() => {
    const now = Date.now();
    const started = new Date(startTime).getTime();
    const elapsed = Math.floor((now - started) / 1000); // seconds elapsed
    const limit = timeLimitMinutes * 60; // convert to seconds
    const remaining = Math.max(0, limit - elapsed);

    console.log(
      `[Timer] Elapsed: ${elapsed}s, Limit: ${limit}s, Remaining: ${remaining}s`
    );

    return remaining;
  }, [startTime, timeLimitMinutes]);

  // Update timer every second
  useEffect(() => {
    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Check if expired
      if (remaining <= 0 && !isExpired) {
        console.log('[Timer] EXPIRED - Auto-submitting exam');
        setIsExpired(true);
        clearInterval(interval);

        // Trigger expire callback
        expireCallbackRef.current();
      }

      // Warning logs
      if (remaining === 1800) {
        // 30 minutes
        console.log('[Timer] WARNING: 30 minutes remaining');
      } else if (remaining === 600) {
        // 10 minutes
        console.log('[Timer] CRITICAL: 10 minutes remaining');
      } else if (remaining === 60) {
        // 1 minute
        console.log('[Timer] CRITICAL: 1 minute remaining');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeRemaining, isExpired]);

  // Format time as HH:MM:SS
  const formattedTime = formatTime(timeRemaining);

  // Calculate warning states
  const isWarning = timeRemaining <= 1800 && timeRemaining > 600; // 30-10 min
  const isCritical = timeRemaining <= 600; // < 10 min

  // Calculate percentage remaining
  const totalSeconds = timeLimitMinutes * 60;
  const percentRemaining = (timeRemaining / totalSeconds) * 100;

  return {
    timeRemaining,
    formattedTime,
    isExpired,
    isWarning,
    isCritical,
    percentRemaining,
  };
}

/**
 * Format seconds into HH:MM:SS
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');
}
