import { memo } from "react";
import { ChevronRight, List, Grid, LayoutGrid, SortAsc, SortDesc, X, Cloud, Upload, Link, Loader2, Image, Folder, CheckSquare, Square, FolderOpen, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { GalleryFilter } from "@shared/schema";

type ViewMode = "mixed" | "folders" | "photos";
type DisplayType = "list" | "grid" | "large";

interface GalleryHeaderProps {
  viewMode: ViewMode;
  displayType: DisplayType;
  headerTitle: string;
  headerSubtitle: string;
  selectedFolder: string | null | undefined;
  filter: GalleryFilter;
  isUploading: boolean;
  hasPhotos: boolean;
  uploadedCount: number;
  isImgbbValidated: boolean;
  selectionMode: boolean;
  selectedCount: number;
  totalPhotos: number;
  onBack: () => void;
  onCloseGallery: () => void;
  onCycleViewMode: () => void;
  onCycleDisplayType: () => void;
  onToggleSortOrder: () => void;
  onUploadCurrentView: () => void;
  onGetLinks: () => void;
  onClearAll: () => void;
  onCancelSelection: () => void;
  onSelectAll: () => void;
  t: {
    gallery: {
      title: string;
      filterPhotos: string;
      hasLocation: string;
      hasNote: string;
      clearFilters: string;
      active: string;
      uploadFolder: string;
      uploadAll: string;
      getLinks: string;
      viewFiles: string;
      viewFolders: string;
      selected: string;
      selectAll: string;
      deselectAll: string;
      deleteSelected: string;
      downloadSelected: string;
      uploadSelected: string;
      getSelectedLinks: string;
      cancelSelection: string;
      allPhotos: string;
      uncategorized: string;
    };
    settings: {
      cloud: {
        title: string;
      };
    };
  };
}

export const GalleryHeader = memo(function GalleryHeader({
  viewMode,
  displayType,
  headerTitle,
  headerSubtitle,
  selectedFolder,
  filter,
  isUploading,
  hasPhotos,
  uploadedCount,
  isImgbbValidated,
  selectionMode,
  selectedCount,
  totalPhotos,
  onBack,
  onCloseGallery,
  onCycleViewMode,
  onCycleDisplayType,
  onToggleSortOrder,
  onUploadCurrentView,
  onGetLinks,
  onClearAll,
  onCancelSelection,
  onSelectAll,
  t,
}: GalleryHeaderProps) {
  void headerTitle;
  void onClearAll;
  
  const getViewModeIcon = () => {
    switch (viewMode) {
      case "mixed": return <FolderOpen className="w-5 h-5" />;
      case "folders": return <Folder className="w-5 h-5" />;
      case "photos": return <Image className="w-5 h-5" />;
    }
  };

  const getDisplayTypeIcon = () => {
    switch (displayType) {
      case "list": return <List className="w-5 h-5" />;
      case "grid": return <Grid className="w-5 h-5" />;
      case "large": return <LayoutGrid className="w-5 h-5" />;
    }
  };

  const getBreadcrumbs = () => {
    const crumbs: { label: string; onClick?: () => void; icon?: boolean }[] = [];
    crumbs.push({ label: t.gallery.title, onClick: selectedFolder !== undefined ? onBack : undefined, icon: true });
    
    if (selectedFolder !== undefined) {
      const folderLabel = selectedFolder === null ? t.gallery.uncategorized : selectedFolder;
      crumbs.push({ label: folderLabel });
    }
    
    return crumbs;
  };
  if (selectionMode) {
    return (
      <header className="sticky top-0 z-50 bg-emerald-500/10 backdrop-blur-sm border-b border-emerald-500/20 safe-top">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancelSelection}
              className="w-9 h-9 hover:bg-emerald-500/20"
              data-testid="button-cancel-selection"
            >
              <X className="w-5 h-5 text-emerald-500" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-emerald-500">
                {selectedCount} {t.gallery.selected}
              </h1>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onSelectAll}
            className="w-9 h-9 hover:bg-emerald-500/20"
            data-testid="button-select-all"
          >
            {selectedCount === totalPhotos ? (
              <Square className="w-5 h-5 text-emerald-500" />
            ) : (
              <CheckSquare className="w-5 h-5 text-emerald-500" />
            )}
          </Button>
        </div>
      </header>
    );
  }

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center min-w-0">
              {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mx-1" />}
              {crumb.icon && (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mr-2 flex-shrink-0">
                  <Images className="w-4 h-4 text-emerald-500 drop-shadow-[0_0_4px_rgb(16,185,129)]" />
                </div>
              )}
              {crumb.onClick ? (
                <button
                  onClick={crumb.onClick}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-sm font-medium truncate">{crumb.label}</span>
              )}
            </div>
          ))}
          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
            {headerSubtitle}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCycleViewMode}
            className="w-9 h-9"
            data-testid="button-view-mode-toggle"
          >
            {getViewModeIcon()}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onCycleDisplayType}
            className="w-9 h-9"
            data-testid="button-display-toggle"
          >
            {getDisplayTypeIcon()}
          </Button>

          {(viewMode === "photos" || viewMode === "mixed") && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSortOrder}
                className="w-9 h-9"
                data-testid="button-sort-toggle"
              >
                {filter.sortBy === "newest" ? (
                  <SortDesc className="w-5 h-5" />
                ) : (
                  <SortAsc className="w-5 h-5" />
                )}
              </Button>
            </>
          )}

          {hasPhotos && isImgbbValidated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="w-9 h-9"
                  disabled={isUploading}
                  data-testid="button-cloud-menu"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Cloud className="w-5 h-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t.settings.cloud.title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onUploadCurrentView}
                  disabled={isUploading || !isImgbbValidated}
                  data-testid="button-upload-to-cloud"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {viewMode === "photos" ? t.gallery.uploadFolder : t.gallery.uploadAll}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onGetLinks}
                  disabled={uploadedCount === 0}
                  data-testid="button-get-links"
                >
                  <Link className="w-4 h-4 mr-2" />
                  {t.gallery.getLinks} ({uploadedCount})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseGallery}
            className="w-9 h-9"
            data-testid="button-close-gallery"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
});
