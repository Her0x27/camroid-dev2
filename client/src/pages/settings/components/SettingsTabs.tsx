import { memo } from "react";
import { Settings, Shield, Database } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { triggerHapticFeedback } from "@/lib/haptic-utils";
import { cn } from "@/lib/utils";

export type SettingsTab = "main" | "privacy" | "storage";

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

interface TabConfig {
  id: SettingsTab;
  icon: React.ReactNode;
  labelKey: "main" | "privacy" | "storage";
}

const tabs: TabConfig[] = [
  { id: "main", icon: <Settings className="w-4 h-4" />, labelKey: "main" },
  { id: "privacy", icon: <Shield className="w-4 h-4" />, labelKey: "privacy" },
  { id: "storage", icon: <Database className="w-4 h-4" />, labelKey: "storage" },
];

export const SettingsTabs = memo(function SettingsTabs({
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  const { t } = useI18n();

  const getTabLabel = (key: string) => {
    const labels: Record<string, string> = {
      main: t.settings.tabs?.main || "Основные",
      privacy: t.settings.tabs?.privacy || "Приватность",
      storage: t.settings.tabs?.storage || "Хранилище",
    };
    return labels[key] || key;
  };

  return (
    <Tabs value={activeTab} className="fixed left-3 top-1/2 -translate-y-1/2 z-50">
      <div className="relative">
        <div className="absolute -inset-1 bg-primary/40 rounded-3xl blur-lg" />
        <TabsList className={cn(
          "relative p-2 flex flex-col gap-1.5",
          "bg-zinc-900/95 backdrop-blur-xl",
          "border-2 border-primary/50",
          "rounded-2xl",
          "shadow-2xl"
        )}>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              onClick={() => {
                triggerHapticFeedback();
                onTabChange(tab.id);
              }}
              className={cn(
                "flex items-center justify-center w-11 h-11 rounded-xl",
                "transition-all duration-200",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                "data-[state=active]:shadow-lg data-[state=active]:scale-110",
                "data-[state=inactive]:text-zinc-400",
                "data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-zinc-800"
              )}
              title={getTabLabel(tab.labelKey)}
            >
              {tab.icon}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
});
