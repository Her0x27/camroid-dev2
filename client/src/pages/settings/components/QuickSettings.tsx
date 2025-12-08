import { memo } from "react";
import { Target, MapPin, Volume2, VolumeX, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
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
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all touch-manipulation",
        "active:scale-95 select-none w-full",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
      )}
    >
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-xs font-medium truncate">{label}</span>
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
    <div className="bg-card border border-card-border rounded-xl p-3">
      <div className="grid grid-cols-2 gap-2">
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
    </div>
  );
});
