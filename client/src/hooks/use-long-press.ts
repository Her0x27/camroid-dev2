import { useCallback, useMemo } from "react";
import { useTouchTracking } from "./use-touch-tracking";
import { LONG_PRESS } from "@/lib/constants";

export interface UseLongPressOptions<T = void> {
  onLongPress?: (data: T) => void;
  data?: T;
  delay?: number;
  moveThreshold?: number;
  disabled?: boolean;
}

export interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  wasLongPress: () => boolean;
}

export function useLongPress<T = void>(options: UseLongPressOptions<T>): LongPressHandlers {
  const {
    onLongPress,
    data,
    delay = LONG_PRESS.DEFAULT_DELAY_MS,
    moveThreshold = LONG_PRESS.DEFAULT_MOVE_THRESHOLD_PX,
    disabled = false,
  } = options;

  const handleLongPressCallback = useMemo(() => {
    if (!onLongPress) return undefined;
    return () => onLongPress(data as T);
  }, [onLongPress, data]);

  const {
    handleStart,
    handleMove,
    handleEnd,
    handleCancel,
    wasLongPress,
  } = useTouchTracking({
    onLongPress: handleLongPressCallback,
    longPressDelay: delay,
    moveThreshold,
    disabled,
  });

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

  const onTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

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

  const onMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

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
    wasLongPress,
  };
}
