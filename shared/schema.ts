import { z } from "zod";

// Photo metadata captured at the time of photo (SAFE fields only - no sensitive telemetry)
// Sensitive data (altitude, accuracy, heading, tilt) is only rendered as watermarks, never stored
export const photoMetadataSchema = z.object({
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  timestamp: z.number(), // unix timestamp
});

export type PhotoMetadata = z.infer<typeof photoMetadataSchema>;

// Transient metadata for watermark rendering only - NEVER persisted to storage
export interface TransientMetadata {
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  tilt: number | null;
}

// Cloud upload data from ImgBB
export const cloudDataSchema = z.object({
  url: z.string(), // direct image URL
  viewerUrl: z.string(), // viewer page URL
  deleteUrl: z.string(), // URL to delete the image
  uploadedAt: z.number(), // timestamp when uploaded
  expiresAt: z.number().nullable(), // null means no expiration
});

export type CloudData = z.infer<typeof cloudDataSchema>;

// Main photo object stored in IndexedDB
export const photoSchema = z.object({
  id: z.string(),
  imageData: z.string(), // base64 encoded image without EXIF
  thumbnailData: z.string(), // smaller base64 thumbnail
  metadata: photoMetadataSchema,
  note: z.string().optional(),
  folder: z.string().optional(), // folder name derived from note
  cloud: cloudDataSchema.optional(), // ImgBB cloud data
});

export type Photo = z.infer<typeof photoSchema>;

// Photo summary without binary image data (for list views)
export const photoSummarySchema = photoSchema.omit({ imageData: true, thumbnailData: true });
export type PhotoSummary = z.infer<typeof photoSummarySchema>;

// Photo with thumbnail but without full image data (for gallery views)
export const photoWithThumbnailSchema = photoSchema.omit({ imageData: true });
export type PhotoWithThumbnail = z.infer<typeof photoWithThumbnailSchema>;

// Insert schema for creating new photos
export const insertPhotoSchema = photoSchema.omit({ id: true });
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

// Color scheme for auto-color reticle
export type ColorScheme = "contrast" | "tactical" | "neon" | "monochrome" | "warm";

// Reticle configuration (all values are percentages for consistency)
export const reticleConfigSchema = z.object({
  enabled: z.boolean().default(true),
  size: z.number().min(1).max(50).default(5), // size as % of viewport min dimension
  opacity: z.number().min(10).max(100).default(100), // opacity %
  strokeWidth: z.number().min(1).max(30).default(10), // line thickness as % of reticle size
  showMetadata: z.boolean().default(true),
  autoColor: z.boolean().default(true), // auto-adjust color based on background
  colorScheme: z.enum(["contrast", "tactical", "neon", "monochrome", "warm"]).default("tactical"), // color palette for auto-color
  tapToPosition: z.boolean().default(true), // enable tap-to-position and capture on long press
});

// Custom reticle position (transient, not persisted)
export interface ReticlePosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export type ReticleConfig = z.infer<typeof reticleConfigSchema>;

// ImgBB cloud upload settings
export const imgbbSettingsSchema = z.object({
  apiKey: z.string().default("3a60e9c6714113cafe732777909133d7"),
  expiration: z.number().min(0).default(0), // 0 = no expiration
  autoUpload: z.boolean().default(false),
  isValidated: z.boolean().default(false), // whether API key has been validated
});

export type ImgbbSettings = z.infer<typeof imgbbSettingsSchema>;

// Image enhancement settings
export const enhancementSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  sharpness: z.number().min(0).max(100).default(30),
  denoise: z.number().min(0).max(100).default(20),
  contrast: z.number().min(0).max(100).default(10),
});

export type EnhancementSettings = z.infer<typeof enhancementSettingsSchema>;

// Stabilization settings
export const stabilizationSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  threshold: z.number().min(30).max(90).default(60), // Stability threshold %
});

export type StabilizationSettings = z.infer<typeof stabilizationSettingsSchema>;

// Camera resolution preset
export type CameraResolution = "auto" | "4k" | "1080p" | "720p" | "480p";

// App settings stored in IndexedDB
export const settingsSchema = z.object({
  reticle: reticleConfigSchema,
  gpsEnabled: z.boolean().default(true),
  orientationEnabled: z.boolean().default(true),
  autoSaveLocation: z.boolean().default(true),
  cameraFacing: z.enum(["user", "environment"]).default("environment"),
  soundEnabled: z.boolean().default(false),
  accuracyLimit: z.number().min(5).max(100).default(20), // GPS accuracy limit in meters
  watermarkScale: z.number().min(50).max(150).default(100), // Watermark size as percentage
  showLevelIndicator: z.boolean().default(false), // Show geometric level indicator
  cameraResolution: z.enum(["auto", "4k", "1080p", "720p", "480p"]).default("auto"), // Camera resolution
  photoQuality: z.number().min(50).max(100).default(90), // JPEG quality percentage
  imgbb: imgbbSettingsSchema.default({
    apiKey: "3a60e9c6714113cafe732777909133d7",
    expiration: 0,
    autoUpload: false,
    isValidated: false,
  }),
  stabilization: stabilizationSettingsSchema.default({
    enabled: true,
    threshold: 60,
  }),
  enhancement: enhancementSettingsSchema.default({
    enabled: true,
    sharpness: 30,
    denoise: 20,
    contrast: 10,
  }),
});

export type Settings = z.infer<typeof settingsSchema>;

export const defaultSettings: Settings = {
  reticle: {
    enabled: true,
    size: 5,
    opacity: 100,
    strokeWidth: 10,
    showMetadata: true,
    autoColor: true,
    colorScheme: "tactical",
    tapToPosition: true,
  },
  gpsEnabled: true,
  orientationEnabled: true,
  autoSaveLocation: true,
  cameraFacing: "environment",
  soundEnabled: false,
  accuracyLimit: 20,
  watermarkScale: 100,
  showLevelIndicator: false,
  cameraResolution: "1080p",
  photoQuality: 90,
  imgbb: {
    apiKey: "3a60e9c6714113cafe732777909133d7",
    expiration: 0,
    autoUpload: false,
    isValidated: false,
  },
  stabilization: {
    enabled: true,
    threshold: 60,
  },
  enhancement: {
    enabled: true,
    sharpness: 30,
    denoise: 20,
    contrast: 10,
  },
};

// Gallery filter options
export const galleryFilterSchema = z.object({
  sortBy: z.enum(["newest", "oldest"]).default("newest"),
  hasLocation: z.boolean().optional(),
  hasNote: z.boolean().optional(),
  dateFrom: z.number().optional(),
  dateTo: z.number().optional(),
});

export type GalleryFilter = z.infer<typeof galleryFilterSchema>;
