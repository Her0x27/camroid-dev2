import { BaseRegistry } from "@/lib/base-registry";
import type { CloudProvider } from "./types";

class CloudProviderRegistry extends BaseRegistry<CloudProvider> {
  override register(provider: CloudProvider, isDefault = false): void {
    super.register(provider);
    if (isDefault || this.items.size === 1) {
      this.defaultId = provider.id;
    }
  }

  getIds(): string[] {
    return Array.from(this.items.keys());
  }
}

export const cloudProviderRegistry = new CloudProviderRegistry();
