import type { PrivacyModuleConfig } from "./types";

class PrivacyModuleRegistry {
  private modules: Map<string, PrivacyModuleConfig> = new Map();
  private defaultId: string = 'game-2048';

  register(config: PrivacyModuleConfig): void {
    this.modules.set(config.id, config);
  }

  get(id: string): PrivacyModuleConfig | undefined {
    return this.modules.get(id);
  }

  getDefault(): PrivacyModuleConfig | undefined {
    return this.modules.get(this.defaultId);
  }

  getAll(): PrivacyModuleConfig[] {
    return Array.from(this.modules.values());
  }

  setDefaultId(id: string): void {
    if (this.modules.has(id)) {
      this.defaultId = id;
    }
  }

  has(id: string): boolean {
    return this.modules.has(id);
  }

  clear(): void {
    this.modules.clear();
    this.defaultId = 'game-2048';
  }
}

export const privacyModuleRegistry = new PrivacyModuleRegistry();
export { PrivacyModuleRegistry };
