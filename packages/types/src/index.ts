/** Flag value types */
export type FlagType = "boolean" | "string" | "number" | "json" | "variant";

/** Resolved flag value (typed by FlagType) */
export type FlagValue = boolean | string | number | Record<string, unknown>;

/** Percentage rollout (0–100) */
export type RolloutPercentage = number;

/** Rollout configuration for gradual release */
export interface RolloutConfig {
  percentage: RolloutPercentage;
  /** Optional seed for consistent hashing (e.g. user id) */
  seed?: string;
}

/** Schedule configuration for time-based activation */
export interface ScheduleConfig {
  /** ISO 8601 start date (optional) */
  start?: string;
  /** ISO 8601 end date (optional) */
  end?: string;
}

/** Condition operators for targeting rules */
export type ConditionOperator =
  | "eq"
  | "neq"
  | "in"
  | "nin"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "matches"
  | "semver_gt"
  | "semver_gte"
  | "semver_lt"
  | "semver_lte";

/** Single targeting condition */
export interface Condition {
  attribute: string;
  operator: ConditionOperator;
  value: FlagValue;
}

/** Targeting rule (AND of conditions) */
export type TargetingRule = Condition[];

/** Variant definition for type: "variant" flags */
export interface FlagVariant {
  key: string;
  value: FlagValue;
  weight?: number;
}

/** Flag definition */
export interface Flag {
  key: string;
  type: FlagType;
  defaultValue: FlagValue;
  /** Variants for type "variant" flags */
  variants?: FlagVariant[];
  /** Whether the flag is enabled (default: true) */
  enabled?: boolean;
  description?: string;
  rollout?: RolloutConfig;
  schedule?: ScheduleConfig;
  /** Targeting rules (OR of AND conditions) */
  rules?: TargetingRule[];
  metadata?: Record<string, unknown>;
}

/** Context passed to evaluation */
export interface EvaluationContext {
  /** User or entity identifier for consistent hashing */
  userId?: string;
  /** Arbitrary attributes for targeting (e.g. country, plan, version) */
  attributes?: Record<string, FlagValue>;
}

/** Reason for evaluation outcome */
export type EvalReason =
  | { kind: "disabled" }
  | { kind: "override" }
  | { kind: "rule"; ruleIndex: number }
  | { kind: "segment"; segmentId: string }
  | { kind: "rollout"; percentage: number }
  | { kind: "schedule"; active: boolean }
  | { kind: "default" }
  | { kind: "error"; message: string };

/** Result of flag evaluation */
export interface EvaluationResult<T extends FlagValue = FlagValue> {
  value: T;
  reason: EvalReason;
}
