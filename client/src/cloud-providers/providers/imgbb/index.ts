import { ImageUp } from "lucide-react";
import type { 
  CloudProvider, 
  UploadResult, 
  ValidationResult, 
  ImageData, 
  ProgressCallback,
  ProviderSettings,
  CloudData
} from "../../types";
import { isImgBBSuccess, isImgBBError, type ImgBBProviderSettings } from "./types";

const IMGBB_API_URL = "https://api.imgbb.com/1/upload";
const DEFAULT_CONCURRENCY = 3;

async function uploadSingle(
  imageBase64: string,
  apiKey: string,
  expiration: number,
  signal?: AbortSignal
): Promise<UploadResult> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { success: false, error: "API key not configured" };
  }

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    const formData = new FormData();
    formData.append("image", base64Data);

    let url = `${IMGBB_API_URL}?key=${apiKey}`;
    if (expiration > 0) {
      url += `&expiration=${expiration}`;
    }

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      signal,
    });

    const result: unknown = await response.json();

    if (isImgBBSuccess(result)) {
      const expirationTime = parseInt(result.data.expiration);
      
      const cloudData: CloudData = {
        url: result.data.url,
        viewerUrl: result.data.url_viewer,
        deleteUrl: result.data.delete_url,
        uploadedAt: Date.now(),
        expiresAt: expirationTime > 0 
          ? Date.now() + (expirationTime * 1000) 
          : null,
      };

      return { success: true, cloudData };
    } else if (isImgBBError(result)) {
      return { 
        success: false, 
        error: result.error?.message || "Upload error" 
      };
    } else {
      return { success: false, error: "Invalid API response" };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "Upload cancelled" };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Network error" 
    };
  }
}

export const imgbbProvider: CloudProvider = {
  id: "imgbb",
  name: "ImgBB",
  icon: ImageUp,
  description: "Free image hosting with optional expiration",
  apiUrl: "https://api.imgbb.com/",

  settingsFields: [
    {
      key: "apiKey",
      type: "password",
      label: "API Key",
      placeholder: "Enter your ImgBB API key",
      defaultValue: "",
      required: true,
    },
    {
      key: "expiration",
      type: "slider",
      label: "Photo Expiration",
      description: "Time before photos are deleted (0 = never)",
      defaultValue: 0,
      min: 0,
      max: 86400,
      step: 60,
    },
    {
      key: "autoUpload",
      type: "switch",
      label: "Auto Upload",
      description: "Automatically upload photos after capture",
      defaultValue: false,
    },
  ],

  getDefaultSettings(): ProviderSettings {
    return {
      apiKey: "",
      expiration: 0,
      autoUpload: false,
      isValidated: false,
    };
  },

  async validateSettings(
    settings: ProviderSettings,
    signal?: AbortSignal
  ): Promise<ValidationResult> {
    const { apiKey } = settings as unknown as ImgBBProviderSettings;
    
    if (!apiKey || apiKey.trim().length === 0) {
      return { valid: false, error: "API key cannot be empty" };
    }

    try {
      const testImage = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      
      const formData = new FormData();
      formData.append("image", testImage);

      const response = await fetch(
        `${IMGBB_API_URL}?expiration=60&key=${apiKey}`,
        {
          method: "POST",
          body: formData,
          signal,
        }
      );

      const result: unknown = await response.json();

      if (isImgBBSuccess(result)) {
        return { valid: true };
      } else if (isImgBBError(result)) {
        return { 
          valid: false, 
          error: result.error?.message || "Invalid API key" 
        };
      } else {
        return { valid: false, error: "Invalid API response" };
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { valid: false, error: "Request cancelled" };
      }
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : "Key validation error" 
      };
    }
  },

  async upload(
    imageBase64: string,
    settings: ProviderSettings,
    signal?: AbortSignal
  ): Promise<UploadResult> {
    const { apiKey, expiration } = settings as unknown as ImgBBProviderSettings;
    return uploadSingle(imageBase64, apiKey, expiration || 0, signal);
  },

  async uploadMultiple(
    images: ImageData[],
    settings: ProviderSettings,
    onProgress?: ProgressCallback,
    concurrency: number = DEFAULT_CONCURRENCY,
    signal?: AbortSignal
  ): Promise<Map<string, UploadResult>> {
    const { apiKey, expiration } = settings as unknown as ImgBBProviderSettings;
    const results = new Map<string, UploadResult>();
    const total = images.length;
    let completed = 0;

    const chunks: ImageData[][] = [];
    for (let i = 0; i < images.length; i += concurrency) {
      chunks.push(images.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      if (signal?.aborted) {
        for (const image of chunk) {
          results.set(image.id, { success: false, error: "Upload cancelled" });
        }
        break;
      }

      const settledResults = await Promise.allSettled(
        chunk.map(async (image) => {
          const result = await uploadSingle(image.imageData, apiKey, expiration || 0, signal);
          return { id: image.id, result };
        })
      );
      
      for (const settledResult of settledResults) {
        if (settledResult.status === "fulfilled") {
          const { id, result } = settledResult.value;
          results.set(id, result);
        } else {
          const failedImage = chunk[settledResults.indexOf(settledResult)];
          if (failedImage) {
            results.set(failedImage.id, {
              success: false,
              error: settledResult.reason?.message || "Upload failed",
            });
          }
        }
        completed++;
        onProgress?.(completed, total);
      }
    }

    return results;
  },
};
