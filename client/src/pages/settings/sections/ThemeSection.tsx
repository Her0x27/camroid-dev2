import { memo } from "react";
import { Moon, Sun } from "lucide-react";
import { Label } from "@/components/ui/label";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme-context";

export const ThemeSection = memo(function ThemeSection() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <CollapsibleCard
      icon={<Sun className="w-5 h-5" />}
      title={t.settings.theme.title}
      description={t.settings.theme.description}
      testId="section-theme"
      defaultOpen={false}
    >
      <div className="space-y-2">
        <Label htmlFor="theme-select" className="flex items-center gap-2">
          <Moon className="w-4 h-4" />
          {t.settings.theme.mode}
        </Label>
        <p className="text-xs text-muted-foreground">
          {t.settings.theme.modeDesc}
        </p>
        <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark")}>
          <SelectTrigger id="theme-select" data-testid="select-theme">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light" data-testid="option-theme-light">
              {t.settings.theme.light}
            </SelectItem>
            <SelectItem value="dark" data-testid="option-theme-dark">
              {t.settings.theme.dark}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CollapsibleCard>
  );
});
