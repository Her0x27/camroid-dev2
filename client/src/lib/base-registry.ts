export class BaseRegistry<T extends { id: string }> {
  protected items: Map<string, T> = new Map();
  protected defaultId: string | null = null;

  register(item: T): void {
    this.items.set(item.id, item);
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  getDefault(): T | undefined {
    if (!this.defaultId) return undefined;
    return this.items.get(this.defaultId);
  }

  getAll(): T[] {
    return Array.from(this.items.values());
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  setDefaultId(id: string): void {
    if (this.items.has(id)) {
      this.defaultId = id;
    }
  }
}
