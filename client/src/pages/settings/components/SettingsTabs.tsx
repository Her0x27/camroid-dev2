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

  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <Tabs value={activeTab} className="fixed left-3 top-1/2 -translate-y-1/2 z-50">
      <div className="relative">
        <div className="absolute -inset-2 bg-primary/30 rounded-3xl blur-xl opacity-60" />
        
        <div className={cn(
          "relative overflow-hidden",
          "bg-zinc-900/95 backdrop-blur-xl",
          "border border-zinc-700/80",
          "rounded-2xl",
          "shadow-2xl shadow-black/40"
        )}>
          <div className="px-3 py-2 border-b border-zinc-700/50">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Меню
            </span>
          </div>
          
          <TabsList className="relative p-2 flex flex-col gap-0.5 bg-transparent">
            <div 
              className="absolute left-2 w-1 h-9 bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ top: `${8 + activeIndex * 40}px` }}
            />
            
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                onClick={() => {
                  triggerHapticFeedback();
                  onTabChange(tab.id);
                }}
                className={cn(
                  "flex items-center gap-3 w-full h-9 px-4 rounded-lg text-left",
                  "transition-all duration-200",
                  "data-[state=active]:bg-zinc-800 data-[state=active]:text-white",
                  "data-[state=inactive]:text-zinc-400",
                  "data-[state=inactive]:hover:text-zinc-200 data-[state=inactive]:hover:bg-zinc-800/50"
                )}
              >
                {tab.icon}
                <span className="text-xs font-medium">{getTabLabel(tab.labelKey)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>
    </Tabs>
  );
});
