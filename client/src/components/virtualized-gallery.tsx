import { memo, useRef, useEffect, useState, useMemo, useCallback } from "react";
import { List, Grid, RowComponentProps, CellComponentProps } from "react-window";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Check } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { LocationBadge, NoteBadge } from "@/components/photo-badges";
import { useI18n } from "@/lib/i18n";
import { useLongPress } from "@/hooks/use-long-press";
import type { PhotoWithThumbnail } from "@shared/schema";

interface VirtualizedListProps {
  photos: PhotoWithThumbnail[];
  onPhotoClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onLongPress?: (id: string) => void;
  containerHeight: number;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

interface VirtualizedGridProps {
  photos: PhotoWithThumbnail[];
  onPhotoClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onLongPress?: (id: string) => void;
  containerHeight: number;
  containerWidth: number;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

interface PhotoListItemData {
  photos: PhotoWithThumbnail[];
  onPhotoClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onLongPress?: (id: string) => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
}

interface PhotoGridItemData {
  photos: PhotoWithThumbnail[];
  columnCount: number;
  onPhotoClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onLongPress?: (id: string) => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
}

import { GALLERY } from "@/lib/constants";

const LIST_ITEM_HEIGHT = GALLERY.LIST_ITEM_HEIGHT;
const GRID_GAP = GALLERY.GRID_GAP_PX;
const MIN_CELL_SIZE = GALLERY.MIN_CELL_SIZE_PX;
const SCROLLBAR_WIDTH = GALLERY.SCROLLBAR_WIDTH_PX;

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

  if (!photo) return <div style={{ ...style, paddingBottom: 8 }} />;

  const handleClick = () => {
    const wasLong = longPressHandlers.wasLongPress();
    if (!wasLong) {
      onPhotoClick(photo.id);
    }
  };

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

  if (!photo) return <div style={{ ...style, padding: GRID_GAP / 2 }} />;

  const handleClick = () => {
    const wasLong = longPressHandlers.wasLongPress();
    if (!wasLong) {
      onPhotoClick(photo.id);
    }
  };

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

interface AutoSizerContainerProps {
  children: (size: { width: number; height: number }) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function AutoSizerContainer({ children, className, style }: AutoSizerContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSize({ width, height });
        }
      }
    };

    observerRef.current = new ResizeObserver(handleResize);
    observerRef.current.observe(container);

    const { clientWidth, clientHeight } = container;
    if (clientWidth > 0 && clientHeight > 0) {
      setSize({ width: clientWidth, height: clientHeight });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ ...style, minHeight: 100 }}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
}
