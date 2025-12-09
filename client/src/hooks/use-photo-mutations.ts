import { useCallback, useState } from "react";
import { deletePhoto, updatePhoto, clearAllPhotos } from "@/lib/db";
import { cloudProviderRegistry, type ProviderSettings } from "@/cloud-providers";
import { withErrorHandling, type AsyncResult } from "@/lib/async-utils";
import type { Photo, CloudData } from "@shared/schema";

export type MutationResult<T = void> = AsyncResult<T>;

export interface UsePhotoMutationsResult {
  deletePhotoById: (id: string) => Promise<MutationResult>;
  deleteMultiple: (ids: string[]) => Promise<MutationResult>;
  updatePhotoById: (id: string, updates: Partial<Photo>) => Promise<MutationResult<Photo>>;
  uploadPhotoToCloud: (photo: Photo, providerId: string, settings: ProviderSettings) => Promise<MutationResult<CloudData>>;
  clearAll: () => Promise<MutationResult>;
  isDeleting: boolean;
  isUpdating: boolean;
  isUploading: boolean;
  lastError: Error | null;
}

export function usePhotoMutations(): UsePhotoMutationsResult {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const deletePhotoById = useCallback(async (id: string): Promise<MutationResult> => {
    return withErrorHandling(
      async () => { await deletePhoto(id); },
      setIsDeleting,
      setLastError,
      "Failed to delete photo"
    );
  }, []);

  const deleteMultiple = useCallback(async (ids: string[]): Promise<MutationResult> => {
    return withErrorHandling(
      async () => { await Promise.all(ids.map(id => deletePhoto(id))); },
      setIsDeleting,
      setLastError,
      "Failed to delete photos"
    );
  }, []);

  const updatePhotoById = useCallback(async (id: string, updates: Partial<Photo>): Promise<MutationResult<Photo>> => {
    return withErrorHandling(
      async () => {
        const updated = await updatePhoto(id, updates);
        if (!updated) {
          throw new Error("Photo not found");
        }
        return updated;
      },
      setIsUpdating,
      setLastError,
      "Failed to update photo"
    );
  }, []);

  const uploadPhotoToCloud = useCallback(async (
    photo: Photo,
    providerId: string,
    settings: ProviderSettings
  ): Promise<MutationResult<CloudData>> => {
    return withErrorHandling(
      async () => {
        const provider = cloudProviderRegistry.get(providerId);
        if (!provider) {
          throw new Error(`Cloud provider "${providerId}" not found`);
        }

        const result = await provider.upload(photo.imageData, settings);
        
        if (!result.success || !result.cloudData) {
          throw new Error(result.error || "Upload failed");
        }
        
        await updatePhoto(photo.id, { cloud: result.cloudData });
        return result.cloudData;
      },
      setIsUploading,
      setLastError,
      "Failed to upload photo"
    );
  }, []);

  const clearAll = useCallback(async (): Promise<MutationResult> => {
    return withErrorHandling(
      async () => { await clearAllPhotos(); },
      setIsDeleting,
      setLastError,
      "Failed to clear photos"
    );
  }, []);

  return {
    deletePhotoById,
    deleteMultiple,
    updatePhotoById,
    uploadPhotoToCloud,
    clearAll,
    isDeleting,
    isUpdating,
    isUploading,
    lastError,
  };
}
