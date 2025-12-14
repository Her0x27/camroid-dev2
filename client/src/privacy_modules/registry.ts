import { BaseRegistry } from "@/lib/base-registry";
import type { PrivacyModuleConfig } from "./types";

class PrivacyModuleRegistry extends BaseRegistry<PrivacyModuleConfig> {
  constructor() {
    super();
    this.defaultId = 'game-2048';
  }

  clear(): void {
    this.items.clear();
    this.defaultId = 'game-2048';
  }
}

export const privacyModuleRegistry = new PrivacyModuleRegistry();
export { PrivacyModuleRegistry };
