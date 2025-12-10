import type { CloudData } from "@shared/schema";
import { isImgBBSuccess, isImgBBError } from "@/cloud-providers/providers/imgbb/types";
import { UPLOAD } from "./constants";
import { isBackendAvailable } from "./config-loader";

export interface UploadResult {
  success: boolean;
  cloudData?: CloudData;
  error?: string;
}

async function uploadViaProxy(
  base64Data: string,
  apiKey: string,
  expiration: number,
  signal?: AbortSignal
): Promise<Response> {
  return fetch("/api/imgbb", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: base64Data,
      apiKey,
      expiration,
    }),
    signal,
  });
}

async function uploadDirect(
  base64Data: string,
  apiKey: string,
  expiration: number,
  signal?: AbortSignal
): Promise<Response> {
  const formData = new FormData();
  formData.append("image", base64Data);

  let url = `https://api.imgbb.com/1/upload?key=${apiKey}`;
  if (expiration > 0) {
    url += `&expiration=${expiration}`;
  }

  return fetch(url, {
    method: "POST",
    body: formData,
    signal,
  });
}

export async function validateApiKey(
  apiKey: string,
  signal?: AbortSignal
): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: "API key cannot be empty" };
  }

  try {
    const testImage = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    
    let response: Response;
    if (isBackendAvailable()) {
      response = await uploadViaProxy(testImage, apiKey, 60, signal);
    } else {
      response = await uploadDirect(testImage, apiKey, 60, signal);
    }

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
}

export async function uploadToImgBB(
  imageBase64: string,
  apiKey: string,
  expiration: number = 0,
  signal?: AbortSignal
): Promise<UploadResult> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { success: false, error: "API key not configured" };
  }

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    let response: Response;
    if (isBackendAvailable()) {
      response = await uploadViaProxy(base64Data, apiKey, expiration, signal);
    } else {
      response = await uploadDirect(base64Data, apiKey, expiration, signal);
    }

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

async function uploadWithSettled(
  image: { id: string; imageData: string },
  apiKey: string,
  expiration: number,
  signal?: AbortSignal
): Promise<{ id: string; result: UploadResult }> {
  const result = await uploadToImgBB(image.imageData, apiKey, expiration, signal);
  return { id: image.id, result };
}

export async function uploadMultipleToImgBB(
  images: Array<{ id: string; imageData: string }>,
  apiKey: string,
  expiration: number = 0,
  onProgress?: (completed: number, total: number) => void,
  concurrency: number = UPLOAD.CONCURRENT_UPLOADS,
  signal?: AbortSignal
): Promise<Map<string, UploadResult>> {
  const results = new Map<string, UploadResult>();
  const total = images.length;
  let completed = 0;

  const chunks: Array<Array<{ id: string; imageData: string }>> = [];
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
      chunk.map(image => uploadWithSettled(image, apiKey, expiration, signal))
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
}
