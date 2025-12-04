import { memo, useMemo } from "react";
import { Camera, MonitorPlay } from "lucide-react";
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
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useI18n } from "@/lib/i18n";
import type { Settings, CameraResolution } from "@shared/schema";

interface CameraSettingsSectionProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

export const CameraSettingsSection = memo(function CameraSettingsSection({
  settings,
  updateSettings,
}: CameraSettingsSectionProps) {
  const { t } = useI18n();

  const resolutionOptions = useMemo(() => [
    { value: "auto" as CameraResolution, label: t.settings.camera.auto },
    { value: "4k" as CameraResolution, label: t.settings.camera.res4k },
    { value: "1080p" as CameraResolution, label: t.settings.camera.res1080p },
    { value: "720p" as CameraResolution, label: t.settings.camera.res720p },
    { value: "480p" as CameraResolution, label: t.settings.camera.res480p },
  ], [t]);

  return (
    <CollapsibleCard
      icon={<MonitorPlay className="w-5 h-5" />}
      title={t.settings.camera.title}
      description={t.settings.camera.description}
      testId="section-camera-settings"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            <div>
              <span>{t.settings.camera.resolution}</span>
              <p className="text-xs text-muted-foreground font-normal">
                {t.settings.camera.resolutionDesc}
              </p>
            </div>
          </Label>
          <Select
            value={settings.cameraResolution}
            onValueChange={(value) =>
              updateSettings({ cameraResolution: value as CameraResolution })
            }
          >
            <SelectTrigger className="w-40" data-testid="select-camera-resolution">
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
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <div>
              <span>{t.settings.camera.quality}</span>
              <p className="text-xs text-muted-foreground font-normal">
                {t.settings.camera.qualityDesc}
              </p>
            </div>
          </Label>
          <span className="text-sm text-muted-foreground font-mono">
            {settings.photoQuality}
            {t.settings.camera.percent}
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
      </div>
    </CollapsibleCard>
  );
});
