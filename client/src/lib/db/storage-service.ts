import { createCleanBlob } from "@/lib/canvas-utils";

export async function getStorageEstimate(): Promise<{ used: number; quota: number } | null> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return null;
}

export function createCleanImageBlob(base64Data: string): Promise<Blob> {
  return createCleanBlob(base64Data);
}
