import { memo, useCallback } from "react";
import { Target, MapPin, Volume2, VolumeX, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { triggerHapticFeedback } from "@/lib/haptic-utils";
import type { Settings, StabilizationSettings } from "@shared/schema";

interface QuickSettingButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const QuickSettingButton = memo(function QuickSettingButton({
  icon,
  label,
  active,
  onClick,
}: QuickSettingButtonProps) {
  const handleClick = useCallback(() => {
    triggerHapticFeedback();
    onClick();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg transition-all touch-manipulation",
        "active:scale-95 select-none w-full border",
        active
          ? "bg-primary/15 text-primary border-primary/50 shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
          : "bg-card/50 text-muted-foreground border-border/50 hover:bg-muted/50 hover:border-border"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
        active ? "bg-primary/20" : "bg-muted/50"
      )}>
        {icon}
      </div>
      <span className="text-[11px] font-medium truncate">{label}</span>
    </button>
  );
});

interface QuickSettingsProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  updateStabilization: (updates: Partial<StabilizationSettings>) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export const QuickSettings = memo(function QuickSettings({
  settings,
  updateSettings,
  updateStabilization,
  theme,
  setTheme,
}: QuickSettingsProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-4 gap-2">
      <QuickSettingButton
        icon={<Target className="w-4 h-4" />}
        label={t.settings.quickSettings.stabilization}
        active={settings.stabilization?.enabled ?? false}
        onClick={() => updateStabilization({ enabled: !settings.stabilization?.enabled })}
      />
      <QuickSettingButton
        icon={<MapPin className="w-4 h-4" />}
        label={t.settings.quickSettings.gps}
        active={settings.gpsEnabled}
        onClick={() => updateSettings({ gpsEnabled: !settings.gpsEnabled })}
      />
      <QuickSettingButton
        icon={settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        label={t.settings.quickSettings.sound}
        active={settings.soundEnabled}
        onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
      />
      <QuickSettingButton
        icon={theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        label={t.settings.quickSettings.theme}
        active={theme === "dark"}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      />
    </div>
  );
});
