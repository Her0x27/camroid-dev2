import type { Photo, InsertPhoto, PhotoSummary, PhotoWithThumbnail } from "@shared/schema";
import { openDB, generateId, PHOTOS_STORE, invalidateFolderCountsCache } from "./db-core";

export interface PaginatedPhotosOptions {
  sortOrder: "newest" | "oldest";
  limit: number;
  cursor?: number;
  folder?: string | null;
  hasLocation?: boolean;
  hasNote?: boolean;
}

export interface PaginatedPhotosResult {
  photos: PhotoWithThumbnail[];
  nextCursor: number | null;
  hasMore: boolean;
  totalMatchingCount: number;
}

export async function savePhoto(photo: InsertPhoto): Promise<Photo> {
  const db = await openDB();
  const id = generateId();
  const fullPhoto: Photo = { ...photo, id };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.add(fullPhoto);

    request.onsuccess = () => {
      invalidateFolderCountsCache();
      resolve(fullPhoto);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getPhoto(id: string): Promise<Photo | undefined> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getPhotoThumbnail(id: string): Promise<string | undefined> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      const photo = request.result as Photo | undefined;
      resolve(photo?.thumbnailData);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAllPhotos(sortOrder: "newest" | "oldest" = "newest"): Promise<Photo[]> {
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

export async function getPhotoIds(sortOrder: "newest" | "oldest" = "newest"): Promise<string[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const index = store.index("timestamp");
    const direction = sortOrder === "newest" ? "prev" : "next";
    const request = index.openCursor(null, direction);
    const ids: string[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        ids.push(cursor.value.id);
        cursor.continue();
      } else {
        resolve(ids);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getPhotosSummary(sortOrder: "newest" | "oldest" = "newest"): Promise<PhotoSummary[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const index = store.index("timestamp");
    const direction = sortOrder === "newest" ? "prev" : "next";
    const request = index.openCursor(null, direction);
    const summaries: PhotoSummary[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const photo = cursor.value as Photo;
        const { imageData: _, thumbnailData: __, ...summary } = photo;
        summaries.push(summary);
        cursor.continue();
      } else {
        resolve(summaries);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getPhotosWithThumbnails(sortOrder: "newest" | "oldest" = "newest"): Promise<PhotoWithThumbnail[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const index = store.index("timestamp");
    const direction = sortOrder === "newest" ? "prev" : "next";
    const request = index.openCursor(null, direction);
    const photos: PhotoWithThumbnail[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const photo = cursor.value as Photo;
        const { imageData: _, ...withThumbnail } = photo;
        photos.push(withThumbnail);
        cursor.continue();
      } else {
        resolve(photos);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

function photoMatchesFilters(
  photo: Photo,
  folder: string | null | undefined,
  hasLocation: boolean | undefined,
  hasNote: boolean | undefined
): boolean {
  if (folder !== undefined && (photo.folder || null) !== folder) {
    return false;
  }
  if (hasLocation && photo.metadata.latitude === null) {
    return false;
  }
  if (hasNote && (!photo.note || photo.note.trim().length === 0)) {
    return false;
  }
  return true;
}

export async function getPhotosWithThumbnailsPaginated(
  options: PaginatedPhotosOptions
): Promise<PaginatedPhotosResult> {
  const { sortOrder, limit, cursor, folder, hasLocation, hasNote } = options;
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const index = store.index("timestamp");
    const direction = sortOrder === "newest" ? "prev" : "next";
    
    const range = cursor !== undefined
      ? sortOrder === "newest"
        ? IDBKeyRange.upperBound(cursor, true)
        : IDBKeyRange.lowerBound(cursor, true)
      : null;
    
    const request = index.openCursor(range, direction);
    const photos: PhotoWithThumbnail[] = [];
    let lastTimestamp: number | null = null;
    let matchingCount = 0;
    let totalScanned = 0;
    const MAX_SCAN = 10000;

    request.onsuccess = (event) => {
      const cursorResult = (event.target as IDBRequest).result;
      
      if (cursorResult && totalScanned < MAX_SCAN) {
        totalScanned++;
        const photo = cursorResult.value as Photo;
        
        if (photoMatchesFilters(photo, folder, hasLocation, hasNote)) {
          matchingCount++;
          
          if (photos.length < limit) {
            const { imageData: _, ...withThumbnail } = photo;
            photos.push(withThumbnail);
            lastTimestamp = photo.metadata.timestamp;
          }
        }
        
        cursorResult.continue();
      } else {
        const hasMore = photos.length === limit && matchingCount > limit;
        resolve({
          photos,
          nextCursor: hasMore && lastTimestamp !== null ? lastTimestamp : null,
          hasMore,
          totalMatchingCount: matchingCount,
        });
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getFilteredPhotoCount(
  folder?: string | null,
  hasLocation?: boolean,
  hasNote?: boolean
): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.openCursor();
    let count = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const photo = cursor.value as Photo;
        if (photoMatchesFilters(photo, folder, hasLocation, hasNote)) {
          count++;
        }
        cursor.continue();
      } else {
        resolve(count);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getPhotoImageData(id: string): Promise<string | undefined> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      const photo = request.result as Photo | undefined;
      resolve(photo?.imageData);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getLatestPhoto(): Promise<Photo | undefined> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const index = store.index("timestamp");
    const request = index.openCursor(null, "prev");

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        resolve(cursor.value);
      } else {
        resolve(undefined);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function updatePhoto(id: string, updates: Partial<Photo>): Promise<Photo> {
  const db = await openDB();
  const existing = await getPhoto(id);

  if (!existing) {
    throw new Error(`Photo not found: ${id}`);
  }

  const updated = { ...existing, ...updates };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.put(updated);

    request.onsuccess = () => resolve(updated);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePhoto(id: string): Promise<boolean> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      invalidateFolderCountsCache();
      resolve(true);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getPhotoCount(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllPhotos(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.clear();

    request.onsuccess = () => {
      invalidateFolderCountsCache();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getCloudUploadedCount(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const store = tx.objectStore(PHOTOS_STORE);
    const request = store.openCursor();
    let count = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const photo = cursor.value as Photo;
        if (photo.cloud?.url) {
          count++;
        }
        cursor.continue();
      } else {
        resolve(count);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getPhotoCounts(): Promise<{ total: number; cloud: number }> {
  const [total, cloud] = await Promise.all([
    getPhotoCount(),
    getCloudUploadedCount(),
  ]);
  return { total, cloud };
}
