import { ReactNode, memo } from "react";
import { Label } from "@/components/ui/label";
import { LockedSlider } from "@/components/ui/locked-slider";

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
}: SettingSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {icon}
          <div>
            <span>{label}</span>
            {description && (
              <p className="text-xs text-muted-foreground font-normal">
                {description}
              </p>
            )}
          </div>
        </Label>
        <span className="text-sm text-muted-foreground font-mono">
          {value}{unit}
        </span>
      </div>
      <LockedSlider
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
        min={min}
        max={max}
        step={step}
        data-testid={testId}
      />
    </div>
  );
});
