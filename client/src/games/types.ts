import type { ComponentType, LazyExoticComponent } from "react";

export interface GameProps {
  onSecretGesture?: () => void;
  gestureType?: 'patternUnlock' | 'severalFingers';
  secretPattern?: string;
  unlockFingers?: number;
  onActivity?: () => void;
}

export interface GameConfig {
  id: string;
  title: string;
  favicon: string;
  icon: ComponentType<{ className?: string }>;
  component: LazyExoticComponent<ComponentType<GameProps>>;
}
