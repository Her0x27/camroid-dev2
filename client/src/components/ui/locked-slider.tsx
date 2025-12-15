import { useState, useRef, useCallback, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface LockedSliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
  "data-testid"?: string;
  className?: string;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  colorByValue?: boolean;
}

const DOUBLE_TAP_THRESHOLD = 300;
const AUTO_LOCK_DELAY = 5000;

export function LockedSlider({
  value,
  onValueChange,
  min,
  max,
  step,
  "data-testid": testId,
  className,
  onInteractionStart,
  onInteractionEnd,
  colorByValue = true,
}: LockedSliderProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [showActivation, setShowActivation] = useState(false);
  const lastTapTimeRef = useRef<number>(0);
  const autoLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activationAnimationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactionStartedRef = useRef(false);
  const isDraggingRef = useRef(false);

  const clearAutoLockTimeout = useCallback(() => {
    if (autoLockTimeoutRef.current) {
      clearTimeout(autoLockTimeoutRef.current);
      autoLockTimeoutRef.current = null;
    }
  }, []);

  const startAutoLockTimeout = useCallback(() => {
    clearAutoLockTimeout();
    autoLockTimeoutRef.current = setTimeout(() => {
      if (!isDraggingRef.current) {
        setIsLocked(true);
        if (interactionStartedRef.current) {
          interactionStartedRef.current = false;
          onInteractionEnd?.();
        }
      }
    }, AUTO_LOCK_DELAY);
  }, [clearAutoLockTimeout, onInteractionEnd]);

  const activateSlider = useCallback(() => {
    setIsLocked(false);
    setShowActivation(true);
    
    if (activationAnimationRef.current) {
      clearTimeout(activationAnimationRef.current);
    }
    activationAnimationRef.current = setTimeout(() => {
      setShowActivation(false);
    }, 600);

    if (!interactionStartedRef.current) {
      interactionStartedRef.current = true;
      onInteractionStart?.();
    }
    
    startAutoLockTimeout();
  }, [onInteractionStart, startAutoLockTimeout]);

  const handleTap = useCallback((e: React.MouseEvent) => {
    if (!isLocked) {
      startAutoLockTimeout();
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;
    
    if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD) {
      e.preventDefault();
      e.stopPropagation();
      activateSlider();
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
    }
  }, [isLocked, activateSlider, startAutoLockTimeout]);

  const handleValueChange = useCallback((newValue: number[]) => {
    if (!isLocked) {
      onValueChange(newValue);
      startAutoLockTimeout();
    }
  }, [isLocked, onValueChange, startAutoLockTimeout]);

  const handlePointerDown = useCallback(() => {
    if (!isLocked) {
      isDraggingRef.current = true;
      clearAutoLockTimeout();
    }
  }, [isLocked, clearAutoLockTimeout]);

  const handlePointerUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      startAutoLockTimeout();
    }
  }, [startAutoLockTimeout]);

  useEffect(() => {
    return () => {
      if (autoLockTimeoutRef.current) {
        clearTimeout(autoLockTimeoutRef.current);
      }
      if (activationAnimationRef.current) {
        clearTimeout(activationAnimationRef.current);
      }
    };
  }, []);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleTap}
      className={cn(
        "select-none relative rounded-lg p-1 -m-1 transition-all duration-200",
        isLocked && "opacity-60 cursor-pointer",
        !isLocked && "opacity-100 cursor-grab",
        showActivation && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse",
        className
      )}
    >
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] text-muted-foreground/70 bg-background/80 px-1.5 py-0.5 rounded">
            2×tap
          </span>
        </div>
      )}
      <Slider
        value={value}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        data-testid={testId}
        disabled={isLocked}
        colorByValue={colorByValue}
      />
    </div>
  );
}
