import { memo } from "react";
import { Lightbulb, Camera, Palette, Database, Settings } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { SettingsCategory } from "./SettingsChips";

interface CategoryTipsProps {
  category: SettingsCategory;
}

const categoryIcons = {
  camera: Camera,
  interface: Palette,
  data: Database,
  system: Settings,
};

export const CategoryTips = memo(function CategoryTips({ category }: CategoryTipsProps) {
  const { t } = useI18n();
  
  const tips = t.settings.categoryTips[category];
  const CategoryIcon = categoryIcons[category];
  
  if (!tips) return null;
  
  const tipsList = [tips.tip1, tips.tip2, tips.tip3, tips.tip4].filter(Boolean);
  
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-4">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 text-primary">
            <Lightbulb className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {t.settings.categoryTips.title}
          </h3>
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted/50 text-muted-foreground ml-auto">
            <CategoryIcon className="w-3.5 h-3.5" />
          </div>
        </div>
        
        <ul className="space-y-2">
          {tipsList.map((tip, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0 mt-0.5">
                {index + 1}
              </span>
              <span className="leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
