import type { Photo, InsertPhoto, Settings, PhotoSummary, PhotoWithThumbnail } from "@shared/schema";
import { defaultSettings } from "@shared/schema";
import { createCleanBlob } from "./canvas-utils";

const DB_NAME = "camera-zeroday";
const DB_VERSION = 1;
const PHOTOS_STORE = "photos";
const SETTINGS_STORE = "settings";

export interface PaginatedPhotosOptions {
  sortOrder: "newest" | "oldest";
  limit: number;
  cursor?: number;
  folder?: string | null;
  hasLocation?: boolean;
  hasNote?: boolean;
}

export interface FolderStats {
  folder: string | null;
  count: number;
  latestThumb: string | null;
  latestTimestamp: number;
  uploadedCount: number;
}

export interface PaginatedPhotosResult {
  photos: PhotoWithThumbnail[];
  nextCursor: number | null;
  hasMore: boolean;
  totalMatchingCount: number;
}

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Photos store with indexes
      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        const photosStore = db.createObjectStore(PHOTOS_STORE, { keyPath: "id" });
        photosStore.createIndex("timestamp", "metadata.timestamp", { unique: false });
        photosStore.createIndex("hasLocation", "metadata.latitude", { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "id" });
      }
    };
  });
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Photo CRUD operations
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

export async function updatePhoto(id: string, updates: Partial<Photo>): Promise<Photo | undefined> {
  const db = await openDB();
  const existing = await getPhoto(id);
  
  if (!existing) return undefined;

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

export async function getFolders(): Promise<string[]> {
  const photos = await getAllPhotos();
  const folders = new Set<string>();
  
  for (const photo of photos) {
    if (photo.folder) {
      folders.add(photo.folder);
    }
  }
  
  return Array.from(folders).sort();
}

export async function getPhotosByFolder(folder: string | null, sortOrder: "newest" | "oldest" = "newest"): Promise<Photo[]> {
  const allPhotos = await getAllPhotos(sortOrder);
  
  if (folder === null) {
    return allPhotos.filter(p => !p.folder);
  }
  
  return allPhotos.filter(p => p.folder === folder);
}

let folderCountsCache: { counts: Map<string | null, number>; timestamp: number } | null = null;
let folderStatsCache: { stats: FolderStats[]; timestamp: number } | null = null;
const FOLDER_COUNTS_TTL_MS = 5000;

export async function getFolderCounts(): Promise<Map<string | null, number>> {
  if (folderCountsCache && Date.now() - folderCountsCache.timestamp < FOLDER_COUNTS_TTL_MS) {
    return folderCountsCache.counts;
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
        folderCountsCache = { counts, timestamp: Date.now() };
        resolve(counts);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getFolderStats(): Promise<FolderStats[]> {
  if (folderStatsCache && Date.now() - folderStatsCache.timestamp < FOLDER_COUNTS_TTL_MS) {
    return folderStatsCache.stats;
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
        
        folderStatsCache = { stats: result, timestamp: Date.now() };
        resolve(result);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export function invalidateFolderCountsCache(): void {
  folderCountsCache = null;
  folderStatsCache = null;
}

// Settings operations
export async function getSettings(): Promise<Settings> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readonly");
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.get("settings");

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.data);
      } else {
        resolve(defaultSettings);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readwrite");
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.put({ id: "settings", data: settings });

    request.onsuccess = () => resolve(settings);
    request.onerror = () => reject(request.error);
  });
}

// Get count of photos uploaded to cloud
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

// Get photo counts summary (total and cloud uploaded)
export async function getPhotoCounts(): Promise<{ total: number; cloud: number }> {
  const [total, cloud] = await Promise.all([
    getPhotoCount(),
    getCloudUploadedCount(),
  ]);
  return { total, cloud };
}

// Utility to get storage usage estimate
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

// Note history operations
export async function getNoteHistory(): Promise<string[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readonly");
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.get("note_history");

    request.onsuccess = () => {
      if (request.result && Array.isArray(request.result.notes)) {
        resolve(request.result.notes);
      } else {
        resolve([]);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveNoteToHistory(note: string): Promise<void> {
  if (!note || !note.trim()) return;
  
  const trimmedNote = note.trim();
  const db = await openDB();
  const existingNotes = await getNoteHistory();
  
  // Check if note already exists (case-insensitive)
  const noteExists = existingNotes.some(
    (n) => n.toLowerCase() === trimmedNote.toLowerCase()
  );
  
  if (noteExists) return;
  
  // Add new note at the beginning (most recent first)
  const updatedNotes = [trimmedNote, ...existingNotes].slice(0, 100); // Keep max 100 notes

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readwrite");
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.put({ id: "note_history", notes: updatedNotes });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearNoteHistory(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, "readwrite");
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.delete("note_history");

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Export photo as clean blob without EXIF
export function createCleanImageBlob(base64Data: string): Promise<Blob> {
  return createCleanBlob(base64Data);
}
