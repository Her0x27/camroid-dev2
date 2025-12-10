export type { PrivacyModuleConfig, PrivacyModuleProps, UnlockMethod, UnlockMethodType } from "./types";
export { privacyModuleRegistry } from "./registry";
export { game2048Config } from "./game-2048";
export { calculatorConfig } from "./calculator";
export { notepadConfig } from "./notepad";

import { privacyModuleRegistry } from "./registry";
import { game2048Config } from "./game-2048";
import { calculatorConfig } from "./calculator";
import { notepadConfig } from "./notepad";

privacyModuleRegistry.register(game2048Config);
privacyModuleRegistry.register(calculatorConfig);
privacyModuleRegistry.register(notepadConfig);
