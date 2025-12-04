import type { Photo } from "@shared/schema";
import { 
  openDB, 
  PHOTOS_STORE, 
  getFolderCountsCache, 
  setFolderCountsCache, 
  getFolderStatsCache, 
  setFolderStatsCache, 
  isCacheValid,
  invalidateFolderCountsCache 
} from "./db-core";

export { invalidateFolderCountsCache };

export interface FolderStats {
  folder: string | null;
  count: number;
  latestThumb: string | null;
  latestTimestamp: number;
  uploadedCount: number;
}

async function getAllPhotosInternal(sortOrder: "newest" | "oldest" = "newest"): Promise<Photo[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const index = store.index("timestamp");
    const direction = sortOrder === "newest" ? "prev" : "next";
    const request = index.openCursor(null, direction);
    const photos: Photo[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        photos.push(cursor.value);
        cursor.continue();
      } else {
        resolve(photos);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getFolders(): Promise<string[]> {
  const photos = await getAllPhotosInternal();
  const folders = new Set<string>();
  
  for (const photo of photos) {
    if (photo.folder) {
      folders.add(photo.folder);
    }
  }
  
  return Array.from(folders).sort();
}

export async function getPhotosByFolder(folder: string | null, sortOrder: "newest" | "oldest" = "newest"): Promise<Photo[]> {
  const allPhotos = await getAllPhotosInternal(sortOrder);
  
  if (folder === null) {
    return allPhotos.filter((p: Photo) => !p.folder);
  }
  
  return allPhotos.filter((p: Photo) => p.folder === folder);
}

export async function getFolderCounts(): Promise<Map<string | null, number>> {
  const cache = getFolderCountsCache();
  if (isCacheValid(cache) && cache) {
    return cache.counts;
  }
  
  const db = await openDB();
  const counts = new Map<string | null, number>();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const photo = cursor.value as Photo;
        const folder = photo.folder || null;
        counts.set(folder, (counts.get(folder) || 0) + 1);
        cursor.continue();
      } else {
        setFolderCountsCache(counts);
        resolve(counts);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getFolderStats(): Promise<FolderStats[]> {
  const cache = getFolderStatsCache();
  if (isCacheValid(cache) && cache) {
    return cache.stats as FolderStats[];
  }
  
  const db = await openDB();
  const folderMap = new Map<string | null, { count: number; latestThumb: string | null; latestTimestamp: number; uploadedCount: number }>();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const photo = cursor.value as Photo;
        const folderName = photo.folder || null;
        const isUploaded = !!photo.cloud?.url;
        const existing = folderMap.get(folderName);
        
        if (!existing) {
          folderMap.set(folderName, {
            count: 1,
            latestThumb: photo.thumbnailData,
            latestTimestamp: photo.metadata.timestamp,
            uploadedCount: isUploaded ? 1 : 0,
          });
        } else {
          existing.count++;
          if (isUploaded) {
            existing.uploadedCount++;
          }
          if (photo.metadata.timestamp > existing.latestTimestamp) {
            existing.latestThumb = photo.thumbnailData;
            existing.latestTimestamp = photo.metadata.timestamp;
          }
        }
        cursor.continue();
      } else {
        const result: FolderStats[] = [];
        folderMap.forEach((value, key) => {
          result.push({
            folder: key,
            count: value.count,
            latestThumb: value.latestThumb,
            latestTimestamp: value.latestTimestamp,
            uploadedCount: value.uploadedCount,
          });
        });
        
        result.sort((a, b) => {
          if (a.folder === null) return 1;
          if (b.folder === null) return -1;
          return a.folder.localeCompare(b.folder);
        });
        
        setFolderStatsCache(result);
        resolve(result);
      }
    };

    request.onerror = () => reject(request.error);
  });
}
