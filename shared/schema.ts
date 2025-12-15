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

// Coordinate format for watermark display
export type CoordinateFormat = "decimal" | "dms" | "ddm" | "simple";

// Logo position in watermark
export type LogoPosition = "left" | "right";

// Note placement in watermark
export type NotePlacement = "start" | "end";

// Text alignment in watermark
export type TextAlign = "left" | "center" | "right";

// Separator position in watermark
export type SeparatorPosition = "before-coords" | "after-coords" | "before-note" | "after-note";

// Watermark separator
export const watermarkSeparatorSchema = z.object({
  id: z.string(),
  position: z.enum(["before-coords", "after-coords", "before-note", "after-note"]),
});

export type WatermarkSeparator = z.infer<typeof watermarkSeparatorSchema>;

// Watermark preview configuration (for /ve-watermark page)
export const watermarkPreviewConfigSchema = z.object({
  // Position (percentages)
  positionX: z.number().default(2),
  positionY: z.number().default(2),
  // Background
  backgroundColor: z.string().default("#3b82f6"),
  backgroundOpacity: z.number().min(0).max(100).default(70),
  width: z.number().min(10).max(100).default(40), // width as % of viewport
  height: z.number().min(5).max(50).default(5), // height as % of viewport
  autoSize: z.boolean().default(false), // auto-size based on content
  // Font
  fontColor: z.string().default("#ffffff"),
  fontOpacity: z.number().min(0).max(100).default(100),
  fontSize: z.number().min(1).max(10).default(3), // fontSize as % of viewport min dimension (vmin)
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
  underline: z.boolean().default(false),
  // Position and rotation
  rotation: z.number().min(-180).max(180).default(0),
  // Note
  note: z.string().default(""),
  notePlacement: z.enum(["start", "end"]).default("end"),
  // Coordinate format
  coordinateFormat: z.enum(["decimal", "dms", "ddm", "simple"]).default("decimal"),
  // Logo
  logoUrl: z.string().nullable().default(null),
  logoPosition: z.enum(["left", "right"]).default("left"),
  logoSize: z.number().min(16).max(96).default(40),
  logoOpacity: z.number().min(0).max(100).default(100),
  // Font family
  fontFamily: z.enum(["system", "roboto", "montserrat", "oswald", "playfair"]).default("montserrat"),
  // Text alignment
  textAlign: z.enum(["left", "center", "right"]).default("left"),
  // Separators
  separators: z.array(watermarkSeparatorSchema).default([]),
  // Visibility toggles
  showCoordinates: z.boolean().default(true),
  showGyroscope: z.boolean().default(true),
  showReticle: z.boolean().default(true),
  showNote: z.boolean().default(true),
  showTimestamp: z.boolean().default(true),
});

export type WatermarkPreviewConfig = z.infer<typeof watermarkPreviewConfigSchema>;
export type FontFamily = "system" | "roboto" | "montserrat" | "oswald" | "playfair";

// Reticle preview configuration (for /ve-watermark page)
export const reticlePreviewConfigSchema = z.object({
  shape: z.enum(["crosshair", "circle", "square", "arrow", "speech-bubble", "custom"]).default("crosshair"),
  color: z.string().default("#3b82f6"),
  size: z.number().min(1).max(30).default(5), // size as % of viewport min dimension
  strokeWidth: z.number().min(5).max(50).default(10), // strokeWidth as % of reticle size
  opacity: z.number().min(10).max(100).default(80),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
  autoColor: z.boolean().default(false), // auto-adjust color based on background
  colorScheme: z.enum(["contrast", "tactical", "neon", "monochrome", "warm"]).default("tactical"), // color palette for auto-color
});

export type ReticlePreviewConfig = z.infer<typeof reticlePreviewConfigSchema>;

// Stabilization settings
export const stabilizationSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  threshold: z.number().min(30).max(90).default(60), // Stability threshold %
});

export type StabilizationSettings = z.infer<typeof stabilizationSettingsSchema>;

// Camera resolution preset (16:9 resolutions)
export type CameraResolution = "auto" | "4000x2250" | "3840x2160" | "3264x1836" | "1920x1080" | "1600x900" | "1280x720";

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
  cameraResolution: z.enum(["auto", "4000x2250", "3840x2160", "3264x1836", "1920x1080", "1600x900", "1280x720"]).default("auto"),
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
  watermarkPreview: watermarkPreviewConfigSchema,
  reticlePreview: reticlePreviewConfigSchema,
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
  cameraResolution: "1920x1080",
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
  watermarkPreview: {
    positionX: 2,
    positionY: 2,
    backgroundColor: "#3b82f6",
    backgroundOpacity: 23,
    width: 55,
    height: 5,
    autoSize: false,
    fontColor: "#ffffff",
    fontOpacity: 100,
    fontSize: 3.5,
    bold: true,
    italic: false,
    underline: false,
    rotation: 0,
    note: "А2 деревянный ящик",
    notePlacement: "start",
    coordinateFormat: "simple",
    logoUrl: null,
    logoPosition: "left",
    logoSize: 40,
    logoOpacity: 100,
    fontFamily: "montserrat",
    textAlign: "left",
    separators: [{ id: "sep-1765751432268", position: "before-coords" }],
    showCoordinates: true,
    showGyroscope: false,
    showReticle: true,
    showNote: true,
    showTimestamp: false,
  },
  reticlePreview: {
    shape: "crosshair",
    color: "#3b82f6",
    size: 5,
    strokeWidth: 10,
    opacity: 80,
    positionX: 0,
    positionY: 0,
    autoColor: true,
    colorScheme: "tactical",
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
