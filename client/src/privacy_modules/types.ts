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

export interface PrivacyModuleConfig {
  id: string;
  title: string;
  favicon: string;
  icon: ComponentType<{ className?: string }>;
  component: LazyExoticComponent<ComponentType<PrivacyModuleProps>>;
  unlockMethod: UnlockMethod;
  supportsUniversalUnlock: boolean;
}
