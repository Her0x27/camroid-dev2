import { memo } from "react";
import { Download, Trash2, Upload, Link, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GallerySelectionFooterProps {
  selectedCount: number;
  isUploading: boolean;
  isImgbbValidated: boolean;
  hasUploadedPhotos: boolean;
  onDownload: () => void;
  onDelete: () => void;
  onUpload: () => void;
  onGetLinks: () => void;
}

export const GallerySelectionFooter = memo(function GallerySelectionFooter({
  selectedCount,
  isUploading,
  isImgbbValidated,
  hasUploadedPhotos,
  onDownload,
  onDelete,
  onUpload,
  onGetLinks,
}: GallerySelectionFooterProps) {
  if (selectedCount === 0) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom">
      <div className="flex items-center justify-around py-3 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDownload}
          className="w-12 h-12 rounded-full touch-manipulation active:scale-95 transition-transform"
          data-testid="footer-download"
        >
          <Download className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="w-12 h-12 rounded-full touch-manipulation active:scale-95 transition-transform text-destructive hover:text-destructive"
          data-testid="footer-delete"
        >
          <Trash2 className="w-6 h-6" />
        </Button>

        {isImgbbValidated && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onUpload}
            disabled={isUploading}
            className="w-12 h-12 rounded-full touch-manipulation active:scale-95 transition-transform"
            data-testid="footer-upload"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </Button>
        )}

        {hasUploadedPhotos && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onGetLinks}
            className="w-12 h-12 rounded-full touch-manipulation active:scale-95 transition-transform"
            data-testid="footer-get-links"
          >
            <Link className="w-6 h-6" />
          </Button>
        )}
      </div>
    </footer>
  );
});
