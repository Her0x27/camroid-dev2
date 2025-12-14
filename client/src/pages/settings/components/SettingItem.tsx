import { memo, type ReactNode } from "react";
import { Smartphone, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatform, type Platform } from "@/hooks/use-platform";

interface PlatformTip {
  ios?: string;
  android?: string;
  desktop?: string;
}

interface SettingItemProps {
  icon: ReactNode;
  title: string;
  description: string;
  platformTip?: PlatformTip;
  children: ReactNode;
  badge?: ReactNode;
  className?: string;
  vertical?: boolean;
  testId?: string;
}

function getPlatformTipColors(platform: Platform) {
  if (platform === "android") {
    return {
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      text: "text-orange-600 dark:text-orange-400",
      icon: "text-orange-600 dark:text-orange-400",
    };
  }
  return {
    bg: "bg-primary/5",
    border: "border-primary/10",
    text: "text-primary/80",
    icon: "text-primary",
  };
}

export const SettingItem = memo(function SettingItem({
  icon,
  title,
  description,
  platformTip,
  children,
  badge,
  className,
  vertical = false,
  testId,
}: SettingItemProps) {
  const platform = usePlatform();
  const currentTip = platformTip?.[platform];
  const tipColors = getPlatformTipColors(platform);

  return (
    <div
      data-testid={testId}
      className={cn(
        "group relative p-4 rounded-xl",
        "bg-muted/30 hover:bg-muted/50",
        "border border-border/50 hover:border-border",
        "transition-all duration-200",
        className
      )}
    >
      <div className={cn(
        "flex gap-4",
        vertical ? "flex-col" : "flex-row items-start"
      )}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-medium leading-tight">{title}</h4>
              {badge && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                  {badge}
                </span>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
            
            {currentTip && (
              <div className={cn("flex items-start gap-1.5 mt-2 p-2 rounded-lg", tipColors.bg, "border", tipColors.border)}>
                <PlatformIcon platform={platform} className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", tipColors.icon)} />
                <span className={cn("text-[11px] leading-relaxed", tipColors.text)}>
                  {currentTip}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={cn(
          "shrink-0 flex items-center",
          vertical ? "w-full justify-end" : "w-auto ml-auto"
        )}>
          {children}
        </div>
      </div>
    </div>
  );
});

function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  if (platform === "desktop") {
    return <Monitor className={className} />;
  }
  return <Smartphone className={className} />;
}

interface SettingItemCompactProps {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  testId?: string;
}

export const SettingItemCompact = memo(function SettingItemCompact({
  icon,
  title,
  description,
  children,
  className,
  testId,
}: SettingItemCompactProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex items-center justify-between gap-4 p-3 rounded-lg min-h-[56px]",
        "bg-muted/20 hover:bg-muted/40",
        "border border-border/30",
        "transition-colors duration-150",
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium leading-tight truncate">{title}</h4>
          {description && (
            <p className="text-[11px] text-muted-foreground leading-tight truncate mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0 flex items-center justify-end">
        {children}
      </div>
    </div>
  );
});

interface SettingSliderItemProps {
  icon: ReactNode;
  title: string;
  description: string;
  value: number;
  unit?: string;
  children: ReactNode;
  platformTip?: PlatformTip;
  className?: string;
  testId?: string;
}

export const SettingSliderItem = memo(function SettingSliderItem({
  icon,
  title,
  description,
  value,
  unit = "",
  children,
  platformTip,
  className,
  testId,
}: SettingSliderItemProps) {
  const platform = usePlatform();
  const currentTip = platformTip?.[platform];
  const tipColors = getPlatformTipColors(platform);

  return (
    <div
      data-testid={testId}
      className={cn(
        "p-4 rounded-xl space-y-3",
        "bg-muted/30 hover:bg-muted/50",
        "border border-border/50 hover:border-border",
        "transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium leading-tight">{title}</h4>
            <span className="text-sm font-mono text-muted-foreground shrink-0">
              {value}{unit}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            {description}
          </p>
        </div>
      </div>

      <div className="pl-13">
        {children}
      </div>

      {currentTip && (
        <div className={cn("flex items-start gap-1.5 p-2 rounded-lg", tipColors.bg, "border", tipColors.border)}>
          <PlatformIcon platform={platform} className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", tipColors.icon)} />
          <span className={cn("text-[11px] leading-relaxed", tipColors.text)}>
            {currentTip}
          </span>
        </div>
      )}
    </div>
  );
});

interface SettingSelectItemProps {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  platformTip?: PlatformTip;
  className?: string;
  testId?: string;
}

export const SettingSelectItem = memo(function SettingSelectItem({
  icon,
  title,
  description,
  children,
  platformTip,
  className,
  testId,
}: SettingSelectItemProps) {
  const platform = usePlatform();
  const currentTip = platformTip?.[platform];
  const tipColors = getPlatformTipColors(platform);

  return (
    <div
      data-testid={testId}
      className={cn(
        "p-4 rounded-xl space-y-3",
        "bg-muted/30 hover:bg-muted/50",
        "border border-border/50 hover:border-border",
        "transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="text-sm font-medium leading-tight">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div>
        {children}
      </div>

      {currentTip && (
        <div className={cn("flex items-start gap-1.5 p-2 rounded-lg", tipColors.bg, "border", tipColors.border)}>
          <PlatformIcon platform={platform} className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", tipColors.icon)} />
          <span className={cn("text-[11px] leading-relaxed", tipColors.text)}>
            {currentTip}
          </span>
        </div>
      )}
    </div>
  );
});
