export type { GameConfig, GameProps } from "./types";
export { gameRegistry } from "./registry";
export { game2048Config } from "./game-2048";

import { gameRegistry } from "./registry";
import { game2048Config } from "./game-2048";

gameRegistry.register(game2048Config);
