import { memo, useCallback } from "react";
import { Target, MapPin, Volume2, VolumeX, Sun, Moon, Palette, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { triggerHapticFeedback } from "@/lib/haptic-utils";
import type { Settings, StabilizationSettings, ReticleConfig } from "@shared/schema";

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
        "flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-md transition-all touch-manipulation",
        "active:scale-95 select-none w-full border",
        active
          ? "bg-primary/15 text-primary border-primary/50 shadow-[0_0_8px_hsl(var(--primary)/0.15)]"
          : "bg-card/50 text-muted-foreground border-border/50 hover:bg-muted/50 hover:border-border"
      )}
    >
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
        active ? "bg-primary/20" : "bg-muted/50"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-medium truncate max-w-full">{label}</span>
    </button>
  );
});

interface QuickSettingsProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  updateStabilization: (updates: Partial<StabilizationSettings>) => void;
  updateReticle: (updates: Partial<ReticleConfig>) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export const QuickSettings = memo(function QuickSettings({
  settings,
  updateSettings,
  updateStabilization,
  updateReticle,
  theme,
  setTheme,
}: QuickSettingsProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-3 gap-2">
      <QuickSettingButton
        icon={<Target className="w-3.5 h-3.5" />}
        label={t.settings.quickSettings.stabilization}
        active={settings.stabilization?.enabled ?? false}
        onClick={() => updateStabilization({ enabled: !settings.stabilization?.enabled })}
      />
      <QuickSettingButton
        icon={<MapPin className="w-3.5 h-3.5" />}
        label={t.settings.quickSettings.gps}
        active={settings.gpsEnabled}
        onClick={() => updateSettings({ gpsEnabled: !settings.gpsEnabled })}
      />
      <QuickSettingButton
        icon={settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        label={t.settings.quickSettings.sound}
        active={settings.soundEnabled}
        onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
      />
      <QuickSettingButton
        icon={theme === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        label={t.settings.quickSettings.theme}
        active={theme === "dark"}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      />
      <QuickSettingButton
        icon={<Palette className="w-3.5 h-3.5" />}
        label={t.settings.quickSettings.autoColor}
        active={settings.reticle?.autoColor ?? true}
        onClick={() => updateReticle({ autoColor: !settings.reticle?.autoColor })}
      />
      <QuickSettingButton
        icon={<Move className="w-3.5 h-3.5" />}
        label={t.settings.quickSettings.adjustment}
        active={settings.reticle?.manualAdjustment ?? false}
        onClick={() => updateReticle({ manualAdjustment: !settings.reticle?.manualAdjustment })}
      />
    </div>
  );
});
