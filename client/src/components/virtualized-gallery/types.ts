import type { PhotoWithThumbnail } from "@shared/schema";

export interface VirtualizedListProps {
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

export interface VirtualizedGridProps {
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
  cellSizeMultiplier?: number;
}

export interface PhotoListItemData {
  photos: PhotoWithThumbnail[];
  onPhotoClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onLongPress?: (id: string) => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
}

export interface PhotoGridItemData {
  photos: PhotoWithThumbnail[];
  columnCount: number;
  onPhotoClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onLongPress?: (id: string) => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
}

export interface AutoSizerContainerProps {
  children: (size: { width: number; height: number }) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
