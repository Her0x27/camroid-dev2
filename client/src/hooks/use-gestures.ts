import { useRef, useCallback, useEffect } from "react";

export interface UseGesturesOptions {
  onTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  longPressDelay?: number;
  swipeThreshold?: number;
  moveThreshold?: number;
  disabled?: boolean;
}

export interface GestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

const DEFAULT_LONG_PRESS_DELAY = 500;
const DEFAULT_SWIPE_THRESHOLD = 50;
const DEFAULT_MOVE_THRESHOLD = 10;

export function useGestures(options: UseGesturesOptions): GestureHandlers {
  const {
    onTap,
    onLongPress,
    onSwipeLeft,
    onSwipeRight,
    longPressDelay = DEFAULT_LONG_PRESS_DELAY,
    swipeThreshold = DEFAULT_SWIPE_THRESHOLD,
    moveThreshold = DEFAULT_MOVE_THRESHOLD,
    disabled = false,
  } = options;

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressFiredRef = useRef(false);
  const gestureActiveRef = useRef(false);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const resetGestureState = useCallback(() => {
    clearLongPressTimer();
    startPosRef.current = null;
    longPressFiredRef.current = false;
    gestureActiveRef.current = false;
  }, [clearLongPressTimer]);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return;

      startPosRef.current = { x: clientX, y: clientY, time: Date.now() };
      longPressFiredRef.current = false;
      gestureActiveRef.current = true;

      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          longPressFiredRef.current = true;
          onLongPress();
        }, longPressDelay);
      }
    },
    [disabled, onLongPress, longPressDelay]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled || !startPosRef.current || !gestureActiveRef.current) return;

      const deltaX = clientX - startPosRef.current.x;
      const deltaY = clientY - startPosRef.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > moveThreshold) {
        clearLongPressTimer();
      }
    },
    [disabled, moveThreshold, clearLongPressTimer]
  );

  const handleEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled || !startPosRef.current || !gestureActiveRef.current) {
        resetGestureState();
        return;
      }

      const deltaX = clientX - startPosRef.current.x;
      const deltaY = clientY - startPosRef.current.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      clearLongPressTimer();

      if (longPressFiredRef.current) {
        resetGestureState();
        return;
      }

      if (absDeltaX > swipeThreshold && absDeltaX > absDeltaY) {
        if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        }
        resetGestureState();
        return;
      }

      if (distance <= moveThreshold && onTap) {
        onTap();
      }

      resetGestureState();
    },
    [
      disabled,
      swipeThreshold,
      moveThreshold,
      onTap,
      onSwipeLeft,
      onSwipeRight,
      clearLongPressTimer,
      resetGestureState,
    ]
  );

  const handleCancel = useCallback(() => {
    resetGestureState();
  }, [resetGestureState]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
      }
    },
    [handleStart]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    },
    [handleMove]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (startPosRef.current && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        handleEnd(touch.clientX, touch.clientY);
      } else {
        handleCancel();
      }
    },
    [handleEnd, handleCancel]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        handleStart(e.clientX, e.clientY);
      }
    },
    [handleStart]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    },
    [handleMove]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        handleEnd(e.clientX, e.clientY);
      }
    },
    [handleEnd]
  );

  const onMouseLeave = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
  };
}
