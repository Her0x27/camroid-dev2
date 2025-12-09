export type { ThemeConfig, ThemeColors } from "./types";
export { themeRegistry } from "./registry";
export { applyTheme } from "./apply-theme";
export { tacticalDark } from "./tactical-dark";
export { tacticalLight } from "./tactical-light";

import { themeRegistry } from "./registry";
import { tacticalDark } from "./tactical-dark";
import { tacticalLight } from "./tactical-light";

themeRegistry.register(tacticalDark);
themeRegistry.register(tacticalLight);
