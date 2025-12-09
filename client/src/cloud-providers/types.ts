import type { LucideIcon } from "lucide-react";

export interface CloudData {
  url: string;
  viewerUrl: string;
  deleteUrl: string;
  uploadedAt: number;
  expiresAt: number | null;
}

export interface UploadResult {
  success: boolean;
  cloudData?: CloudData;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageData {
  id: string;
  imageData: string;
}

export type ProgressCallback = (completed: number, total: number) => void;

export type ProviderFieldType = "text" | "password" | "number" | "switch" | "slider";

export interface ProviderSettingField {
  key: string;
  type: ProviderFieldType;
  labelKey: string;
  descriptionKey?: string;
  placeholderKey?: string;
  defaultValue: unknown;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}

export interface ProviderSettings {
  isValidated: boolean;
  [key: string]: unknown;
}

export interface CloudProvider {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  apiUrl: string;
  
  settingsFields: ProviderSettingField[];
  
  getDefaultSettings(): ProviderSettings;
  
  validateSettings(
    settings: ProviderSettings,
    signal?: AbortSignal
  ): Promise<ValidationResult>;
  
  upload(
    imageBase64: string,
    settings: ProviderSettings,
    signal?: AbortSignal
  ): Promise<UploadResult>;
  
  uploadMultiple(
    images: ImageData[],
    settings: ProviderSettings,
    onProgress?: ProgressCallback,
    concurrency?: number,
    signal?: AbortSignal
  ): Promise<Map<string, UploadResult>>;
}
