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

// Cloud upload data (provider-agnostic)
export const cloudDataSchema = z.object({
  url: z.string(),
  viewerUrl: z.string(),
  deleteUrl: z.string(),
  uploadedAt: z.number(),
  expiresAt: z.number().nullable(),
  provider: z.string().optional(),
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

// Reticle shape types
export type ReticleShape = "crosshair" | "circle" | "square" | "arrow" | "speech-bubble" | "custom";

// Reticle configuration (all values are percentages for consistency)
export const reticleConfigSchema = z.object({
  enabled: z.boolean().default(true),
  shape: z.enum(["crosshair", "circle", "square", "arrow", "speech-bubble", "custom"]).default("crosshair"), // reticle shape type
  size: z.number().min(1).max(50).default(5), // size as % of viewport min dimension
  opacity: z.number().min(10).max(100).default(100), // opacity %
  strokeWidth: z.number().min(1).max(30).default(10), // line thickness as % of reticle size
  showMetadata: z.boolean().default(true),
  autoColor: z.boolean().default(true), // auto-adjust color based on background
  colorScheme: z.enum(["contrast", "tactical", "neon", "monochrome", "warm"]).default("tactical"), // color palette for auto-color
  tapToPosition: z.boolean().default(true), // enable tap-to-position and capture on long press
  longPressDelay: z.number().min(300).max(1500).default(500), // long press delay in ms
  manualAdjustment: z.boolean().default(false), // enable manual position adjustment on frozen frame before capture
});

// Custom reticle position (transient, not persisted)
export interface ReticlePosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export type ReticleConfig = z.infer<typeof reticleConfigSchema>;

// Cloud provider settings (unified structure)
export const cloudProviderSettingsSchema = z.object({
  isValidated: z.boolean().default(false),
}).passthrough();

export type CloudProviderSettings = z.infer<typeof cloudProviderSettingsSchema>;

// Cloud settings with provider selection
export const cloudSettingsSchema = z.object({
  selectedProvider: z.string().default("imgbb"),
  providers: z.record(z.string(), cloudProviderSettingsSchema).default({}),
});

export type CloudSettings = z.infer<typeof cloudSettingsSchema>;

// Legacy ImgBB settings (for backward compatibility)
// Public API key for demo/shared usage
const IMGBB_PUBLIC_API_KEY = "6e41d5b81ccf963f34a1fe7de5760e1f";

export const imgbbSettingsSchema = z.object({
  apiKey: z.string().default(IMGBB_PUBLIC_API_KEY),
  expiration: z.number().min(0).default(0),
  autoUpload: z.boolean().default(false),
  isValidated: z.boolean().default(true),
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

// Expanded sections state (which settings cards are open)
export const expandedSectionsSchema = z.record(z.string(), z.boolean()).default({});
export type ExpandedSections = z.infer<typeof expandedSectionsSchema>;

// App settings stored in IndexedDB
export const settingsSchema = z.object({
  reticle: reticleConfigSchema,
  gpsEnabled: z.boolean().default(true),
  orientationEnabled: z.boolean().default(true),
  autoSaveLocation: z.boolean().default(true),
  cameraFacing: z.enum(["user", "environment"]).default("environment"),
  soundEnabled: z.boolean().default(false),
  accuracyLimit: z.number().min(5).max(100).default(20),
  watermarkScale: z.number().min(50).max(150).default(100),
  showLevelIndicator: z.boolean().default(false),
  cameraResolution: z.enum(["auto", "4k", "1080p", "720p", "480p"]).default("auto"),
  photoQuality: z.number().min(50).max(100).default(90),
  expandedSections: expandedSectionsSchema.default({}),
  cloud: cloudSettingsSchema.default({
    selectedProvider: "imgbb",
    providers: {},
  }),
  imgbb: imgbbSettingsSchema.default({
    apiKey: IMGBB_PUBLIC_API_KEY,
    expiration: 0,
    autoUpload: false,
    isValidated: true,
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
    shape: "crosshair",
    size: 5,
    opacity: 100,
    strokeWidth: 10,
    showMetadata: true,
    autoColor: true,
    colorScheme: "tactical",
    tapToPosition: true,
    longPressDelay: 500,
    manualAdjustment: false,
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
  expandedSections: {},
  cloud: {
    selectedProvider: "imgbb",
    providers: {},
  },
  imgbb: {
    apiKey: "6e41d5b81ccf963f34a1fe7de5760e1f",
    expiration: 0,
    autoUpload: false,
    isValidated: true,
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
