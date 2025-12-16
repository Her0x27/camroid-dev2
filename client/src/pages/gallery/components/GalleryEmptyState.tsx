import { memo } from "react";
import { Camera, FolderOpen, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateType = "no-photos" | "empty-folder";

interface GalleryEmptyStateProps {
  type: EmptyStateType;
  hasFilters: boolean;
  onNavigateToCamera: () => void;
  onBackToFolders: () => void;
  t: {
    gallery: {
      noPhotosYet: string;
      noPhotosDescription: string;
      noPhotos: string;
      noPhotosMatchFilter: string;
      noPhotosInFolder: string;
      backToFolders: string;
    };
    camera: {
      startCapturing: string;
    };
  };
}

export const GalleryEmptyState = memo(function GalleryEmptyState({
  type,
  hasFilters,
  onNavigateToCamera,
  onBackToFolders,
  t,
}: GalleryEmptyStateProps) {
  if (type === "no-photos") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4">
          <Camera className="w-10 h-10 text-emerald-500 drop-shadow-[0_0_4px_rgb(16,185,129)]" />
        </div>
        <h2 className="text-lg font-semibold mb-2">{t.gallery.noPhotosYet}</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          {t.gallery.noPhotosDescription}
        </p>
        <Button 
          onClick={onNavigateToCamera} 
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
          data-testid="button-start-capturing"
        >
          <Camera className="w-4 h-4 mr-2" />
          {t.camera.startCapturing}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4">
        <FolderOpen className="w-10 h-10 text-emerald-500 drop-shadow-[0_0_4px_rgb(16,185,129)]" />
      </div>
      <h2 className="text-lg font-semibold mb-2">{t.gallery.noPhotos}</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        {hasFilters
          ? t.gallery.noPhotosMatchFilter
          : t.gallery.noPhotosInFolder
        }
      </p>
      <Button 
        onClick={onBackToFolders} 
        variant="outline" 
        className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
        data-testid="button-back-to-folders"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        {t.gallery.backToFolders}
      </Button>
    </div>
  );
});
