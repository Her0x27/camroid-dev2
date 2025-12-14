import { memo, useMemo } from "react";
import { 
  Sun, 
  Palette,
  Globe,
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Camera, 
  Sparkles,
  Target,
  Focus,
  MapPin,
  Image,
  Contrast,
  Eraser
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LockedSlider } from "@/components/ui/locked-slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsCard } from "../components/SettingsCard";
import { 
  SettingItem, 
  SettingItemCompact, 
  SettingSliderItem, 
  SettingSelectItem 
} from "../components/SettingItem";
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
    <div className="space-y-4">
      <SettingsCard
        icon={<Sun className="w-5 h-5" />}
        title={t.settings.sections?.appearance || "Внешний вид"}
        testId="section-appearance"
      >
        <div className="space-y-3">
          <SettingSelectItem
            icon={<Palette className="w-5 h-5" />}
            title={t.settings.theme.mode}
            description={t.settings.theme.modeDesc || "Выберите цветовую тему приложения"}
            testId="setting-theme"
          >
            <Select value={themeId} onValueChange={setThemeById}>
              <SelectTrigger className="h-11" data-testid="select-theme">
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
          </SettingSelectItem>

          <SettingSelectItem
            icon={<Globe className="w-5 h-5" />}
            title={t.settings.general.language}
            description={t.settings.general.languageDesc}
            testId="setting-language"
          >
            <Select
              value={language}
              onValueChange={(val) => setLanguage(val as "en" | "ru")}
            >
              <SelectTrigger className="h-11" data-testid="select-language">
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
          </SettingSelectItem>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<Volume2 className="w-5 h-5" />}
        title={t.settings.sections?.controls || "Управление"}
        testId="section-controls"
      >
        <div className="space-y-3">
          <SettingItemCompact
            icon={settings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            title={t.settings.general.captureSound}
            description={t.settings.general.captureSoundDesc}
            testId="setting-sound"
          >
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
              data-testid="switch-sound"
            />
          </SettingItemCompact>

          <SettingItemCompact
            icon={<RotateCcw className="w-4 h-4" />}
            title={t.settings.reset.resetAllSettings}
            description={t.settings.reset.resetSettingsDesc || "Сбросить все настройки к значениям по умолчанию"}
            testId="setting-reset"
          >
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] h-11 px-4"
              onClick={onShowResetDialog}
              data-testid="button-reset-settings"
            >
              {t.common.reset}
            </Button>
          </SettingItemCompact>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<Camera className="w-5 h-5" />}
        title={t.settings.sections?.cameraParams || "Параметры камеры"}
        testId="section-camera-params"
      >
        <div className="space-y-3">
          <SettingSelectItem
            icon={<Camera className="w-5 h-5" />}
            title={t.settings.camera.resolution}
            description={t.settings.camera.resolutionDesc}
            platformTip={{
              ios: "iOS поддерживает до 4K разрешения на большинстве устройств",
              android: "Максимальное разрешение зависит от возможностей камеры устройства",
              desktop: "Разрешение зависит от подключенной веб-камеры",
            }}
            testId="setting-resolution"
          >
            <Select
              value={settings.cameraResolution}
              onValueChange={(value) =>
                updateSettings({ cameraResolution: value as CameraResolution })
              }
            >
              <SelectTrigger className="h-11" data-testid="select-camera-resolution">
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
          </SettingSelectItem>

          <SettingSliderItem
            icon={<Image className="w-5 h-5" />}
            title={t.settings.camera.quality}
            description={t.settings.camera.qualityDesc}
            value={settings.photoQuality}
            unit="%"
            platformTip={{
              ios: "85-90% — оптимальный баланс качества и размера для iOS",
              android: "85-90% — оптимальный баланс качества и размера для Android",
              desktop: "85-90% — оптимальный баланс качества и размера",
            }}
            testId="setting-quality"
          >
            <LockedSlider
              value={[settings.photoQuality]}
              onValueChange={([value]) => updateSettings({ photoQuality: value })}
              min={50}
              max={100}
              step={1}
              className="py-2"
              data-testid="slider-photo-quality"
            />
          </SettingSliderItem>

          <SettingSliderItem
            icon={<MapPin className="w-5 h-5" />}
            title={t.settings.capture.accuracyLimit}
            description={t.settings.capture.accuracyLimitDesc || "Максимальная погрешность GPS при съёмке"}
            value={settings.accuracyLimit || 20}
            unit="m"
            platformTip={{
              ios: "iOS обычно обеспечивает более высокую точность GPS (5-10м)",
              android: "Точность GPS зависит от датчиков устройства и окружения",
              desktop: "Точность зависит от метода геолокации браузера",
            }}
            testId="setting-accuracy"
          >
            <LockedSlider
              value={[settings.accuracyLimit || 20]}
              onValueChange={([value]) => updateSettings({ accuracyLimit: value })}
              min={5}
              max={100}
              step={5}
              className="py-2"
              data-testid="slider-accuracy-limit"
            />
          </SettingSliderItem>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<Sparkles className="w-5 h-5" />}
        title={t.settings.sections?.imageQuality || "Качество изображения"}
        testId="section-image-quality"
      >
        <div className="space-y-3">
          <SettingItem
            icon={<Target className="w-5 h-5" />}
            title={t.settings.imageQuality.stabilization}
            description={t.settings.imageQuality.stabilizationDesc}
            platformTip={{
              ios: "iOS эффективно использует гироскоп для стабилизации",
              android: "Android может требовать более высокий порог стабилизации",
              desktop: "Стабилизация рекомендуется для веб-камер",
            }}
            testId="setting-stabilization"
          >
            <Switch
              checked={settings.stabilization.enabled}
              onCheckedChange={(checked) => updateStabilization({ enabled: checked })}
              data-testid="switch-stabilization"
            />
          </SettingItem>

          {settings.stabilization.enabled && (
            <SettingSliderItem
              icon={<Target className="w-5 h-5" />}
              title={t.settings.imageQuality.stabilityThreshold}
              description={t.settings.imageQuality.stabilityThresholdDesc || "Порог срабатывания стабилизации"}
              value={settings.stabilization.threshold}
              unit="%"
              platformTip={{
                android: "Для Android рекомендуется значение 60-70%",
              }}
              testId="setting-stability-threshold"
            >
              <LockedSlider
                value={[settings.stabilization.threshold]}
                onValueChange={([value]) => updateStabilization({ threshold: value })}
                min={30}
                max={90}
                step={5}
                className="py-2"
                data-testid="slider-stability-threshold"
              />
            </SettingSliderItem>
          )}

          <SettingItem
            icon={<Focus className="w-5 h-5" />}
            title={t.settings.imageQuality.enhancement}
            description={t.settings.imageQuality.enhancementDesc}
            testId="setting-enhancement"
          >
            <Switch
              checked={settings.enhancement.enabled}
              onCheckedChange={(checked) => updateEnhancement({ enabled: checked })}
              data-testid="switch-enhancement"
            />
          </SettingItem>

          {settings.enhancement.enabled && (
            <>
              <SettingSliderItem
                icon={<Focus className="w-5 h-5" />}
                title={t.settings.imageQuality.sharpness}
                description={t.settings.imageQuality.sharpnessDesc || "Уровень повышения резкости изображения"}
                value={settings.enhancement.sharpness}
                unit="%"
                testId="setting-sharpness"
              >
                <LockedSlider
                  value={[settings.enhancement.sharpness]}
                  onValueChange={([value]) => updateEnhancement({ sharpness: value })}
                  min={0}
                  max={100}
                  step={5}
                  className="py-2"
                  data-testid="slider-sharpness"
                />
              </SettingSliderItem>

              <SettingSliderItem
                icon={<Eraser className="w-5 h-5" />}
                title={t.settings.imageQuality.denoise}
                description={t.settings.imageQuality.denoiseDesc || "Уровень подавления цифрового шума"}
                value={settings.enhancement.denoise}
                unit="%"
                testId="setting-denoise"
              >
                <LockedSlider
                  value={[settings.enhancement.denoise]}
                  onValueChange={([value]) => updateEnhancement({ denoise: value })}
                  min={0}
                  max={100}
                  step={5}
                  className="py-2"
                  data-testid="slider-denoise"
                />
              </SettingSliderItem>

              <SettingSliderItem
                icon={<Contrast className="w-5 h-5" />}
                title={t.settings.imageQuality.contrast}
                description={t.settings.imageQuality.contrastDesc || "Уровень повышения контрастности"}
                value={settings.enhancement.contrast}
                unit="%"
                testId="setting-contrast"
              >
                <LockedSlider
                  value={[settings.enhancement.contrast]}
                  onValueChange={([value]) => updateEnhancement({ contrast: value })}
                  min={0}
                  max={100}
                  step={5}
                  className="py-2"
                  data-testid="slider-contrast"
                />
              </SettingSliderItem>
            </>
          )}
        </div>
      </SettingsCard>
    </div>
  );
});
