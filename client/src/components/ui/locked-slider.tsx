import { useState, useRef, useCallback } from "react";
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
}

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
}: LockedSliderProps) {
  const [isLocked, setIsLocked] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canChangeRef = useRef(false);
  const interactionStartedRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    canChangeRef.current = false;
    timeoutRef.current = setTimeout(() => {
      canChangeRef.current = true;
      setIsLocked(false);
      if (!interactionStartedRef.current) {
        interactionStartedRef.current = true;
        onInteractionStart?.();
      }
    }, 500);
  }, [onInteractionStart]);

  const handlePointerUp = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    canChangeRef.current = false;
    setIsLocked(true);
    if (interactionStartedRef.current) {
      interactionStartedRef.current = false;
      onInteractionEnd?.();
    }
  }, [onInteractionEnd]);

  const handleValueChange = useCallback((newValue: number[]) => {
    if (canChangeRef.current) {
      onValueChange(newValue);
    }
  }, [onValueChange]);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchCancel={handlePointerUp}
      style={{
        opacity: isLocked ? 0.6 : 1,
        transition: "opacity 150ms ease",
        cursor: isLocked ? "not-allowed" : "grab",
      }}
      className={cn("select-none", className)}
    >
      <Slider
        value={value}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        data-testid={testId}
      />
    </div>
  );
}
