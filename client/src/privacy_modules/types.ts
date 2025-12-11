import type { ComponentType, LazyExoticComponent } from "react";

export type UnlockMethodType = 'sequence' | 'phrase' | 'swipePattern' | 'tapSequence';

export interface UnlockMethod {
  type: UnlockMethodType;
  defaultValue: string;
  labelKey: string;
  placeholderKey?: string;
  descriptionKey?: string;
}

export interface PrivacyModuleProps {
  onSecretGesture?: () => void;
  gestureType?: 'patternUnlock' | 'severalFingers';
  secretPattern?: string;
  unlockFingers?: number;
  onActivity?: () => void;
  unlockValue?: string;
  onUnlock?: () => void;
}

export interface PlatformFavicon {
  ios: string;
  android: string;
  default: string;
}

export function resolveFavicon(favicon: string | PlatformFavicon): string {
  if (typeof favicon === 'string') {
    return favicon;
  }
  
  if (typeof navigator === 'undefined') {
    return favicon.default;
  }
  
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) {
    return favicon.ios;
  }
  if (/Android/.test(ua)) {
    return favicon.android;
  }
  
  return favicon.default;
}

export interface PrivacyModuleConfig {
  id: string;
  title: string;
  description: string;
  favicon: string | PlatformFavicon;
  icon: ComponentType<{ className?: string }>;
  component: LazyExoticComponent<ComponentType<PrivacyModuleProps>>;
  unlockMethod: UnlockMethod;
  supportsUniversalUnlock: boolean;
}
