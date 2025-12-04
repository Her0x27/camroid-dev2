import { enhanceImage } from "./image-enhancement";
import { savePhoto, updatePhoto, saveNoteToHistory } from "./db";
import { uploadToImgBB } from "./imgbb";
import { logger } from "./logger";
import { deferToIdle, yieldToMain } from "./idle-utils";
import type { InsertPhoto } from "@shared/schema";
import type { EnhancementOptions } from "./image-enhancement";

export interface CaptureResult {
  imageData: string;
  thumbnailData: string;
}

export interface PhotoData {
  geoData: {
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    accuracy: number | null;
  };
  orientationData: {
    heading: number | null;
    tilt: number | null;
  };
  note?: string;
  timestamp: number;
}

export interface EnhancementSettings {
  enabled: boolean;
  sharpness: number;
  denoise: number;
  contrast: number;
}

export interface ImgbbSettings {
  autoUpload: boolean;
  isValidated: boolean;
  apiKey: string;
  expiration: number;
}

export interface SavedPhotoResult {
  id: string;
  thumbnailData: string;
}

export async function applyImageEnhancement(
  imageData: string,
  settings: EnhancementSettings
): Promise<string> {
  if (!settings.enabled) {
    return imageData;
  }

  try {
    const options: EnhancementOptions = {
      sharpness: settings.sharpness,
      denoise: settings.denoise,
      contrast: settings.contrast,
    };
    return await enhanceImage(imageData, options);
  } catch (error) {
    logger.error("Image enhancement failed", error);
    return imageData;
  }
}

export async function savePhotoWithNote(
  result: CaptureResult,
  finalImageData: string,
  photoData: PhotoData
): Promise<SavedPhotoResult> {
  const photo: InsertPhoto = {
    imageData: finalImageData,
    thumbnailData: result.thumbnailData,
    metadata: {
      latitude: photoData.geoData.latitude,
      longitude: photoData.geoData.longitude,
      timestamp: photoData.timestamp,
    },
    note: photoData.note,
    folder: photoData.note,
  };

  const savedPhoto = await savePhoto(photo);

  if (photoData.note) {
    saveNoteToHistory(photoData.note).catch((e) =>
      logger.error("Failed to save note to history", e)
    );
  }

  return {
    id: savedPhoto.id,
    thumbnailData: result.thumbnailData,
  };
}

export interface CloudUploadResult {
  success: boolean;
  uploaded: boolean;
  error?: string;
}

export async function autoUploadToCloud(
  photoId: string,
  imageData: string,
  imgbbSettings: ImgbbSettings,
  isOnline: boolean,
  signal?: AbortSignal
): Promise<CloudUploadResult> {
  if (!imgbbSettings.autoUpload || !imgbbSettings.isValidated || !imgbbSettings.apiKey) {
    return { success: true, uploaded: false };
  }

  if (!isOnline) {
    return { success: true, uploaded: false, error: "offline" };
  }

  if (signal?.aborted) {
    return { success: false, uploaded: false, error: "cancelled" };
  }

  try {
    const uploadResult = await uploadToImgBB(
      imageData,
      imgbbSettings.apiKey,
      imgbbSettings.expiration,
      signal
    );

    if (signal?.aborted) {
      return { success: false, uploaded: false, error: "cancelled" };
    }

    if (uploadResult.success && uploadResult.cloudData) {
      if (signal?.aborted) {
        return { success: false, uploaded: false, error: "cancelled" };
      }
      await updatePhoto(photoId, { cloud: uploadResult.cloudData });
      if (signal?.aborted) {
        return { success: false, uploaded: false, error: "cancelled" };
      }
      return { success: true, uploaded: true };
    }

    return { success: false, uploaded: false, error: uploadResult.error };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, uploaded: false, error: "cancelled" };
    }
    logger.error("Auto-upload failed", error);
    return { success: false, uploaded: false, error: "upload_failed" };
  }
}

export interface DeferredProcessingParams {
  result: CaptureResult;
  photoData: PhotoData;
  enhancementSettings: EnhancementSettings;
  imgbbSettings: ImgbbSettings;
  isOnline: boolean;
  onPhotoSaved: (result: SavedPhotoResult) => void;
  onCloudUpload: (result: CloudUploadResult) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
  signal?: AbortSignal;
}

export function processCaptureDeferred(params: DeferredProcessingParams): void {
  const {
    result,
    photoData,
    enhancementSettings,
    imgbbSettings,
    isOnline,
    onPhotoSaved,
    onCloudUpload,
    onError,
    onComplete,
    signal,
  } = params;

  let isCompleted = false;

  const safeComplete = () => {
    if (!isCompleted) {
      isCompleted = true;
      onComplete();
    }
  };

  deferToIdle(async () => {
    if (signal?.aborted) {
      safeComplete();
      return;
    }

    try {
      await yieldToMain();
      
      if (signal?.aborted) {
        safeComplete();
        return;
      }

      const finalImageData = await applyImageEnhancement(
        result.imageData,
        enhancementSettings
      );

      if (signal?.aborted) {
        safeComplete();
        return;
      }

      await yieldToMain();

      const savedPhoto = await savePhotoWithNote(result, finalImageData, photoData);
      
      if (signal?.aborted) {
        safeComplete();
        return;
      }

      onPhotoSaved(savedPhoto);

      await yieldToMain();

      if (signal?.aborted) {
        safeComplete();
        return;
      }

      const uploadResult = await autoUploadToCloud(
        savedPhoto.id,
        result.imageData,
        imgbbSettings,
        isOnline,
        signal
      );

      if (signal?.aborted) {
        safeComplete();
        return;
      }

      onCloudUpload(uploadResult);
      safeComplete();
    } catch (error) {
      if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
        safeComplete();
        return;
      }
      onError(error instanceof Error ? error : new Error("Processing failed"));
      safeComplete();
    }
  }).catch((error) => {
    if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
      safeComplete();
      return;
    }
    onError(error instanceof Error ? error : new Error("Deferred processing failed"));
    safeComplete();
  });
}
