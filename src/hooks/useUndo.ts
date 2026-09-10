import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DURATION = 5;

/**
 * Generic undo hook — manages a countdown timer and pending item state.
 *
 * Usage:
 *   const { pendingItem, secondsLeft, trigger, undo, dismiss } = useUndo<CartItem>({
 *     duration: 5,
 *   });
 *
 *   // Start the undo window after performing a destructive action:
 *   removeFromCart(item._id);
 *   trigger(item);
 *
 *   // Restore on undo:
 *   const handleUndo = () => {
 *     if (pendingItem) addToCart(pendingItem);
 *     undo();
 *   };
 */
interface UseUndoOptions {
  duration?: number;
}

export function useUndo<T>({ duration = DEFAULT_DURATION }: UseUndoOptions = {}) {
  const [pendingItem, setPendingItem] = useState<T | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setPendingItem(null);
    setSecondsLeft(0);
  }, [clearTimer]);

  const trigger = useCallback(
    (item: T) => {
      clearTimer();
      setPendingItem(item);
      setSecondsLeft(duration);

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setPendingItem(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [duration, clearTimer],
  );

  const undo = useCallback(() => {
    dismiss();
  }, [dismiss]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    pendingItem,
    secondsLeft,
    trigger,
    undo,
    dismiss,
    isActive: pendingItem !== null,
  };
}
