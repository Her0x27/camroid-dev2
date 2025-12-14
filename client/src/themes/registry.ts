import { BaseRegistry } from "@/lib/base-registry";
import type { ThemeConfig } from "./types";

class ThemeRegistry extends BaseRegistry<ThemeConfig> {
  constructor() {
    super();
    this.defaultId = 'tactical-dark';
  }

  getByMode(mode: 'light' | 'dark'): ThemeConfig[] {
    return this.getAll().filter(t => t.mode === mode);
  }

  setDefaultThemeId(id: string): void {
    this.setDefaultId(id);
  }
}

export const themeRegistry = new ThemeRegistry();
