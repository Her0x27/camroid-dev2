import { memo, useMemo } from "react";
import { 
  Sun, 
  Languages, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Camera, 
  Sparkles,
  Target,
  Focus,
  Waves,
  SunMedium,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LockedSlider } from "@/components/ui/locked-slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsCard } from "../components/SettingsCard";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme-context";
import type { Settings, CameraResolution, StabilizationSettings, EnhancementSettings } from "@shared/schema";

interface LanguageOption {
  code: string;
  nativeName: string;
}

interface MainSettingsTabProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  updateStabilization: (updates: Partial<StabilizationSettings>) => void;
  updateEnhancement: (updates: Partial<EnhancementSettings>) => void;
  language: string;
  setLanguage: (lang: "en" | "ru") => void;
  availableLanguages: LanguageOption[];
  onShowResetDialog: () => void;
}

export const MainSettingsTab = memo(function MainSettingsTab({
  settings,
  updateSettings,
  updateStabilization,
  updateEnhancement,
  language,
  setLanguage,
  availableLanguages,
  onShowResetDialog,
}: MainSettingsTabProps) {
  const { t } = useI18n();
  const { themeId, setThemeById, availableThemes } = useTheme();

  const resolutionOptions = useMemo(() => [
    { value: "auto" as CameraResolution, label: t.settings.camera.auto },
    { value: "4k" as CameraResolution, label: t.settings.camera.res4k },
    { value: "1080p" as CameraResolution, label: t.settings.camera.res1080p },
    { value: "720p" as CameraResolution, label: t.settings.camera.res720p },
    { value: "480p" as CameraResolution, label: t.settings.camera.res480p },
  ], [t]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3 p-4 rounded-xl bg-card border">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Sun className="w-4 h-4 text-primary" />
            {t.settings.theme.mode}
          </Label>
          <Select value={themeId} onValueChange={setThemeById}>
            <SelectTrigger data-testid="select-theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableThemes.map((themeOption) => (
                <SelectItem key={themeOption.id} value={themeOption.id}>
                  {themeOption.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 p-4 rounded-xl bg-card border">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Languages className="w-4 h-4 text-primary" />
            {t.settings.general.language}
          </Label>
          <Select
            value={language}
            onValueChange={(val) => setLanguage(val as "en" | "ru")}
          >
            <SelectTrigger data-testid="select-language">
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
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 rounded-xl bg-card border">
          <Label htmlFor="sound-enabled" className="flex items-center gap-3 cursor-pointer">
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
            <div>
              <span className="text-sm font-medium">{t.settings.general.captureSound}</span>
              <p className="text-xs text-muted-foreground">{t.settings.general.captureSoundDesc}</p>
            </div>
          </Label>
          <Switch
            id="sound-enabled"
            checked={settings.soundEnabled}
            onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
            data-testid="switch-sound"
          />
        </div>

        <div className="flex items-center justify-center p-4 rounded-xl bg-card border">
          <Button
            variant="outline"
            className="w-full"
            onClick={onShowResetDialog}
            data-testid="button-reset-settings"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t.settings.reset.resetAllSettings}
          </Button>
        </div>
      </div>

      <SettingsCard
        icon={<Camera className="w-5 h-5" />}
        title={t.settings.sections?.cameraParams || "Параметры камеры"}
        testId="section-camera-params"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">{t.settings.camera.resolution}</Label>
            <Select
              value={settings.cameraResolution}
              onValueChange={(value) =>
                updateSettings({ cameraResolution: value as CameraResolution })
              }
            >
              <SelectTrigger data-testid="select-camera-resolution">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resolutionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t.settings.camera.resolutionDesc}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{t.settings.camera.quality}</Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.photoQuality}%
              </span>
            </div>
            <LockedSlider
              value={[settings.photoQuality]}
              onValueChange={([value]) => updateSettings({ photoQuality: value })}
              min={50}
              max={100}
              step={1}
              data-testid="slider-photo-quality"
            />
            <p className="text-xs text-muted-foreground">{t.settings.camera.qualityDesc}</p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="gps-enabled" className="flex items-center gap-2 cursor-pointer">
              <MapPin className="w-4 h-4 text-primary" />
              <div>
                <span className="text-sm">{t.settings.capture.gpsLocation}</span>
                <p className="text-xs text-muted-foreground">{t.settings.capture.gpsLocationDesc}</p>
              </div>
            </Label>
            <Switch
              id="gps-enabled"
              checked={settings.gpsEnabled}
              onCheckedChange={(checked) => updateSettings({ gpsEnabled: checked })}
              data-testid="switch-gps"
            />
          </div>

          {settings.gpsEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4" />
                  {t.settings.capture.accuracyLimit}
                </Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {settings.accuracyLimit || 20}m
                </span>
              </div>
              <LockedSlider
                value={[settings.accuracyLimit || 20]}
                onValueChange={([value]) => updateSettings({ accuracyLimit: value })}
                min={5}
                max={100}
                step={5}
                data-testid="slider-accuracy-limit"
              />
            </div>
          )}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<Sparkles className="w-5 h-5" />}
        title={t.settings.sections?.imageQuality || "Качество изображения"}
        testId="section-image-quality"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="stabilization-enabled" className="flex items-center gap-2 cursor-pointer">
              <Target className="w-4 h-4 text-primary" />
              <div>
                <span className="text-sm">{t.settings.imageQuality.stabilization}</span>
                <p className="text-xs text-muted-foreground">{t.settings.imageQuality.stabilizationDesc}</p>
              </div>
            </Label>
            <Switch
              id="stabilization-enabled"
              checked={settings.stabilization.enabled}
              onCheckedChange={(checked) => updateStabilization({ enabled: checked })}
              data-testid="switch-stabilization"
            />
          </div>

          {settings.stabilization.enabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t.settings.imageQuality.stabilityThreshold}</Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {settings.stabilization.threshold}%
                </span>
              </div>
              <LockedSlider
                value={[settings.stabilization.threshold]}
                onValueChange={([value]) => updateStabilization({ threshold: value })}
                min={30}
                max={90}
                step={5}
                data-testid="slider-stability-threshold"
              />
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Label htmlFor="enhancement-enabled" className="flex items-center gap-2 cursor-pointer">
            <Focus className="w-4 h-4 text-primary" />
            <div>
              <span className="text-sm">{t.settings.imageQuality.enhancement}</span>
              <p className="text-xs text-muted-foreground">{t.settings.imageQuality.enhancementDesc}</p>
            </div>
          </Label>
          <Switch
            id="enhancement-enabled"
            checked={settings.enhancement.enabled}
            onCheckedChange={(checked) => updateEnhancement({ enabled: checked })}
            data-testid="switch-enhancement"
          />
        </div>

        {settings.enhancement.enabled && (
          <>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <Focus className="w-4 h-4" />
                    {t.settings.imageQuality.sharpness}
                  </Label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {settings.enhancement.sharpness}%
                  </span>
                </div>
                <LockedSlider
                  value={[settings.enhancement.sharpness]}
                  onValueChange={([value]) => updateEnhancement({ sharpness: value })}
                  min={0}
                  max={100}
                  step={5}
                  data-testid="slider-sharpness"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <Waves className="w-4 h-4" />
                    {t.settings.imageQuality.denoise}
                  </Label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {settings.enhancement.denoise}%
                  </span>
                </div>
                <LockedSlider
                  value={[settings.enhancement.denoise]}
                  onValueChange={([value]) => updateEnhancement({ denoise: value })}
                  min={0}
                  max={100}
                  step={5}
                  data-testid="slider-denoise"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <SunMedium className="w-4 h-4" />
                    {t.settings.imageQuality.contrast}
                  </Label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {settings.enhancement.contrast}%
                  </span>
                </div>
                <LockedSlider
                  value={[settings.enhancement.contrast]}
                  onValueChange={([value]) => updateEnhancement({ contrast: value })}
                  min={0}
                  max={100}
                  step={5}
                  data-testid="slider-contrast"
                />
              </div>
            </div>
          </>
        )}
      </SettingsCard>
    </div>
  );
});
