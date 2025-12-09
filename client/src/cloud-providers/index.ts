export * from "./types";
export { cloudProviderRegistry } from "./registry";

import { cloudProviderRegistry } from "./registry";
import { imgbbProvider } from "./providers/imgbb";

cloudProviderRegistry.register(imgbbProvider, true);
