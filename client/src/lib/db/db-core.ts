const DB_NAME = "camera-zeroday";
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

let folderCountsCache: { counts: Map<string | null, number>; timestamp: number } | null = null;
let folderStatsCache: { stats: unknown[]; timestamp: number } | null = null;
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

export function setFolderStatsCache(stats: unknown[]) {
  folderStatsCache = { stats, timestamp: Date.now() };
}

export function isCacheValid(cache: { timestamp: number } | null): boolean {
  return cache !== null && Date.now() - cache.timestamp < FOLDER_COUNTS_TTL_MS;
}
