export type { DisguiseConfig, DisguiseProps, UnlockMethod, UnlockMethodType } from "./types";
export { disguiseRegistry } from "./registry";
export { game2048Config } from "./game-2048";
export { calculatorConfig } from "./calculator";
export { notepadConfig } from "./notepad";

import { disguiseRegistry } from "./registry";
import { game2048Config } from "./game-2048";
import { calculatorConfig } from "./calculator";
import { notepadConfig } from "./notepad";

disguiseRegistry.register(game2048Config);
disguiseRegistry.register(calculatorConfig);
disguiseRegistry.register(notepadConfig);
