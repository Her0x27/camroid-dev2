import type { ThemeConfig } from "./types";

class ThemeRegistry {
  private themes: Map<string, ThemeConfig> = new Map();
  private defaultThemeId: string = 'tactical-dark';

  register(config: ThemeConfig): void {
    this.themes.set(config.id, config);
  }

  get(id: string): ThemeConfig | undefined {
    return this.themes.get(id);
  }

  getDefault(): ThemeConfig | undefined {
    return this.themes.get(this.defaultThemeId);
  }

  getAll(): ThemeConfig[] {
    return Array.from(this.themes.values());
  }

  getByMode(mode: 'light' | 'dark'): ThemeConfig[] {
    return this.getAll().filter(t => t.mode === mode);
  }

  setDefaultThemeId(id: string): void {
    if (this.themes.has(id)) {
      this.defaultThemeId = id;
    }
  }

  has(id: string): boolean {
    return this.themes.has(id);
  }
}

export const themeRegistry = new ThemeRegistry();
