import { useRef, useCallback, useEffect } from "react";

const DEFAULT_LONG_PRESS_DELAY = 500;
const DEFAULT_MOVE_THRESHOLD = 10;

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
    delay = DEFAULT_LONG_PRESS_DELAY,
    moveThreshold = DEFAULT_MOVE_THRESHOLD,
    disabled = false,
  } = options;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled || !onLongPress) return;

      startPosRef.current = { x: clientX, y: clientY };
      longPressFiredRef.current = false;

      timerRef.current = setTimeout(() => {
        longPressFiredRef.current = true;
        onLongPress(data as T);
      }, delay);
    },
    [disabled, onLongPress, data, delay]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!timerRef.current) return;

      const deltaX = Math.abs(clientX - startPosRef.current.x);
      const deltaY = Math.abs(clientY - startPosRef.current.y);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clearTimer();
      }
    },
    [moveThreshold, clearTimer]
  );

  const handleEnd = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const wasLongPress = useCallback(() => {
    const result = longPressFiredRef.current;
    longPressFiredRef.current = false;
    return result;
  }, []);

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

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd: handleEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp: handleEnd,
    onMouseLeave: handleEnd,
    wasLongPress,
  };
}
