import { memo, useCallback } from "react";
import { useLocation } from "wouter";
import { ImageIcon, Eye, Type, Pencil } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { SettingRow } from "@/components/ui/setting-row";
import { SettingSlider } from "@/components/ui/setting-slider";
import { useI18n } from "@/lib/i18n";
import { usePreview } from "../contexts/PreviewContext";
import type { Settings, ReticleConfig } from "@shared/schema";

interface WatermarkSectionProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  updateReticle: (updates: Partial<ReticleConfig>) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const WatermarkSection = memo(function WatermarkSection({
  settings,
  updateSettings,
  updateReticle,
  isOpen,
  onOpenChange,
}: WatermarkSectionProps) {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const { activatePreview, deactivatePreview } = usePreview();
  
  const handleScaleStart = useCallback(() => {
    activatePreview({ type: "watermark-scale", label: t.settings.watermark.watermarkSize });
  }, [activatePreview, t]);

  const handleOpenEditor = useCallback(() => {
    navigate("/watermark-editor");
  }, [navigate]);
  
  return (
    <CollapsibleCard
      icon={<ImageIcon className="w-5 h-5" />}
      title={t.settings.watermark.title}
      description={t.settings.watermark.description}
      sectionId="watermark"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
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
            onInteractionStart={handleScaleStart}
            onInteractionEnd={deactivatePreview}
          />
          <Separator />
          <div className="flex items-center justify-between py-3 px-1">
            <div className="flex items-center gap-3">
              <Pencil className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Редактор водяных знаков</p>
                <p className="text-xs text-muted-foreground">Визуальное редактирование</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleOpenEditor}
            >
              Открыть
            </Button>
          </div>
        </>
      )}
    </CollapsibleCard>
  );
});
