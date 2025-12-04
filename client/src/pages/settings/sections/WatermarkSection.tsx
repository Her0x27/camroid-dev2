import { memo } from "react";
import { ImageIcon, Eye, Type } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { SettingRow } from "@/components/ui/setting-row";
import { SettingSlider } from "@/components/ui/setting-slider";
import { useI18n } from "@/lib/i18n";
import type { Settings, ReticleConfig } from "@shared/schema";

interface WatermarkSectionProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  updateReticle: (updates: Partial<ReticleConfig>) => void;
}

export const WatermarkSection = memo(function WatermarkSection({
  settings,
  updateSettings,
  updateReticle,
}: WatermarkSectionProps) {
  const { t } = useI18n();
  
  return (
    <CollapsibleCard
      icon={<ImageIcon className="w-5 h-5" />}
      title={t.settings.watermark.title}
      description={t.settings.watermark.description}
      testId="section-watermark"
    >
      <SettingRow
        id="show-metadata"
        icon={<Eye className="w-4 h-4" />}
        label={t.settings.watermark.showMetadata}
        description={t.settings.watermark.showMetadataDesc}
        checked={settings.reticle.showMetadata}
        onCheckedChange={(checked) => updateReticle({ showMetadata: checked })}
        testId="switch-show-metadata"
      />

      {settings.reticle.showMetadata && (
        <>
          <Separator />
          <SettingSlider
            icon={<Type className="w-4 h-4" />}
            label={t.settings.watermark.watermarkSize}
            description={t.settings.watermark.watermarkSizeDesc}
            value={settings.watermarkScale || 100}
            onValueChange={(value) => updateSettings({ watermarkScale: value })}
            min={50}
            max={150}
            step={10}
            testId="slider-watermark-scale"
          />
        </>
      )}
    </CollapsibleCard>
  );
});
