import { useState, useCallback } from "react";
import type { GalleryFilter } from "@shared/schema";

interface UseGalleryFiltersReturn {
  filter: GalleryFilter;
  hasActiveFilters: boolean;
  toggleSortOrder: () => void;
  toggleLocationFilter: () => void;
  toggleNoteFilter: () => void;
  clearFilters: () => void;
}

export function useGalleryFilters(): UseGalleryFiltersReturn {
  const [filter, setFilter] = useState<GalleryFilter>({ sortBy: "newest" });

  const hasActiveFilters = Boolean(filter.hasLocation || filter.hasNote);

  const toggleSortOrder = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      sortBy: prev.sortBy === "newest" ? "oldest" : "newest",
    }));
  }, []);

  const toggleLocationFilter = useCallback(() => {
    setFilter((prev) => ({ 
      ...prev, 
      hasLocation: prev.hasLocation ? undefined : true 
    }));
  }, []);

  const toggleNoteFilter = useCallback(() => {
    setFilter((prev) => ({ 
      ...prev, 
      hasNote: prev.hasNote ? undefined : true 
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilter({ sortBy: filter.sortBy });
  }, [filter.sortBy]);

  return {
    filter,
    hasActiveFilters,
    toggleSortOrder,
    toggleLocationFilter,
    toggleNoteFilter,
    clearFilters,
  };
}
