import { memo } from "react";
import { Shield, Eye, Hand, Clock3, Settings2, Fingerprint, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LockedSlider } from "@/components/ui/locked-slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { privacyModuleRegistry } from "@/privacy_modules";
import type { Translations } from "@/lib/i18n";

interface PrivacySettings {
  enabled: boolean;
  gestureType: 'patternUnlock' | 'severalFingers';
  secretPattern: string;
  autoLockMinutes: number;
  unlockFingers: number;
  selectedModule: string;
  moduleUnlockValues: Record<string, string>;
}

interface PrivacySectionProps {
  privacySettings: PrivacySettings;
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => void;
  onShowPatternSetup: () => void;
  t: Translations;
}

export const PrivacySection = memo(function PrivacySection({
  privacySettings,
  updatePrivacySettings,
  onShowPatternSetup,
  t,
}: PrivacySectionProps) {
  const currentModule = privacyModuleRegistry.get(privacySettings.selectedModule);
  const currentUnlockValue = privacySettings.moduleUnlockValues[privacySettings.selectedModule] || '';

  const handleModuleUnlockValueChange = (value: string) => {
    updatePrivacySettings({
      moduleUnlockValues: {
        ...privacySettings.moduleUnlockValues,
        [privacySettings.selectedModule]: value,
      },
    });
  };

  return (
    <CollapsibleCard
      icon={<Shield className="w-5 h-5" />}
      title={t.settings.privacy.title}
      description={t.settings.privacy.description}
      testId="section-privacy"
      defaultOpen={false}
    >
      <div className="flex items-center justify-between">
        <Label htmlFor="privacy-enabled" className="flex items-center gap-2 cursor-pointer">
          <Eye className="w-4 h-4" />
          <div>
            <span>{t.settings.privacy.enabled}</span>
            <p className="text-xs text-muted-foreground font-normal">
              {t.settings.privacy.enabledDesc}
            </p>
          </div>
        </Label>
        <Switch
          id="privacy-enabled"
          checked={privacySettings.enabled}
          onCheckedChange={(checked) => updatePrivacySettings({ enabled: checked })}
          data-testid="switch-privacy-enabled"
        />
      </div>

      {privacySettings.enabled && (
        <>
          <Separator />

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              {t.settings.privacy.module}
            </Label>
            <Select
              value={privacySettings.selectedModule}
              onValueChange={(value) => updatePrivacySettings({ selectedModule: value })}
            >
              <SelectTrigger data-testid="select-module">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {privacyModuleRegistry.getAll().map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    <span className="flex items-center gap-2">
                      <module.icon className="w-4 h-4" />
                      {module.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t.settings.privacy.moduleDesc}
            </p>
          </div>

          {currentModule && currentModule.unlockMethod.type !== 'swipePattern' && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  {(t.settings.privacy.moduleUnlock as Record<string, string>)[currentModule.unlockMethod.labelKey] || currentModule.unlockMethod.labelKey}
                </Label>
                <Input
                  type="text"
                  value={currentUnlockValue}
                  onChange={(e) => handleModuleUnlockValueChange(e.target.value)}
                  placeholder={(t.settings.privacy.moduleUnlock as Record<string, string>)[currentModule.unlockMethod.placeholderKey || ''] || currentModule.unlockMethod.defaultValue}
                  data-testid="input-module-unlock"
                />
                {currentModule.unlockMethod.descriptionKey && (
                  <p className="text-xs text-muted-foreground">
                    {(t.settings.privacy.moduleUnlock as Record<string, string>)[currentModule.unlockMethod.descriptionKey] || ''}
                  </p>
                )}
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Hand className="w-4 h-4" />
              {t.settings.privacy.secretGesture}
            </Label>
            <Select
              value={privacySettings.gestureType}
              onValueChange={(value) => updatePrivacySettings({ gestureType: value as 'patternUnlock' | 'severalFingers' })}
            >
              <SelectTrigger data-testid="select-gesture-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patternUnlock">{t.settings.privacy.patternUnlock}</SelectItem>
                <SelectItem value="severalFingers">{t.settings.privacy.severalFingers}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {privacySettings.gestureType === 'patternUnlock'
                ? t.settings.privacy.patternUnlockHint
                : t.settings.privacy.severalFingersHint}
            </p>
          </div>

          {privacySettings.gestureType === 'patternUnlock' && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  {privacySettings.secretPattern ? t.settings.privacy.changePattern : t.settings.privacy.setPattern}
                </Label>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onShowPatternSetup}
                  data-testid="button-set-pattern"
                >
                  {privacySettings.secretPattern ? t.settings.privacy.changeSecretPattern : t.settings.privacy.setSecretPattern}
                </Button>
                {!privacySettings.secretPattern && (
                  <p className="text-xs text-amber-500">
                    {t.settings.privacy.patternNotSet}
                  </p>
                )}
              </div>
            </>
          )}

          {privacySettings.gestureType === 'severalFingers' && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4" />
                    {t.settings.privacy.fingerCount}
                  </Label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {privacySettings.unlockFingers}
                  </span>
                </div>
                <LockedSlider
                  value={[privacySettings.unlockFingers]}
                  onValueChange={([value]) => updatePrivacySettings({ unlockFingers: value })}
                  min={3}
                  max={9}
                  step={1}
                  data-testid="slider-unlock-fingers"
                />
                <p className="text-xs text-muted-foreground">
                  {t.settings.privacy.fingerCountDesc}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock3 className="w-4 h-4" />
                {t.settings.privacy.autoLock}
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {privacySettings.autoLockMinutes} {t.settings.privacy.min}
              </span>
            </div>
            <LockedSlider
              value={[privacySettings.autoLockMinutes]}
              onValueChange={([value]) => updatePrivacySettings({ autoLockMinutes: value })}
              min={1}
              max={30}
              step={1}
              data-testid="slider-auto-lock"
            />
            <p className="text-xs text-muted-foreground">
              {t.settings.privacy.autoLockDesc}
            </p>
          </div>
        </>
      )}
    </CollapsibleCard>
  );
});
