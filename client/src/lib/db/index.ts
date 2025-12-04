export { openDB, generateId, invalidateFolderCountsCache } from "./db-core";

export {
  savePhoto,
  getPhoto,
  getPhotoThumbnail,
  getAllPhotos,
  getPhotoIds,
  getPhotosSummary,
  getPhotosWithThumbnails,
  getPhotosWithThumbnailsPaginated,
  getFilteredPhotoCount,
  getPhotoImageData,
  getLatestPhoto,
  updatePhoto,
  deletePhoto,
  getPhotoCount,
  clearAllPhotos,
  getCloudUploadedCount,
  getPhotoCounts,
  type PaginatedPhotosOptions,
  type PaginatedPhotosResult,
} from "./photo-service";

export {
  getFolders,
  getPhotosByFolder,
  getFolderCounts,
  getFolderStats,
  type FolderStats,
} from "./folder-service";

export {
  getSettings,
  saveSettings,
  getNoteHistory,
  saveNoteToHistory,
  clearNoteHistory,
} from "./settings-service";

export {
  getStorageEstimate,
  createCleanImageBlob,
} from "./storage-service";
