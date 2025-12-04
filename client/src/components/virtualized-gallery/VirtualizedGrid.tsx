import { memo, useRef, useEffect, useMemo, useCallback } from "react";
import { Grid, CellComponentProps } from "react-window";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Check } from "lucide-react";
import { LocationBadge, NoteBadge } from "@/components/photo-badges";
import { useI18n } from "@/lib/i18n";
import { useLongPress } from "@/hooks/use-long-press";
import { GALLERY } from "@/lib/constants";
import type { VirtualizedGridProps, PhotoGridItemData } from "./types";

const GRID_GAP = GALLERY.GRID_GAP_PX;
const MIN_CELL_SIZE = GALLERY.MIN_CELL_SIZE_PX;
const SCROLLBAR_WIDTH = GALLERY.SCROLLBAR_WIDTH_PX;

type PhotoGridCellProps = CellComponentProps<PhotoGridItemData>;

function PhotoGridCellBase({
  columnIndex,
  rowIndex,
  style,
  photos,
  columnCount,
  onPhotoClick,
  onDeleteClick,
  onLongPress,
  selectionMode,
  selectedIds,
}: PhotoGridCellProps): React.ReactElement {
  const { t } = useI18n();
  const photoIndex = rowIndex * columnCount + columnIndex;
  const photo = photos[photoIndex];
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

  if (!photo) return <div style={{ ...style, padding: GRID_GAP / 2 }} />;

  return (
    <div style={{ ...style, padding: GRID_GAP / 2 }}>
      <Card
        className={`group relative w-full h-full overflow-hidden cursor-pointer hover-elevate ${
          isSelected ? "ring-2 ring-primary" : ""
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
        <img
          src={photo.thumbnailData}
          alt={t.components.gallery.photo}
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />

        {selectionMode && (
          <div
            className={`absolute inset-0 ${isSelected ? "bg-primary/30" : ""}`}
          >
            <div
              className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                isSelected
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-white bg-black/30"
              }`}
            >
              {isSelected && <Check className="w-4 h-4" />}
            </div>
          </div>
        )}

        {!selectionMode && (
          <>
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {photo.metadata.latitude !== null && <LocationBadge variant="overlay" />}
              {photo.note && <NoteBadge variant="overlay" />}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(photo.id);
              }}
              data-testid={`button-delete-${photo.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

const PhotoGridCell = memo(PhotoGridCellBase) as typeof PhotoGridCellBase;

export function VirtualizedPhotoGrid({
  photos,
  onPhotoClick,
  onDeleteClick,
  onLongPress,
  containerHeight,
  containerWidth,
  selectionMode = false,
  selectedIds = new Set(),
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: VirtualizedGridProps) {
  const loadMoreTriggeredRef = useRef(false);
  const availableWidth = containerWidth - SCROLLBAR_WIDTH;
  
  const { columnCount, cellSize, rowCount } = useMemo(() => {
    const cols = Math.max(2, Math.floor(availableWidth / MIN_CELL_SIZE));
    const size = Math.floor((availableWidth - GRID_GAP) / cols);
    const rows = Math.ceil(photos.length / cols);
    return { columnCount: cols, cellSize: size, rowCount: Math.max(1, rows) };
  }, [availableWidth, photos.length]);

  const cellProps: PhotoGridItemData = useMemo(
    () => ({
      photos,
      columnCount,
      onPhotoClick,
      onDeleteClick,
      onLongPress,
      selectionMode,
      selectedIds,
    }),
    [photos, columnCount, onPhotoClick, onDeleteClick, onLongPress, selectionMode, selectedIds]
  );

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || isLoadingMore || !onLoadMore || loadMoreTriggeredRef.current) return;
    
    const scrollTop = event.currentTarget.scrollTop;
    const totalHeight = rowCount * cellSize;
    const threshold = totalHeight - containerHeight - cellSize * 2;
    
    if (scrollTop > threshold) {
      loadMoreTriggeredRef.current = true;
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore, rowCount, cellSize, containerHeight]);

  useEffect(() => {
    if (!isLoadingMore) {
      loadMoreTriggeredRef.current = false;
    }
  }, [isLoadingMore]);

  if (photos.length === 0 || containerHeight < 50 || containerWidth < 100) return null;

  return (
    <Grid
      defaultHeight={containerHeight}
      defaultWidth={availableWidth}
      columnCount={columnCount}
      columnWidth={cellSize}
      rowCount={rowCount}
      rowHeight={cellSize}
      cellProps={cellProps}
      cellComponent={PhotoGridCell}
      overscanCount={3}
      onScroll={handleScroll}
    />
  );
}
