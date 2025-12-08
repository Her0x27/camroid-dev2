import { memo, useRef, useEffect } from "react";
import { Camera, Palette, Database, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export type SettingsCategory = "camera" | "interface" | "data" | "system";

interface SettingsChipsProps {
  activeCategory: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
}

interface ChipConfig {
  id: SettingsCategory;
  icon: React.ReactNode;
  labelKey: keyof typeof import("@/lib/i18n/en").en.settings.categories;
}

const chips: ChipConfig[] = [
  { id: "camera", icon: <Camera className="w-4 h-4" />, labelKey: "camera" },
  { id: "interface", icon: <Palette className="w-4 h-4" />, labelKey: "interface" },
  { id: "data", icon: <Database className="w-4 h-4" />, labelKey: "data" },
  { id: "system", icon: <Settings className="w-4 h-4" />, labelKey: "system" },
];

export const SettingsChips = memo(function SettingsChips({
  activeCategory,
  onCategoryChange,
}: SettingsChipsProps) {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeChipRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const chip = activeChipRef.current;
      const containerRect = container.getBoundingClientRect();
      const chipRect = chip.getBoundingClientRect();
      
      const scrollLeft = chip.offsetLeft - container.offsetLeft - (containerRect.width / 2) + (chipRect.width / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeCategory]);

  return (
    <div 
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1 -mx-1"
    >
      {chips.map((chip) => {
        const isActive = activeCategory === chip.id;
        const label = t.settings.categories[chip.labelKey as keyof typeof t.settings.categories];
        
        return (
          <button
            key={chip.id}
            ref={isActive ? activeChipRef : null}
            onClick={() => onCategoryChange(chip.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              "touch-manipulation active:scale-95 select-none shrink-0",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            )}
          >
            {chip.icon}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
});
