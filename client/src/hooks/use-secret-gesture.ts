import { useState, useCallback, useRef, useEffect } from "react";
import { GESTURE, TIMING } from "@/lib/constants";

export interface UseSecretGestureOptions {
  onSecretGesture?: () => void;
  gestureType?: 'patternUnlock' | 'severalFingers';
  secretPattern?: string;
  unlockFingers?: number;
}

export interface UseSecretGestureReturn {
  showPatternOverlay: boolean;
  patternError: boolean;
  handleSecretTap: (isFromTouch?: boolean) => void;
  handlePatternComplete: (pattern: number[]) => void;
  handleClosePatternOverlay: () => void;
}

export function patternToString(pattern: number[]): string {
  return pattern.join('-');
}

export function useSecretGesture({
  onSecretGesture,
  gestureType = 'patternUnlock',
  secretPattern = '',
  unlockFingers = 4,
}: UseSecretGestureOptions): UseSecretGestureReturn {
  const [showPatternOverlay, setShowPatternOverlay] = useState(false);
  const [patternError, setPatternError] = useState(false);
  
  const patternTapTimesRef = useRef<number[]>([]);
  const lastTouchTapTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (gestureType !== 'severalFingers' || !onSecretGesture) return;
    
    const validFingerCount = Math.max(3, Math.min(9, unlockFingers));
    
    const handleTouchStart = (e: TouchEvent) => {
      const touchCount = e.touches.length;
      if (touchCount === validFingerCount) {
        e.preventDefault();
        onSecretGesture();
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [gestureType, unlockFingers, onSecretGesture]);
  
  const handleSecretTap = useCallback((isFromTouch: boolean = false) => {
    if (!onSecretGesture) return;
    if (gestureType === 'severalFingers') return;
    
    const now = Date.now();
    
    if (isFromTouch) {
      lastTouchTapTimeRef.current = now;
    } else {
      if (now - lastTouchTapTimeRef.current < 300) {
        return;
      }
    }
    
    if (gestureType === 'patternUnlock') {
      patternTapTimesRef.current = patternTapTimesRef.current.filter(t => now - t < TIMING.PATTERN_TAP_TIMEOUT_MS);
      patternTapTimesRef.current.push(now);
      
      if (patternTapTimesRef.current.length >= GESTURE.PATTERN_UNLOCK_TAP_COUNT) {
        patternTapTimesRef.current = [];
        setShowPatternOverlay(true);
        setPatternError(false);
      }
    }
  }, [gestureType, onSecretGesture]);
  
  const handlePatternComplete = useCallback((pattern: number[]) => {
    const enteredPattern = patternToString(pattern);
    
    if (enteredPattern === secretPattern) {
      setShowPatternOverlay(false);
      setPatternError(false);
      onSecretGesture?.();
    } else {
      setPatternError(true);
      setTimeout(() => setPatternError(false), TIMING.TAP_TIMEOUT_MS);
    }
  }, [secretPattern, onSecretGesture]);
  
  const handleClosePatternOverlay = useCallback(() => {
    setShowPatternOverlay(false);
    setPatternError(false);
  }, []);

  return {
    showPatternOverlay,
    patternError,
    handleSecretTap,
    handlePatternComplete,
    handleClosePatternOverlay,
  };
}
