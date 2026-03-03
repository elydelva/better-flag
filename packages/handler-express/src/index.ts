import { createExpressHandler as createAgnosticExpressHandler } from "@better-agnostic/handler-express";
import type { FlagEngine } from "@better-flag/core";
import type { EvaluationContext } from "@better-flag/types";
import type { Request, RequestHandler } from "express";

export interface CreateExpressHandlerOptions {
  basePath?: string;
  /** Returns evaluation context (userId, attributes) from the request. Use session, JWT, etc. */
  getContext?: (req: Request) => Promise<EvaluationContext | null> | EvaluationContext | null;
  /** If true, return 401 when getContext returns null for protected routes */
  requireAuth?: boolean;
}

export function createExpressHandler(
  engine: FlagEngine,
  options?: CreateExpressHandlerOptions
): RequestHandler {
  const getContext = options?.getContext;
  return createAgnosticExpressHandler(engine, {
    basePath: options?.basePath,
    getAuthContext: getContext
      ? async (req) => {
          const ctx = await Promise.resolve(getContext(req));
          return ctx ?? null;
        }
      : undefined,
    requireAuth: options?.requireAuth,
  });
}
