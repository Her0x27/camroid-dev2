export type { ThemeConfig, ThemeColors } from "./types";
export { themeRegistry } from "./registry";
export { applyTheme } from "./apply-theme";
export { tacticalDark } from "./tactical-dark";
export { tacticalLight } from "./tactical-light";
export { classicDark } from "./classic-dark";
export { classicLight } from "./classic-light";

import { themeRegistry } from "./registry";
import { tacticalDark } from "./tactical-dark";
import { tacticalLight } from "./tactical-light";
import { classicDark } from "./classic-dark";
import { classicLight } from "./classic-light";

themeRegistry.register(tacticalDark);
themeRegistry.register(tacticalLight);
themeRegistry.register(classicDark);
themeRegistry.register(classicLight);
