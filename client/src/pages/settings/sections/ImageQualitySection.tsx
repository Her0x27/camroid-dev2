import { memo } from "react";
import { Sparkles, Focus, Waves, SunMedium, Target } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { LockedSlider } from "@/components/ui/locked-slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
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
      <div className="flex items-center justify-between">
        <Label htmlFor="stabilization-enabled" className="flex items-center gap-2 cursor-pointer">
          <Target className="w-4 h-4" />
          <div>
            <span>{t.settings.imageQuality.stabilization}</span>
            <p className="text-xs text-muted-foreground font-normal">
              {t.settings.imageQuality.stabilizationDesc}
            </p>
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
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                {t.settings.imageQuality.stabilityThreshold}
              </Label>
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
            <p className="text-xs text-muted-foreground">
              {t.settings.imageQuality.stabilityThresholdDesc}
            </p>
          </div>
        </>
      )}

      <Separator />

      <div className="flex items-center justify-between">
        <Label htmlFor="enhancement-enabled" className="flex items-center gap-2 cursor-pointer">
          <Focus className="w-4 h-4" />
          <div>
            <span>{t.settings.imageQuality.enhancement}</span>
            <p className="text-xs text-muted-foreground font-normal">
              {t.settings.imageQuality.enhancementDesc}
            </p>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
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
        </>
      )}
    </CollapsibleCard>
  );
});
