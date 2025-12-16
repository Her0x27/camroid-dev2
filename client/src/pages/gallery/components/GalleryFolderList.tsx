import { memo } from "react";
import { Folder, ChevronLeft, Upload, Link, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DisplayType = "list" | "grid" | "large";

export interface FolderInfo {
  name: string | null;
  count: number;
  latestThumb: string | null;
  uploadedCount?: number;
}

interface GalleryFolderListProps {
  folders: FolderInfo[];
  displayType: DisplayType;
  onFolderSelect: (folderName: string | null) => void;
  onFolderUpload?: (folderName: string | null) => void;
  onFolderGetLinks?: (folderName: string | null) => void;
  isImgbbValidated?: boolean;
  isUploading?: boolean;
  t: {
    gallery: {
      uncategorized: string;
      photo: string;
      photos: string;
    };
  };
}

const FolderListItem = memo(function FolderListItem({
  folder,
  onSelect,
  onUpload,
  onGetLinks,
  isImgbbValidated,
  isUploading,
  t,
}: {
  folder: FolderInfo;
  onSelect: () => void;
  onUpload?: () => void;
  onGetLinks?: () => void;
  isImgbbValidated?: boolean;
  isUploading?: boolean;
  t: GalleryFolderListProps["t"];
}) {
  const hasUnuploaded = (folder.uploadedCount ?? 0) < folder.count;
  const hasUploaded = (folder.uploadedCount ?? 0) > 0;

  return (
    <Card
      className="group flex items-center gap-3 p-2 cursor-pointer hover-elevate"
      onClick={onSelect}
      data-testid={`folder-card-${folder.name ?? "uncategorized"}`}
    >
      <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-card">
        {folder.latestThumb ? (
          <img
            src={folder.latestThumb}
            alt={folder.name ?? t.gallery.uncategorized}
            className="w-full h-full object-cover opacity-70"
            loading="lazy"
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Folder className="w-6 h-6 text-primary" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {folder.name ?? t.gallery.uncategorized}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge 
            variant="secondary" 
            className="text-[10px] px-1.5 py-0.5"
          >
            {folder.count} {folder.count === 1 ? t.gallery.photo : t.gallery.photos}
          </Badge>
          {hasUploaded && (
            <Badge 
              variant="outline" 
              className="text-[10px] px-1.5 py-0.5 text-primary border-primary/50"
            >
              {folder.uploadedCount}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isImgbbValidated && hasUnuploaded && onUpload && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={(e) => {
              e.stopPropagation();
              onUpload();
            }}
            disabled={isUploading}
            data-testid={`folder-upload-${folder.name ?? "uncategorized"}`}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </Button>
        )}
        {hasUploaded && onGetLinks && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={(e) => {
              e.stopPropagation();
              onGetLinks();
            }}
            data-testid={`folder-links-${folder.name ?? "uncategorized"}`}
          >
            <Link className="w-4 h-4" />
          </Button>
        )}
        <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
      </div>
    </Card>
  );
});

const FolderGridItem = memo(function FolderGridItem({
  folder,
  onSelect,
  onUpload,
  onGetLinks,
  isImgbbValidated,
  isUploading,
  t,
}: {
  folder: FolderInfo;
  onSelect: () => void;
  onUpload?: () => void;
  onGetLinks?: () => void;
  isImgbbValidated?: boolean;
  isUploading?: boolean;
  t: GalleryFolderListProps["t"];
}) {
  const hasUnuploaded = (folder.uploadedCount ?? 0) < folder.count;
  const hasUploaded = (folder.uploadedCount ?? 0) > 0;

  return (
    <Card
      className="group relative aspect-square overflow-hidden cursor-pointer hover-elevate"
      onClick={onSelect}
      data-testid={`folder-card-${folder.name ?? "uncategorized"}`}
    >
      {folder.latestThumb ? (
        <img
          src={folder.latestThumb}
          alt={folder.name ?? t.gallery.uncategorized}
          className="w-full h-full object-cover opacity-60"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-card" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
        <Folder className="w-10 h-10 text-primary mb-2" />
        <span className="font-semibold text-white text-center text-sm line-clamp-2">
          {folder.name ?? t.gallery.uncategorized}
        </span>
        <div className="flex items-center gap-1 mt-2">
          <Badge 
            variant="secondary" 
            className="bg-black/60 text-white border-none text-xs"
          >
            {folder.count} {folder.count === 1 ? t.gallery.photo : t.gallery.photos}
          </Badge>
          {hasUploaded && (
            <Badge 
              variant="outline" 
              className="text-xs text-primary border-primary/50 bg-black/60"
            >
              {folder.uploadedCount}
            </Badge>
          )}
        </div>
        
        {(isImgbbValidated && hasUnuploaded && onUpload) || (hasUploaded && onGetLinks) ? (
          <div className="flex items-center gap-1 mt-2">
            {isImgbbValidated && hasUnuploaded && onUpload && (
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 bg-black/60 text-white hover:bg-black/80"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpload();
                }}
                disabled={isUploading}
                data-testid={`folder-upload-${folder.name ?? "uncategorized"}`}
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
              </Button>
            )}
            {hasUploaded && onGetLinks && (
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 bg-black/60 text-white hover:bg-black/80"
                onClick={(e) => {
                  e.stopPropagation();
                  onGetLinks();
                }}
                data-testid={`folder-links-${folder.name ?? "uncategorized"}`}
              >
                <Link className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
});

export const GalleryFolderList = memo(function GalleryFolderList({
  folders,
  displayType,
  onFolderSelect,
  onFolderUpload,
  onFolderGetLinks,
  isImgbbValidated,
  isUploading,
  t,
}: GalleryFolderListProps) {
  if (displayType === "list") {
    return (
      <div className="flex flex-col gap-2">
        {folders.map((folder) => (
          <FolderListItem
            key={folder.name ?? "__uncategorized__"}
            folder={folder}
            onSelect={() => onFolderSelect(folder.name)}
            onUpload={onFolderUpload ? () => onFolderUpload(folder.name) : undefined}
            onGetLinks={onFolderGetLinks ? () => onFolderGetLinks(folder.name) : undefined}
            isImgbbValidated={isImgbbValidated}
            isUploading={isUploading}
            t={t}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {folders.map((folder) => (
        <FolderGridItem
          key={folder.name ?? "__uncategorized__"}
          folder={folder}
          onSelect={() => onFolderSelect(folder.name)}
          onUpload={onFolderUpload ? () => onFolderUpload(folder.name) : undefined}
          onGetLinks={onFolderGetLinks ? () => onFolderGetLinks(folder.name) : undefined}
          isImgbbValidated={isImgbbValidated}
          isUploading={isUploading}
          t={t}
        />
      ))}
    </div>
  );
});
