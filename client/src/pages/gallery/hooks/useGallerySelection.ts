import { useState, useCallback } from "react";
import type { PhotoWithThumbnail } from "@shared/schema";

interface UseGallerySelectionParams {
  filteredPhotos: PhotoWithThumbnail[];
}

interface UseGallerySelectionReturn {
  selectionMode: boolean;
  selectedIds: Set<string>;
  handleCancelSelection: () => void;
  handleSelectAll: () => void;
  handleToggleSelection: (photoId: string) => void;
  handleLongPress: (photoId: string) => void;
  resetSelection: () => void;
  removeFromSelection: (photoId: string) => void;
}

export function useGallerySelection({ filteredPhotos }: UseGallerySelectionParams): UseGallerySelectionReturn {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleCancelSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredPhotos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPhotos.map(p => p.id)));
    }
  }, [filteredPhotos, selectedIds.size]);

  const handleToggleSelection = useCallback((photoId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  }, []);

  const handleLongPress = useCallback((photoId: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([photoId]));
  }, []);

  const resetSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const removeFromSelection = useCallback((photoId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(photoId);
      return newSet;
    });
  }, []);

  return {
    selectionMode,
    selectedIds,
    handleCancelSelection,
    handleSelectAll,
    handleToggleSelection,
    handleLongPress,
    resetSelection,
    removeFromSelection,
  };
}
