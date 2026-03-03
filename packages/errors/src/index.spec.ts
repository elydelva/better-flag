import { describe, expect, test } from "bun:test";
import { isBaseError, toJsonPayload } from "@better-agnostic/errors";
import {
  FlagEvaluationError,
  FlagNotFoundError,
  FlagRateLimitError,
  FlagValidationError,
} from "./index.js";

describe("error classes", () => {
  test("FlagNotFoundError has code FLAG_NOT_FOUND and statusCode 404", () => {
    const err = new FlagNotFoundError("my-flag");
    expect(err.code).toBe("FLAG_NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err.expose).toBe(true);
    expect(err.message).toContain("my-flag");
  });

  test("FlagValidationError has code FLAG_VALIDATION_ERROR and statusCode 400", () => {
    const err = new FlagValidationError("Invalid input");
    expect(err.code).toBe("FLAG_VALIDATION_ERROR");
    expect(err.statusCode).toBe(400);
    expect(err.expose).toBe(true);
  });

  test("FlagValidationError accepts metadata", () => {
    const err = new FlagValidationError("Invalid", { metadata: { issues: [] } });
    expect(err.metadata).toEqual({ issues: [] });
  });

  test("FlagEvaluationError has code FLAG_EVALUATION_ERROR and statusCode 500", () => {
    const err = new FlagEvaluationError("Evaluation failed");
    expect(err.code).toBe("FLAG_EVALUATION_ERROR");
    expect(err.statusCode).toBe(500);
    expect(err.expose).toBe(false);
  });

  test("FlagRateLimitError has code RATE_LIMIT and statusCode 429", () => {
    const err = new FlagRateLimitError();
    expect(err.code).toBe("RATE_LIMIT");
    expect(err.statusCode).toBe(429);
    expect(err.expose).toBe(true);
  });

  test("FlagRateLimitError accepts retryAfterSeconds", () => {
    const err = new FlagRateLimitError(60);
    expect(err.retryAfter).toBe(60);
  });

  test("each error is recognized by isBaseError", () => {
    const errors = [
      new FlagNotFoundError("x"),
      new FlagValidationError("x"),
      new FlagEvaluationError("x"),
      new FlagRateLimitError(),
    ];
    for (const err of errors) {
      expect(isBaseError(err)).toBe(true);
    }
  });
});

describe("toJsonPayload", () => {
  test("returns code and message for FlagNotFoundError", () => {
    const err = new FlagNotFoundError("f1");
    const payload = toJsonPayload(err);
    expect(payload.code).toBe("FLAG_NOT_FOUND");
    expect(payload.message).toContain("f1");
  });

  test("includes retryAfter for FlagRateLimitError when set", () => {
    const err = new FlagRateLimitError(30);
    const payload = toJsonPayload(err);
    expect(payload.retryAfter).toBe(30);
  });
});
