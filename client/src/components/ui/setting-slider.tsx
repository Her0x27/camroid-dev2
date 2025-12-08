import { ReactNode, memo } from "react";
import { Label } from "@/components/ui/label";
import { LockedSlider } from "@/components/ui/locked-slider";
import { cn } from "@/lib/utils";

interface SettingSliderProps {
  icon?: ReactNode;
  label: string;
  description?: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  testId?: string;
  className?: string;
}

export const SettingSlider = memo(function SettingSlider({
  icon,
  label,
  description,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  unit = "%",
  testId,
  className,
}: SettingSliderProps) {
  return (
    <div className={cn("space-y-2 py-2 touch-manipulation", className)}>
      <div className="flex items-center justify-between gap-4 min-h-[40px]">
        <Label className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div className="shrink-0 w-5 h-5 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium leading-tight">{label}</span>
            {description && (
              <p className="text-xs text-muted-foreground font-normal mt-0.5 leading-tight">
                {description}
              </p>
            )}
          </div>
        </Label>
        <span className="text-sm text-muted-foreground font-mono shrink-0 tabular-nums">
          {value}{unit}
        </span>
      </div>
      <div className="px-1">
        <LockedSlider
          value={[value]}
          onValueChange={([v]) => onValueChange(v)}
          min={min}
          max={max}
          step={step}
          data-testid={testId}
          className="touch-manipulation"
        />
      </div>
    </div>
  );
});
