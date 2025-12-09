import type { CloudProvider } from "./types";

class CloudProviderRegistry {
  private providers = new Map<string, CloudProvider>();
  private defaultProviderId: string | null = null;

  register(provider: CloudProvider, isDefault = false): void {
    this.providers.set(provider.id, provider);
    if (isDefault || this.providers.size === 1) {
      this.defaultProviderId = provider.id;
    }
  }

  get(id: string): CloudProvider | undefined {
    return this.providers.get(id);
  }

  getDefault(): CloudProvider | undefined {
    if (!this.defaultProviderId) return undefined;
    return this.providers.get(this.defaultProviderId);
  }

  getAll(): CloudProvider[] {
    return Array.from(this.providers.values());
  }

  getIds(): string[] {
    return Array.from(this.providers.keys());
  }

  has(id: string): boolean {
    return this.providers.has(id);
  }
}

export const cloudProviderRegistry = new CloudProviderRegistry();
