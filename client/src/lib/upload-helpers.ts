import { cloudProviderRegistry, type ProviderSettings } from "@/cloud-providers";
import { updatePhoto, getPhotoImageData } from "./db";
import { logger } from "./logger";
import type { PhotoWithThumbnail } from "@shared/schema";

export interface UploadSettings {
  providerId: string;
  settings: ProviderSettings;
}

export interface UploadValidationResult {
  isValid: boolean;
  error?: "no_api_key" | "all_uploaded";
  photosToUpload: PhotoWithThumbnail[];
}

export function validateUploadSettings(
  uploadSettings: Partial<UploadSettings> | undefined,
  photos: PhotoWithThumbnail[]
): UploadValidationResult {
  if (!uploadSettings?.providerId || !uploadSettings?.settings?.isValidated) {
    return { isValid: false, error: "no_api_key", photosToUpload: [] };
  }

  const provider = cloudProviderRegistry.get(uploadSettings.providerId);
  if (!provider) {
    return { isValid: false, error: "no_api_key", photosToUpload: [] };
  }

  const photosToUpload = photos.filter((p) => !p.cloud);
  if (photosToUpload.length === 0) {
    return { isValid: false, error: "all_uploaded", photosToUpload: [] };
  }

  return { isValid: true, photosToUpload };
}

export interface UploadResult {
  successCount: number;
  errorCount: number;
  cancelledCount: number;
  updatedPhotos: Map<string, PhotoWithThumbnail["cloud"]>;
}

export async function executePhotoUpload(
  photos: PhotoWithThumbnail[],
  uploadSettings: UploadSettings,
  onProgress: (completed: number, total: number) => void,
  signal: AbortSignal
): Promise<UploadResult> {
  const provider = cloudProviderRegistry.get(uploadSettings.providerId);
  if (!provider) {
    throw new Error(`Cloud provider "${uploadSettings.providerId}" not found`);
  }

  const photosWithImageData: { id: string; imageData: string }[] = [];
  
  for (const photo of photos) {
    const imageData = await getPhotoImageData(photo.id);
    if (imageData) {
      photosWithImageData.push({ id: photo.id, imageData });
    } else {
      logger.warn(`Could not load imageData for photo ${photo.id}`);
    }
  }
  
  const results = await provider.uploadMultiple(
    photosWithImageData,
    uploadSettings.settings,
    onProgress,
    3,
    signal
  );

  const uploadResult: UploadResult = {
    successCount: 0,
    errorCount: 0,
    cancelledCount: 0,
    updatedPhotos: new Map(),
  };

  for (const [photoId, result] of Array.from(results.entries())) {
    if (result.error === "Upload cancelled") {
      uploadResult.cancelledCount++;
    } else if (result.success && result.cloudData) {
      try {
        await updatePhoto(photoId, { cloud: result.cloudData });
        uploadResult.updatedPhotos.set(photoId, result.cloudData);
        uploadResult.successCount++;
      } catch (error) {
        logger.error("Failed to update photo with cloud data", error);
        uploadResult.errorCount++;
      }
    } else {
      uploadResult.errorCount++;
    }
  }

  return uploadResult;
}

export interface UploadToastMessage {
  type: "success" | "cancelled" | "error";
  successCount: number;
  cancelledCount: number;
  errorCount: number;
}

export function getUploadToastMessage(result: UploadResult): UploadToastMessage {
  if (result.cancelledCount > 0) {
    return {
      type: "cancelled",
      successCount: result.successCount,
      cancelledCount: result.cancelledCount,
      errorCount: result.errorCount,
    };
  }

  if (result.errorCount > 0 && result.successCount === 0) {
    return {
      type: "error",
      successCount: result.successCount,
      cancelledCount: result.cancelledCount,
      errorCount: result.errorCount,
    };
  }

  return {
    type: "success",
    successCount: result.successCount,
    cancelledCount: result.cancelledCount,
    errorCount: result.errorCount,
  };
}
