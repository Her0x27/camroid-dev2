import { useRef, useCallback, useEffect } from "react";
import { LONG_PRESS } from "@/lib/constants";

export interface Position {
  x: number;
  y: number;
}

export interface TouchTrackingState {
  startPos: Position | null;
  longPressFired: boolean;
  isActive: boolean;
}

export interface UseTouchTrackingOptions {
  onLongPress?: () => void;
  longPressDelay?: number;
  moveThreshold?: number;
  disabled?: boolean;
}

export interface TouchTrackingHandlers {
  handleStart: (clientX: number, clientY: number) => void;
  handleMove: (clientX: number, clientY: number) => void;
  handleEnd: () => { startPos: Position | null; longPressFired: boolean };
  handleCancel: () => void;
  getState: () => TouchTrackingState;
  wasLongPress: () => boolean;
}

export function useTouchTracking(options: UseTouchTrackingOptions): TouchTrackingHandlers {
  const {
    onLongPress,
    longPressDelay = LONG_PRESS.DEFAULT_DELAY_MS,
    moveThreshold = LONG_PRESS.DEFAULT_MOVE_THRESHOLD_PX,
    disabled = false,
  } = options;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<Position | null>(null);
  const longPressFiredRef = useRef(false);
  const isActiveRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    clearTimer();
    startPosRef.current = null;
    longPressFiredRef.current = false;
    isActiveRef.current = false;
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return;

      startPosRef.current = { x: clientX, y: clientY };
      longPressFiredRef.current = false;
      isActiveRef.current = true;

      if (onLongPress) {
        timerRef.current = setTimeout(() => {
          longPressFiredRef.current = true;
          onLongPress();
        }, longPressDelay);
      }
    },
    [disabled, onLongPress, longPressDelay]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled || !startPosRef.current || !isActiveRef.current) return;

      const deltaX = Math.abs(clientX - startPosRef.current.x);
      const deltaY = Math.abs(clientY - startPosRef.current.y);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clearTimer();
      }
    },
    [disabled, moveThreshold, clearTimer]
  );

  const handleEnd = useCallback(() => {
    clearTimer();
    const result = {
      startPos: startPosRef.current,
      longPressFired: longPressFiredRef.current,
    };
    startPosRef.current = null;
    isActiveRef.current = false;
    return result;
  }, [clearTimer]);

  const handleCancel = useCallback(() => {
    resetState();
  }, [resetState]);

  const getState = useCallback((): TouchTrackingState => {
    return {
      startPos: startPosRef.current,
      longPressFired: longPressFiredRef.current,
      isActive: isActiveRef.current,
    };
  }, []);

  const wasLongPress = useCallback(() => {
    const result = longPressFiredRef.current;
    longPressFiredRef.current = false;
    return result;
  }, []);

  return {
    handleStart,
    handleMove,
    handleEnd,
    handleCancel,
    getState,
    wasLongPress,
  };
}
