import type { FlagConfig } from "./engine.js";
import { FlagEngine } from "./engine.js";

export function betterFlag(config: FlagConfig): FlagEngine {
  return new FlagEngine(config);
}
