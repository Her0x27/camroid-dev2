import { memo } from "react";
import { Database, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { formatBytes } from "@/lib/date-utils";
import { useI18n } from "@/lib/i18n";

interface StorageInfo {
  photos: number;
  used: number;
  quota: number;
}

interface StorageSectionProps {
  storageInfo: StorageInfo | null;
  onShowClearDialog: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const StorageSection = memo(function StorageSection({
  storageInfo,
  onShowClearDialog,
  isOpen,
  onOpenChange,
}: StorageSectionProps) {
  const { t } = useI18n();
  const usagePercent = storageInfo ? Math.min((storageInfo.used / storageInfo.quota) * 100, 100) : 0;
  
  return (
    <CollapsibleCard
      icon={<Database className="w-5 h-5" />}
      title={t.settings.storage.title}
      description={t.settings.storage.description}
      sectionId="storage"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      testId="section-storage"
    >
      {storageInfo && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{storageInfo.photos} {t.settings.storage.photosStored.toLowerCase()}</div>
                <div className="text-xs text-muted-foreground">{formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-semibold tabular-nums">{usagePercent.toFixed(0)}%</div>
            </div>
          </div>
          
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/5"
        onClick={onShowClearDialog}
        disabled={!storageInfo || storageInfo.photos === 0}
        data-testid="button-clear-storage"
      >
        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
        {t.settings.storage.clearAllPhotos}
      </Button>
    </CollapsibleCard>
  );
});
