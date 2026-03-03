import type { Route } from "@better-agnostic/handler";
import type { FlagEngine } from "./engine.js";
import {
  handleFlagsCreate,
  handleFlagsDelete,
  handleFlagsEvaluate,
  handleFlagsGet,
  handleFlagsList,
  handleFlagsUpdate,
} from "./handlers.js";
import type { FlagPlugin } from "./plugin.js";

const BASE = "/flags";

const coreRoutes: Route<FlagEngine>[] = [
  { method: "GET", path: `${BASE}`, handler: handleFlagsList },
  { method: "POST", path: `${BASE}`, handler: handleFlagsCreate },
  { method: "POST", path: `${BASE}/evaluate`, handler: handleFlagsEvaluate },
  { method: "GET", path: `${BASE}/:key`, handler: handleFlagsGet },
  { method: "PATCH", path: `${BASE}/:key`, handler: handleFlagsUpdate },
  { method: "DELETE", path: `${BASE}/:key`, handler: handleFlagsDelete },
];

export function buildRoutes(plugins?: FlagPlugin[]): Route<FlagEngine>[] {
  const pluginRoutes = plugins?.flatMap((p) => p.routes ?? []) ?? [];
  return [...coreRoutes, ...pluginRoutes];
}
