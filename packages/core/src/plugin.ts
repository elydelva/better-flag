import type { Route } from "@better-agnostic/handler";
import type { SchemaContribution } from "@better-agnostic/schema";
import type { EvaluationContext, EvaluationResult, Flag } from "@better-flag/types";
import type { FlagEngine } from "./engine.js";

/** Evaluator runs before default evaluation. Return result to short-circuit, null to continue. */
export interface FlagEvaluator {
  priority: number;
  evaluate: (flag: Flag, context: EvaluationContext) => Promise<EvaluationResult | null>;
}

/** Hook points for plugins (override, rule, segment logic lives in plugins) */
export interface FlagEngineHooks {
  onBeforeEvaluate?: (event: {
    flagKey: string;
    context: EvaluationContext;
  }) => void | Promise<void>;
  onAfterEvaluate?: (event: { flagKey: string; result: EvaluationResult }) => void | Promise<void>;
  [key: string]: unknown;
}

export interface FlagPlugin {
  name: string;
  version?: string;
  routes?: Route<FlagEngine>[];
  hooks?: Partial<FlagEngineHooks>;
  evaluators?: FlagEvaluator[];
  createServices?: (engine: FlagEngine) => Record<string, unknown>;
  init?(engine: FlagEngine): Promise<void> | void;
  schemaContribution?: SchemaContribution;
}
