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
        "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all min-w-[72px] touch-manipulation",
        "active:scale-95 select-none",
        active
          ? "bg-primary text-primary-foreground shadow-md"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
      )}
    >
      <div className="w-6 h-6 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-xs font-medium whitespace-nowrap">{label}</span>
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
    <div className="bg-card border border-card-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        {t.settings.quickSettings.title}
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <QuickSettingButton
          icon={<Target className="w-5 h-5" />}
          label={t.settings.quickSettings.stabilization}
          active={settings.stabilization?.enabled ?? false}
          onClick={() => updateStabilization({ enabled: !settings.stabilization?.enabled })}
        />
        <QuickSettingButton
          icon={<MapPin className="w-5 h-5" />}
          label={t.settings.quickSettings.gps}
          active={settings.gpsEnabled}
          onClick={() => updateSettings({ gpsEnabled: !settings.gpsEnabled })}
        />
        <QuickSettingButton
          icon={settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          label={t.settings.quickSettings.sound}
          active={settings.soundEnabled}
          onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
        />
        <QuickSettingButton
          icon={theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          label={t.settings.quickSettings.theme}
          active={theme === "dark"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        />
      </div>
    </div>
  );
});
