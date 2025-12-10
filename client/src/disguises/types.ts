import type { ComponentType, LazyExoticComponent } from "react";

export type UnlockMethodType = 'sequence' | 'phrase' | 'swipePattern' | 'tapSequence';

export interface UnlockMethod {
  type: UnlockMethodType;
  defaultValue: string;
  labelKey: string;
  placeholderKey?: string;
  descriptionKey?: string;
}

export interface DisguiseProps {
  onSecretGesture?: () => void;
  gestureType?: 'patternUnlock' | 'severalFingers';
  secretPattern?: string;
  unlockFingers?: number;
  onActivity?: () => void;
  disguiseUnlockValue?: string;
  onDisguiseUnlock?: () => void;
}

export interface DisguiseConfig {
  id: string;
  title: string;
  favicon: string;
  icon: ComponentType<{ className?: string }>;
  component: LazyExoticComponent<ComponentType<DisguiseProps>>;
  unlockMethod: UnlockMethod;
  supportsUniversalUnlock: boolean;
}
