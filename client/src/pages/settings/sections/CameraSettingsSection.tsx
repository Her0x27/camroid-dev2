import { memo, useMemo } from "react";
import { Camera, MonitorPlay } from "lucide-react";
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
import { SettingSlider } from "@/components/ui/setting-slider";
import { useI18n } from "@/lib/i18n";
import type { Settings, CameraResolution } from "@shared/schema";

interface CameraSettingsSectionProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CameraSettingsSection = memo(function CameraSettingsSection({
  settings,
  updateSettings,
  isOpen,
  onOpenChange,
}: CameraSettingsSectionProps) {
  const { t } = useI18n();

  const resolutionOptions = useMemo(() => [
    { value: "auto" as CameraResolution, label: t.settings.camera.auto },
    { value: "4000x2250" as CameraResolution, label: "4000×2250" },
    { value: "3840x2160" as CameraResolution, label: "3840×2160 (4K)" },
    { value: "3264x1836" as CameraResolution, label: "3264×1836" },
    { value: "1920x1080" as CameraResolution, label: "1920×1080 (FHD)" },
    { value: "1600x900" as CameraResolution, label: "1600×900" },
    { value: "1280x720" as CameraResolution, label: "1280×720 (HD)" },
  ], [t]);

  return (
    <CollapsibleCard
      icon={<MonitorPlay className="w-5 h-5" />}
      title={t.settings.camera.title}
      description={t.settings.camera.description}
      sectionId="camera-settings"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      testId="section-camera-settings"
    >
      <SettingRow
        id="camera-resolution"
        icon={<Camera className="w-4 h-4" />}
        label={t.settings.camera.resolution}
        description={t.settings.camera.resolutionDesc}
        control={
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
        }
      />

      <Separator />

      <SettingSlider
        label={t.settings.camera.quality}
        description={t.settings.camera.qualityDesc}
        value={settings.photoQuality}
        onValueChange={(value) => updateSettings({ photoQuality: value })}
        min={50}
        max={100}
        step={1}
        unit={t.settings.camera.percent}
        testId="slider-photo-quality"
      />
    </CollapsibleCard>
  );
});
