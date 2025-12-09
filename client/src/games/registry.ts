import type { GameConfig } from "./types";

class GameRegistry {
  private games: Map<string, GameConfig> = new Map();
  private defaultGameId: string = 'game-2048';

  register(config: GameConfig): void {
    this.games.set(config.id, config);
  }

  get(id: string): GameConfig | undefined {
    return this.games.get(id);
  }

  getDefault(): GameConfig | undefined {
    return this.games.get(this.defaultGameId);
  }

  getAll(): GameConfig[] {
    return Array.from(this.games.values());
  }

  setDefaultGameId(id: string): void {
    if (this.games.has(id)) {
      this.defaultGameId = id;
    }
  }

  has(id: string): boolean {
    return this.games.has(id);
  }
}

export const gameRegistry = new GameRegistry();
