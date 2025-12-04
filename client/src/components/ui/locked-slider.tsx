import { useState, useRef, useCallback } from "react";
import { Slider } from "@/components/ui/slider";

interface LockedSliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
  "data-testid"?: string;
}

export function LockedSlider({
  value,
  onValueChange,
  min,
  max,
  step,
  "data-testid": testId,
}: LockedSliderProps) {
  const [isLocked, setIsLocked] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canChangeRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    canChangeRef.current = false;
    timeoutRef.current = setTimeout(() => {
      canChangeRef.current = true;
      setIsLocked(false);
    }, 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    canChangeRef.current = false;
    setIsLocked(true);
  }, []);

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
      style={{
        opacity: isLocked ? 0.6 : 1,
        transition: "opacity 150ms ease",
        cursor: isLocked ? "not-allowed" : "grab",
      }}
      className="select-none"
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
