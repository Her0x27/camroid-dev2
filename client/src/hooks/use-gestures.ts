import { useCallback } from "react";
import { useTouchTracking } from "./use-touch-tracking";
import { LONG_PRESS, GESTURE } from "@/lib/constants";

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

export function useGestures(options: UseGesturesOptions): GestureHandlers {
  const {
    onTap,
    onLongPress,
    onSwipeLeft,
    onSwipeRight,
    longPressDelay = LONG_PRESS.DEFAULT_DELAY_MS,
    swipeThreshold = GESTURE.DEFAULT_SWIPE_THRESHOLD_PX,
    moveThreshold = LONG_PRESS.DEFAULT_MOVE_THRESHOLD_PX,
    disabled = false,
  } = options;

  const {
    handleStart,
    handleMove,
    handleEnd: baseHandleEnd,
    handleCancel,
    getState,
  } = useTouchTracking({
    onLongPress,
    longPressDelay,
    moveThreshold,
    disabled,
  });

  const handleEnd = useCallback(
    (clientX: number, clientY: number) => {
      const { startPos, longPressFired } = baseHandleEnd();

      if (!startPos) {
        handleCancel();
        return;
      }

      if (longPressFired) {
        handleCancel();
        return;
      }

      const deltaX = clientX - startPos.x;
      const deltaY = clientY - startPos.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (absDeltaX > swipeThreshold && absDeltaX > absDeltaY) {
        if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        }
        handleCancel();
        return;
      }

      if (distance <= moveThreshold && onTap) {
        onTap();
      }

      handleCancel();
    },
    [baseHandleEnd, handleCancel, swipeThreshold, moveThreshold, onTap, onSwipeLeft, onSwipeRight]
  );

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
      const state = getState();
      if (state.startPos && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        handleEnd(touch.clientX, touch.clientY);
      } else {
        handleCancel();
      }
    },
    [getState, handleEnd, handleCancel]
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
