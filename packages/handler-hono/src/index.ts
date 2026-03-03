import { createHonoHandler as createAgnosticHonoHandler } from "@better-agnostic/handler-hono";
import type { FlagEngine } from "@better-flag/core";
import type { EvaluationContext } from "@better-flag/types";
import type { Context } from "hono";

export interface CreateHonoHandlerOptions {
  basePath?: string;
  /** Returns evaluation context (userId, attributes) from the request. Use session, JWT, etc. */
  getContext?: (c: Context) => Promise<EvaluationContext | null> | EvaluationContext | null;
  /** If true, return 401 when getContext returns null for protected routes */
  requireAuth?: boolean;
}

export function createHonoHandler(engine: FlagEngine, options?: CreateHonoHandlerOptions) {
  const getContext = options?.getContext;
  return createAgnosticHonoHandler(engine, {
    basePath: options?.basePath,
    getAuthContext: getContext
      ? async (c) => {
          const ctx = await Promise.resolve(getContext(c));
          return ctx ?? null;
        }
      : undefined,
    requireAuth: options?.requireAuth,
  });
}
