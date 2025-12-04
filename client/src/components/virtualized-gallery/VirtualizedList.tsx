import { memo, useRef, useEffect, useMemo, useCallback } from "react";
import { List, RowComponentProps } from "react-window";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Check } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { LocationBadge, NoteBadge } from "@/components/photo-badges";
import { useI18n } from "@/lib/i18n";
import { useLongPress } from "@/hooks/use-long-press";
import { GALLERY } from "@/lib/constants";
import type { VirtualizedListProps, PhotoListItemData } from "./types";

const LIST_ITEM_HEIGHT = GALLERY.LIST_ITEM_HEIGHT;

type PhotoListItemProps = RowComponentProps<PhotoListItemData>;

function PhotoListItemBase({
  index,
  style,
  photos,
  onPhotoClick,
  onDeleteClick,
  onLongPress,
  selectionMode,
  selectedIds,
}: PhotoListItemProps): React.ReactElement {
  const { t } = useI18n();
  const photo = photos[index];
  const isSelected = photo ? selectedIds.has(photo.id) : false;
  
  const handleLongPress = useCallback((id: string) => {
    onLongPress?.(id);
  }, [onLongPress]);
  
  const longPressHandlers = useLongPress({
    onLongPress: handleLongPress,
    data: photo?.id || "",
    disabled: selectionMode,
  });

  const handleClick = useCallback(() => {
    const wasLong = longPressHandlers.wasLongPress();
    if (!wasLong && photo) {
      onPhotoClick(photo.id);
    }
  }, [longPressHandlers, onPhotoClick, photo]);

  if (!photo) return <div style={{ ...style, paddingBottom: 8 }} />;

  return (
    <div style={{ ...style, paddingBottom: 8 }}>
      <Card
        className={`group flex items-center gap-3 p-2 cursor-pointer hover-elevate h-full ${
          isSelected ? "ring-2 ring-primary bg-primary/10" : ""
        }`}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
        data-testid={`photo-card-${photo.id}`}
        onTouchStart={longPressHandlers.onTouchStart}
        onTouchMove={longPressHandlers.onTouchMove}
        onTouchEnd={longPressHandlers.onTouchEnd}
        onMouseDown={longPressHandlers.onMouseDown}
        onMouseMove={longPressHandlers.onMouseMove}
        onMouseUp={longPressHandlers.onMouseUp}
        onMouseLeave={longPressHandlers.onMouseLeave}
      >
        <div className="relative flex-shrink-0">
          <img
            src={photo.thumbnailData}
            alt={t.components.gallery.photo}
            className="w-16 h-16 object-cover rounded-md"
            loading="lazy"
            draggable={false}
          />
          {selectionMode && (
            <div
              className={`absolute inset-0 flex items-center justify-center rounded-md ${
                isSelected ? "bg-primary/40" : "bg-black/20"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-white bg-black/30"
                }`}
              >
                {isSelected && <Check className="w-4 h-4" />}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {formatDate(photo.metadata.timestamp, "long")}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {photo.metadata.latitude !== null && <LocationBadge />}
            {photo.note && <NoteBadge />}
          </div>
        </div>

        {!selectionMode && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(photo.id);
            }}
            data-testid={`button-delete-${photo.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </Card>
    </div>
  );
}

const PhotoListItem = memo(PhotoListItemBase) as typeof PhotoListItemBase;

export function VirtualizedPhotoList({
  photos,
  onPhotoClick,
  onDeleteClick,
  onLongPress,
  containerHeight,
  selectionMode = false,
  selectedIds = new Set(),
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: VirtualizedListProps) {
  const loadMoreTriggeredRef = useRef(false);
  
  const rowProps: PhotoListItemData = useMemo(
    () => ({
      photos,
      onPhotoClick,
      onDeleteClick,
      onLongPress,
      selectionMode,
      selectedIds,
    }),
    [photos, onPhotoClick, onDeleteClick, onLongPress, selectionMode, selectedIds]
  );

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || isLoadingMore || !onLoadMore || loadMoreTriggeredRef.current) return;
    
    const scrollOffset = event.currentTarget.scrollTop;
    const totalHeight = photos.length * LIST_ITEM_HEIGHT;
    const threshold = totalHeight - containerHeight - LIST_ITEM_HEIGHT * 5;
    
    if (scrollOffset > threshold) {
      loadMoreTriggeredRef.current = true;
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore, photos.length, containerHeight]);

  useEffect(() => {
    if (!isLoadingMore) {
      loadMoreTriggeredRef.current = false;
    }
  }, [isLoadingMore]);

  if (photos.length === 0 || containerHeight < 50) return null;

  return (
    <List
      style={{ width: "100%" }}
      defaultHeight={containerHeight}
      rowCount={photos.length}
      rowHeight={LIST_ITEM_HEIGHT}
      rowProps={rowProps}
      rowComponent={PhotoListItem}
      overscanCount={5}
      onScroll={handleScroll}
    />
  );
}
