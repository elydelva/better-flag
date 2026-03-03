import { BaseError } from "@better-agnostic/errors";

export abstract class FlagError extends BaseError {}

export class FlagNotFoundError extends FlagError {
  readonly code = "FLAG_NOT_FOUND";
  readonly statusCode = 404;
  readonly expose = true;

  constructor(flagKey: string) {
    super(`Flag not found: ${flagKey}`);
  }
}

export class FlagValidationError extends FlagError {
  readonly code = "FLAG_VALIDATION_ERROR";
  readonly statusCode = 400;
  readonly expose = true;

  constructor(message: string, options?: { metadata?: Record<string, unknown> }) {
    super(message, { metadata: options?.metadata });
  }
}

export class FlagEvaluationError extends FlagError {
  readonly code = "FLAG_EVALUATION_ERROR";
  readonly statusCode = 500;
  readonly expose = false;

  constructor(message: string, options?: { metadata?: Record<string, unknown> }) {
    super(message, { metadata: options?.metadata });
  }
}

export class FlagRateLimitError extends FlagError {
  readonly code = "RATE_LIMIT";
  readonly statusCode = 429;
  readonly expose = true;

  constructor(retryAfterSeconds?: number) {
    super("Rate limit exceeded", {
      expose: true,
      retryAfter: retryAfterSeconds,
    });
  }
}
