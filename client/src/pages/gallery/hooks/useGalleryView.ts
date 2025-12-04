import { useState, useCallback } from "react";

export type ViewMode = "folders" | "photos";
export type DisplayType = "list" | "grid";

interface UseGalleryViewParams {
  onViewChange?: () => void;
}

interface UseGalleryViewReturn {
  viewMode: ViewMode;
  selectedFolder: string | null | undefined;
  displayType: DisplayType;
  handleFolderSelect: (folderName: string | null) => void;
  handleBackToFolders: () => void;
  handleToggleViewMode: () => void;
  toggleDisplayType: () => void;
  setSelectedFolder: (folder: string | null | undefined) => void;
  setViewMode: (mode: ViewMode) => void;
}

export function useGalleryView({ onViewChange }: UseGalleryViewParams = {}): UseGalleryViewReturn {
  const [viewMode, setViewMode] = useState<ViewMode>("photos");
  const [selectedFolder, setSelectedFolder] = useState<string | null | undefined>(undefined);
  const [displayType, setDisplayType] = useState<DisplayType>("grid");

  const handleFolderSelect = useCallback((folderName: string | null) => {
    setSelectedFolder(folderName);
    setViewMode("photos");
  }, []);

  const handleBackToFolders = useCallback(() => {
    setSelectedFolder(undefined);
    setViewMode("folders");
    onViewChange?.();
  }, [onViewChange]);

  const handleToggleViewMode = useCallback(() => {
    if (viewMode === "photos") {
      setViewMode("folders");
      setSelectedFolder(undefined);
    } else {
      setViewMode("photos");
      setSelectedFolder(undefined);
    }
    onViewChange?.();
  }, [viewMode, onViewChange]);

  const toggleDisplayType = useCallback(() => {
    setDisplayType(prev => prev === "list" ? "grid" : "list");
  }, []);

  return {
    viewMode,
    selectedFolder,
    displayType,
    handleFolderSelect,
    handleBackToFolders,
    handleToggleViewMode,
    toggleDisplayType,
    setSelectedFolder,
    setViewMode,
  };
}
