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
    <Tabs value={activeTab}>
      <TabsList className="h-9 p-1 bg-muted/50 rounded-lg flex gap-0.5">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            onClick={() => {
              triggerHapticFeedback();
              onTabChange(tab.id);
            }}
            className={cn(
              "flex items-center justify-center w-9 h-7 rounded-md",
              "transition-all duration-200",
              "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
            )}
            title={getTabLabel(tab.labelKey)}
          >
            {tab.icon}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
});
