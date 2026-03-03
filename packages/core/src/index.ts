export { dispatch } from "@better-agnostic/handler";
export type { DispatchableEngine } from "@better-agnostic/handler";
export { betterFlag } from "./factory.js";
export { FlagEngine } from "./engine.js";
export type { FlagConfig } from "./engine.js";
export type { FlagAdapter, FlagAdapterFlags } from "./adapter.js";
export { createFlags } from "./createFlags.js";
export type { FlagDefinition, FlagsDefinition } from "./createFlags.js";
export { evaluateFlag } from "./evaluate.js";
export { hashToPercentage } from "./hash.js";
export type { FlagPlugin, FlagEngineHooks } from "./plugin.js";
export { buildRoutes } from "./routes.js";

export type {
  Flag,
  FlagType,
  FlagValue,
  FlagVariant,
  RolloutConfig,
  ScheduleConfig,
  EvaluationContext,
  EvaluationResult,
  EvalReason,
  ConditionOperator,
  Condition,
  TargetingRule,
} from "@better-flag/types";
