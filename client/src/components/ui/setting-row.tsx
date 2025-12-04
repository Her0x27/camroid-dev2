import { ReactNode, memo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SettingRowProps {
  id: string;
  icon?: ReactNode;
  label: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  control?: ReactNode;
  testId?: string;
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
}: SettingRowProps) {
  const hasSwitch = checked !== undefined && onCheckedChange !== undefined;
  
  return (
    <div className="flex items-center justify-between gap-4">
      <Label 
        htmlFor={hasSwitch ? id : undefined} 
        className="flex items-center gap-2 cursor-pointer"
      >
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
      {hasSwitch ? (
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          data-testid={testId}
        />
      ) : (
        control
      )}
    </div>
  );
});
