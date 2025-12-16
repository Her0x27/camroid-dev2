import { useState, useCallback } from "react";

export type ViewMode = "mixed" | "folders" | "photos";
export type DisplayType = "list" | "grid" | "large";

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
  cycleViewMode: () => void;
  toggleDisplayType: () => void;
  cycleDisplayType: () => void;
  setSelectedFolder: (folder: string | null | undefined) => void;
  setViewMode: (mode: ViewMode) => void;
}

export function useGalleryView({ onViewChange }: UseGalleryViewParams = {}): UseGalleryViewReturn {
  const [viewMode, setViewMode] = useState<ViewMode>("mixed");
  const [selectedFolder, setSelectedFolder] = useState<string | null | undefined>(undefined);
  const [displayType, setDisplayType] = useState<DisplayType>("grid");

  const handleFolderSelect = useCallback((folderName: string | null) => {
    setSelectedFolder(folderName);
    setViewMode("photos");
  }, []);

  const handleBackToFolders = useCallback(() => {
    setSelectedFolder(undefined);
    setViewMode("mixed");
    onViewChange?.();
  }, [onViewChange]);

  const handleToggleViewMode = useCallback(() => {
    if (viewMode === "photos") {
      setViewMode("mixed");
      setSelectedFolder(undefined);
    } else {
      setViewMode("photos");
      setSelectedFolder(undefined);
    }
    onViewChange?.();
  }, [viewMode, onViewChange]);

  const cycleViewMode = useCallback(() => {
    setViewMode(prev => {
      if (prev === "mixed") return "folders";
      if (prev === "folders") return "photos";
      return "mixed";
    });
    setSelectedFolder(undefined);
    onViewChange?.();
  }, [onViewChange]);

  const toggleDisplayType = useCallback(() => {
    setDisplayType(prev => prev === "list" ? "grid" : "list");
  }, []);

  const cycleDisplayType = useCallback(() => {
    setDisplayType(prev => {
      if (prev === "list") return "grid";
      if (prev === "grid") return "large";
      return "list";
    });
  }, []);

  return {
    viewMode,
    selectedFolder,
    displayType,
    handleFolderSelect,
    handleBackToFolders,
    handleToggleViewMode,
    cycleViewMode,
    toggleDisplayType,
    cycleDisplayType,
    setSelectedFolder,
    setViewMode,
  };
}
