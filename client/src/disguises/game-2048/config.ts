import { lazy } from "react";
import { Grid3X3 } from "lucide-react";
import type { DisguiseConfig } from "../types";

export const game2048Config: DisguiseConfig = {
  id: 'game-2048',
  title: '2048',
  favicon: '/game-icon.svg',
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
