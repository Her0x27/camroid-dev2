import { memo, useCallback } from "react";
import { Crosshair, Eye, Palette, Hand, Timer, Move } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingRow } from "@/components/ui/setting-row";
import { SettingSlider } from "@/components/ui/setting-slider";
import { useI18n } from "@/lib/i18n";
import { usePreview } from "../contexts/PreviewContext";
import type { Settings, ReticleConfig, ColorScheme } from "@shared/schema";

interface ReticleSectionProps {
  settings: Settings;
  updateReticle: (updates: Partial<ReticleConfig>) => void;
}

export const ReticleSection = memo(function ReticleSection({
  settings,
  updateReticle,
}: ReticleSectionProps) {
  const { t } = useI18n();
  const { activatePreview, deactivatePreview } = usePreview();
  
  const handleInteractionStart = useCallback(() => {
    activatePreview("reticle");
  }, [activatePreview]);
  
  const handleInteractionEnd = useCallback(() => {
    deactivatePreview();
  }, [deactivatePreview]);
  
  return (
    <CollapsibleCard
      icon={<Crosshair className="w-5 h-5" />}
      title={t.settings.crosshair.title}
      description={t.settings.crosshair.description}
      testId="section-reticle"
    >
      <SettingRow
        id="reticle-enabled"
        icon={<Eye className="w-4 h-4" />}
        label={t.settings.crosshair.showCrosshair}
        description={t.settings.crosshair.showCrosshairDesc}
        checked={settings.reticle.enabled}
        onCheckedChange={(checked) => updateReticle({ enabled: checked })}
        testId="switch-reticle-enabled"
      />

      {settings.reticle.enabled && (
        <>
          <Separator />
          
          <SettingSlider
            icon={<Crosshair className="w-4 h-4" />}
            label={t.settings.crosshair.size}
            description={t.settings.crosshair.sizeDesc}
            value={settings.reticle.size}
            onValueChange={(value) => updateReticle({ size: value })}
            min={1}
            max={50}
            step={1}
            testId="slider-reticle-size"
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
          />

          <Separator />

          <SettingSlider
            icon={<Crosshair className="w-4 h-4" />}
            label={t.settings.crosshair.thickness}
            description={t.settings.crosshair.thicknessDesc}
            value={settings.reticle.strokeWidth || 3}
            onValueChange={(value) => updateReticle({ strokeWidth: value })}
            min={1}
            max={30}
            step={1}
            testId="slider-stroke-width"
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
          />

          <Separator />

          <SettingSlider
            icon={<Eye className="w-4 h-4" />}
            label={t.settings.crosshair.opacity}
            description={t.settings.crosshair.opacityDesc}
            value={settings.reticle.opacity}
            onValueChange={(value) => updateReticle({ opacity: value })}
            min={10}
            max={100}
            step={5}
            testId="slider-opacity"
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
          />

          <Separator />

          <SettingRow
            id="auto-color"
            icon={<Palette className="w-4 h-4" />}
            label={t.settings.crosshair.autoColor}
            description={t.settings.crosshair.autoColorDesc}
            checked={settings.reticle.autoColor}
            onCheckedChange={(checked) => updateReticle({ autoColor: checked })}
            testId="switch-auto-color"
          />

          {settings.reticle.autoColor && (
            <div className="space-y-2">
              <Label htmlFor="color-scheme" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {t.settings.crosshair.colorScheme}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t.settings.crosshair.colorSchemeDesc}
              </p>
              <Select 
                value={settings.reticle.colorScheme || "tactical"}
                onValueChange={(value) => updateReticle({ colorScheme: value as ColorScheme })}
              >
                <SelectTrigger id="color-scheme" data-testid="select-color-scheme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["contrast", "tactical", "neon", "monochrome", "warm"] as const).map((scheme) => (
                    <SelectItem key={scheme} value={scheme} data-testid={`option-scheme-${scheme}`}>
                      {t.settings.crosshair.schemes[scheme]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          <SettingRow
            id="tap-to-position"
            icon={<Hand className="w-4 h-4" />}
            label={t.settings.crosshair.tapToPosition}
            description={t.settings.crosshair.tapToPositionDesc}
            checked={settings.reticle.tapToPosition || false}
            onCheckedChange={(checked) => updateReticle({ tapToPosition: checked })}
            testId="switch-tap-to-position"
          />

          {settings.reticle.tapToPosition && (
            <>
              <SettingSlider
                icon={<Timer className="w-4 h-4" />}
                label={t.settings.crosshair.longPressDelay}
                description={t.settings.crosshair.longPressDelayDesc}
                value={settings.reticle.longPressDelay || 500}
                onValueChange={(value) => updateReticle({ longPressDelay: value })}
                min={300}
                max={1500}
                step={100}
                unit={t.settings.crosshair.ms}
                testId="slider-long-press-delay"
              />

              <SettingRow
                id="manual-adjustment"
                icon={<Move className="w-4 h-4" />}
                label={t.settings.crosshair.manualAdjustment}
                description={t.settings.crosshair.manualAdjustmentDesc}
                checked={settings.reticle.manualAdjustment || false}
                onCheckedChange={(checked) => updateReticle({ manualAdjustment: checked })}
                testId="switch-manual-adjustment"
              />
            </>
          )}
        </>
      )}
    </CollapsibleCard>
  );
});
