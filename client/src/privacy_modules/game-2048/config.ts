import { lazy } from "react";
import { Grid3X3 } from "lucide-react";
import type { PrivacyModuleConfig } from "../types";

export const game2048Config: PrivacyModuleConfig = {
  id: 'game-2048',
  title: '2048',
  description: 'A simple yet addictive sliding puzzle game. Combine tiles to reach the 2048 tile and enjoy endless challenges.',
  favicon: {
    ios: '/game-icon-ios.svg',
    android: '/game-icon-android.svg',
    default: '/game-icon.svg',
  },
  icon: Grid3X3,
  component: lazy(() => import("@/components/game-2048")),
  unlockMethod: {
    type: 'swipePattern',
    defaultValue: '',
    labelKey: 'swipePatternLabel',
    descriptionKey: 'swipePatternDesc',
  },
  supportsUniversalUnlock: true,
};
