import { memo } from "react";
import { Camera, Palette, Database, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export type SettingsCategory = "camera" | "interface" | "data" | "system";

interface SettingsTabsProps {
  activeCategory: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
}

interface TabConfig {
  id: SettingsCategory;
  icon: React.ReactNode;
  labelKey: keyof typeof import("@/lib/i18n/en").en.settings.categories;
}

const tabs: TabConfig[] = [
  { id: "camera", icon: <Camera className="w-5 h-5" />, labelKey: "camera" },
  { id: "interface", icon: <Palette className="w-5 h-5" />, labelKey: "interface" },
  { id: "data", icon: <Database className="w-5 h-5" />, labelKey: "data" },
  { id: "system", icon: <Settings className="w-5 h-5" />, labelKey: "system" },
];

export const SettingsTabs = memo(function SettingsTabs({
  activeCategory,
  onCategoryChange,
}: SettingsTabsProps) {
  const { t } = useI18n();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom">
      <nav className="flex justify-around items-stretch max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeCategory === tab.id;
          const label = t.settings.categories[tab.labelKey as keyof typeof t.settings.categories];
          
          return (
            <button
              key={tab.id}
              onClick={() => onCategoryChange(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 transition-colors touch-manipulation",
                "active:bg-muted/50 select-none min-h-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive && "bg-primary/10"
              )}>
                {tab.icon}
              </div>
              <span className={cn(
                "text-xs font-medium",
                isActive && "font-semibold"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
});
