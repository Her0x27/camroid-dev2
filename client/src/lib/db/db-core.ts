const DB_NAME = "app-data";
const DB_VERSION = 1;
export const PHOTOS_STORE = "photos";
export const SETTINGS_STORE = "settings";

let dbInstance: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
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

      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        const photosStore = db.createObjectStore(PHOTOS_STORE, { keyPath: "id" });
        photosStore.createIndex("timestamp", "metadata.timestamp", { unique: false });
        photosStore.createIndex("hasLocation", "metadata.latitude", { unique: false });
      }

      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "id" });
      }
    };
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export interface FolderStatsEntry {
  folder: string | null;
  count: number;
  latestThumb: string | null;
  latestTimestamp: number;
  uploadedCount: number;
}

let folderCountsCache: { counts: Map<string | null, number>; timestamp: number } | null = null;
let folderStatsCache: { stats: FolderStatsEntry[]; timestamp: number } | null = null;
const FOLDER_COUNTS_TTL_MS = 30000;

export function invalidateFolderCountsCache(): void {
  folderCountsCache = null;
  folderStatsCache = null;
}

export function getFolderCountsCache() {
  return folderCountsCache;
}

export function setFolderCountsCache(counts: Map<string | null, number>) {
  folderCountsCache = { counts, timestamp: Date.now() };
}

export function getFolderStatsCache() {
  return folderStatsCache;
}

export function setFolderStatsCache(stats: FolderStatsEntry[]) {
  folderStatsCache = { stats, timestamp: Date.now() };
}

export function isCacheValid(cache: { timestamp: number } | null): boolean {
  return cache !== null && Date.now() - cache.timestamp < FOLDER_COUNTS_TTL_MS;
}

export function updateCacheOnPhotoAdd(
  folder: string | null,
  thumbnailData: string | null,
  timestamp: number,
  isUploaded: boolean
): void {
  if (folderCountsCache) {
    const newCounts = new Map(folderCountsCache.counts);
    const currentCount = newCounts.get(folder) || 0;
    newCounts.set(folder, currentCount + 1);
    folderCountsCache = { counts: newCounts, timestamp: Date.now() };
  }
  
  if (folderStatsCache) {
    const newStats = folderStatsCache.stats.map(s => ({ ...s }));
    const existingIndex = newStats.findIndex(s => s.folder === folder);
    
    if (existingIndex >= 0) {
      const existing = newStats[existingIndex];
      existing.count++;
      if (isUploaded) {
        existing.uploadedCount++;
      }
      if (timestamp > existing.latestTimestamp) {
        existing.latestThumb = thumbnailData;
        existing.latestTimestamp = timestamp;
      }
    } else {
      newStats.push({
        folder,
        count: 1,
        latestThumb: thumbnailData,
        latestTimestamp: timestamp,
        uploadedCount: isUploaded ? 1 : 0,
      });
      newStats.sort((a, b) => {
        if (a.folder === null) return 1;
        if (b.folder === null) return -1;
        return a.folder.localeCompare(b.folder);
      });
    }
    folderStatsCache = { stats: newStats, timestamp: Date.now() };
  }
}

export function updateCacheOnPhotoDelete(
  folder: string | null,
  wasUploaded: boolean,
  wasLatestInFolder: boolean
): void {
  if (folderCountsCache) {
    const newCounts = new Map(folderCountsCache.counts);
    const currentCount = newCounts.get(folder) || 0;
    if (currentCount > 1) {
      newCounts.set(folder, currentCount - 1);
    } else {
      newCounts.delete(folder);
    }
    folderCountsCache = { counts: newCounts, timestamp: Date.now() };
  }
  
  if (wasLatestInFolder) {
    folderStatsCache = null;
  } else if (folderStatsCache) {
    const newStats = folderStatsCache.stats.map(s => ({ ...s }));
    const existingIndex = newStats.findIndex(s => s.folder === folder);
    
    if (existingIndex >= 0) {
      const existing = newStats[existingIndex];
      existing.count--;
      if (wasUploaded) {
        existing.uploadedCount = Math.max(0, existing.uploadedCount - 1);
      }
      if (existing.count <= 0) {
        newStats.splice(existingIndex, 1);
      }
    }
    folderStatsCache = { stats: newStats, timestamp: Date.now() };
  }
}

export function updateCacheOnPhotoUpload(folder: string | null): void {
  if (folderStatsCache) {
    const newStats = folderStatsCache.stats.map(s => ({ ...s }));
    const existing = newStats.find(s => s.folder === folder);
    
    if (existing) {
      existing.uploadedCount++;
    }
    folderStatsCache = { stats: newStats, timestamp: Date.now() };
  }
}

export function updateCacheOnFolderChange(): void {
  invalidateFolderCountsCache();
}
