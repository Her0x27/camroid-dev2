import { memo } from "react";
import { Sparkles, Focus, Waves, SunMedium, Target } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { SettingRow } from "@/components/ui/setting-row";
import { SettingSlider } from "@/components/ui/setting-slider";
import { useI18n } from "@/lib/i18n";
import type { Settings, StabilizationSettings, EnhancementSettings } from "@shared/schema";

interface ImageQualitySectionProps {
  settings: Settings;
  updateStabilization: (updates: Partial<StabilizationSettings>) => void;
  updateEnhancement: (updates: Partial<EnhancementSettings>) => void;
}

export const ImageQualitySection = memo(function ImageQualitySection({
  settings,
  updateStabilization,
  updateEnhancement,
}: ImageQualitySectionProps) {
  const { t } = useI18n();
  
  return (
    <CollapsibleCard
      icon={<Sparkles className="w-5 h-5" />}
      title={t.settings.imageQuality.title}
      description={t.settings.imageQuality.description}
      testId="section-image-quality"
    >
      <SettingRow
        id="stabilization-enabled"
        icon={<Target className="w-4 h-4" />}
        label={t.settings.imageQuality.stabilization}
        description={t.settings.imageQuality.stabilizationDesc}
        checked={settings.stabilization.enabled}
        onCheckedChange={(checked) => updateStabilization({ enabled: checked })}
        testId="switch-stabilization"
      />

      {settings.stabilization.enabled && (
        <>
          <Separator />
          <SettingSlider
            label={t.settings.imageQuality.stabilityThreshold}
            description={t.settings.imageQuality.stabilityThresholdDesc}
            value={settings.stabilization.threshold}
            onValueChange={(value) => updateStabilization({ threshold: value })}
            min={30}
            max={90}
            step={5}
            testId="slider-stability-threshold"
          />
        </>
      )}

      <Separator />

      <SettingRow
        id="enhancement-enabled"
        icon={<Focus className="w-4 h-4" />}
        label={t.settings.imageQuality.enhancement}
        description={t.settings.imageQuality.enhancementDesc}
        checked={settings.enhancement.enabled}
        onCheckedChange={(checked) => updateEnhancement({ enabled: checked })}
        testId="switch-enhancement"
      />

      {settings.enhancement.enabled && (
        <>
          <Separator />
          <SettingSlider
            icon={<Focus className="w-4 h-4" />}
            label={t.settings.imageQuality.sharpness}
            description={t.settings.imageQuality.sharpnessDesc}
            value={settings.enhancement.sharpness}
            onValueChange={(value) => updateEnhancement({ sharpness: value })}
            min={0}
            max={100}
            step={5}
            testId="slider-sharpness"
          />

          <Separator />

          <SettingSlider
            icon={<Waves className="w-4 h-4" />}
            label={t.settings.imageQuality.denoise}
            description={t.settings.imageQuality.denoiseDesc}
            value={settings.enhancement.denoise}
            onValueChange={(value) => updateEnhancement({ denoise: value })}
            min={0}
            max={100}
            step={5}
            testId="slider-denoise"
          />

          <Separator />

          <SettingSlider
            icon={<SunMedium className="w-4 h-4" />}
            label={t.settings.imageQuality.contrast}
            description={t.settings.imageQuality.contrastDesc}
            value={settings.enhancement.contrast}
            onValueChange={(value) => updateEnhancement({ contrast: value })}
            min={0}
            max={100}
            step={5}
            testId="slider-contrast"
          />
        </>
      )}
    </CollapsibleCard>
  );
});
