import { memo } from "react";
import { 
  Settings2, 
  Languages, 
  Volume2, 
  VolumeX 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { SettingRow } from "@/components/ui/setting-row";
import type { Settings } from "@shared/schema";
import type { Translations } from "@/lib/i18n";

interface LanguageOption {
  code: string;
  nativeName: string;
}

interface GeneralSettingsSectionProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  language: string;
  setLanguage: (lang: "en" | "ru") => void;
  availableLanguages: LanguageOption[];
  t: Translations;
}

export const GeneralSettingsSection = memo(function GeneralSettingsSection({
  settings,
  updateSettings,
  language,
  setLanguage,
  availableLanguages,
  t,
}: GeneralSettingsSectionProps) {
  return (
    <CollapsibleCard
      icon={<Settings2 className="w-5 h-5" />}
      title={t.settings.general.title}
      description={t.settings.general.description}
      testId="section-general-settings"
    >
      <SettingRow
        id="language"
        icon={<Languages className="w-4 h-4" />}
        label={t.settings.general.language}
        description={t.settings.general.languageDesc}
        control={
          <Select
            value={language}
            onValueChange={(val) => setLanguage(val as "en" | "ru")}
          >
            <SelectTrigger className="w-32" data-testid="select-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Separator />

      <SettingRow
        id="sound-enabled"
        icon={settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        label={t.settings.general.captureSound}
        description={t.settings.general.captureSoundDesc}
        checked={settings.soundEnabled}
        onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
        testId="switch-sound"
      />
    </CollapsibleCard>
  );
});
