import { ReactNode, memo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SettingRowProps {
  id: string;
  icon?: ReactNode;
  label: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  control?: ReactNode;
  testId?: string;
  className?: string;
}

export const SettingRow = memo(function SettingRow({
  id,
  icon,
  label,
  description,
  checked,
  onCheckedChange,
  control,
  testId,
  className,
}: SettingRowProps) {
  const hasSwitch = checked !== undefined && onCheckedChange !== undefined;
  
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 min-h-[56px] py-2 touch-manipulation",
      className
    )}>
      <Label 
        htmlFor={hasSwitch ? id : undefined} 
        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
      >
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
      {hasSwitch ? (
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          data-testid={testId}
          className="shrink-0"
        />
      ) : (
        <div className="shrink-0">{control}</div>
      )}
    </div>
  );
});
