import type { DisguiseConfig } from "./types";

class DisguiseRegistry {
  private disguises: Map<string, DisguiseConfig> = new Map();
  private defaultDisguiseId: string = 'game-2048';

  register(config: DisguiseConfig): void {
    this.disguises.set(config.id, config);
  }

  get(id: string): DisguiseConfig | undefined {
    return this.disguises.get(id);
  }

  getDefault(): DisguiseConfig | undefined {
    return this.disguises.get(this.defaultDisguiseId);
  }

  getAll(): DisguiseConfig[] {
    return Array.from(this.disguises.values());
  }

  setDefaultDisguiseId(id: string): void {
    if (this.disguises.has(id)) {
      this.defaultDisguiseId = id;
    }
  }

  has(id: string): boolean {
    return this.disguises.has(id);
  }
}

export const disguiseRegistry = new DisguiseRegistry();
