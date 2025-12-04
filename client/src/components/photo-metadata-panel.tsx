import { memo, useMemo, useState, useEffect } from "react";
import { MapPin, Calendar, Image, HardDrive, FileText, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatCoordinate } from "@/hooks/use-geolocation";
import { useI18n } from "@/lib/i18n";
import type { Photo } from "@shared/schema";

interface PhotoMetadataPanelProps {
  photo: Photo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(timestamp: number, locale: string): string {
  return new Date(timestamp).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function generateFilename(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `ZD_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.jpg`;
}

function estimateBase64Size(base64: string): number {
  const base64Length = base64.replace(/^data:[^;]+;base64,/, "").length;
  return Math.floor((base64Length * 3) / 4);
}

export const PhotoMetadataPanel = memo(function PhotoMetadataPanel({
  photo,
  open,
  onOpenChange,
}: PhotoMetadataPanelProps) {
  const { t, language } = useI18n();
  const [resolution, setResolution] = useState<string>("—");

  const metadata = useMemo(() => {
    if (!photo) return null;

    const timestamp = photo.metadata.timestamp;
    const filename = generateFilename(timestamp);
    const createdAt = formatDate(timestamp, language === "ru" ? "ru-RU" : "en-US");
    const fileSize = formatFileSize(estimateBase64Size(photo.imageData));
    const hasLocation = photo.metadata.latitude !== null && photo.metadata.longitude !== null;

    return {
      filename,
      createdAt,
      fileSize,
      hasLocation,
      latitude: photo.metadata.latitude,
      longitude: photo.metadata.longitude,
    };
  }, [photo, language]);

  useEffect(() => {
    if (!photo?.imageData) {
      setResolution("—");
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      setResolution(`${img.width}×${img.height}`);
    };
    img.src = photo.imageData;
  }, [photo?.imageData]);

  const handleOpenMaps = () => {
    if (metadata?.hasLocation && metadata.latitude && metadata.longitude) {
      const url = `https://www.google.com/maps?q=${metadata.latitude},${metadata.longitude}`;
      window.open(url, "_blank");
    }
  };

  if (!photo || !metadata) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t.photoDetail.metadataPanel.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <MetadataRow
            icon={<FileText className="w-4 h-4" />}
            label={t.photoDetail.metadataPanel.filename}
            value={metadata.filename}
            mono
          />

          <MetadataRow
            icon={<Calendar className="w-4 h-4" />}
            label={t.photoDetail.metadataPanel.createdAt}
            value={metadata.createdAt}
          />

          <MetadataRow
            icon={<Image className="w-4 h-4" />}
            label={t.photoDetail.metadataPanel.resolution}
            value={resolution || "—"}
            mono
          />

          <MetadataRow
            icon={<HardDrive className="w-4 h-4" />}
            label={t.photoDetail.metadataPanel.fileSize}
            value={metadata.fileSize}
            mono
          />

          <div className="border-t pt-4">
            <div className="flex items-start gap-3">
              <MapPin className={`w-4 h-4 mt-1 ${metadata.hasLocation ? "text-primary" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {t.photoDetail.metadataPanel.location}
                </p>
                {metadata.hasLocation ? (
                  <div className="mt-1 space-y-1">
                    <p className="font-mono text-sm">
                      {formatCoordinate(metadata.latitude)}
                    </p>
                    <p className="font-mono text-sm">
                      {formatCoordinate(metadata.longitude)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-1"
                      onClick={handleOpenMaps}
                      data-testid="button-open-maps"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {t.photoDetail.openInMaps}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic mt-1">
                    {t.photoDetail.metadataPanel.noLocation}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

interface MetadataRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}

function MetadataRow({ icon, label, value, mono }: MetadataRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
