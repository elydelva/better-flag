import { describe, expect, test } from "bun:test";
import { hashToPercentage } from "./hash.js";

describe("hashToPercentage", () => {
  test("returns deterministic value for same inputs", () => {
    const a = hashToPercentage("user1", "flag-x", "salt");
    const b = hashToPercentage("user1", "flag-x", "salt");
    expect(a).toBe(b);
  });

  test("returns different values for different userId", () => {
    const a = hashToPercentage("user1", "flag-x", "salt");
    const b = hashToPercentage("user2", "flag-x", "salt");
    expect(a).not.toBe(b);
  });

  test("returns different values for different flagKey", () => {
    const a = hashToPercentage("user1", "flag-a", "salt");
    const b = hashToPercentage("user1", "flag-b", "salt");
    expect(a).not.toBe(b);
  });

  test("returns different values for different salt", () => {
    const a = hashToPercentage("user1", "flag-x", "salt1");
    const b = hashToPercentage("user1", "flag-x", "salt2");
    expect(a).not.toBe(b);
  });

  test("returns value in 0–100 range", () => {
    for (let i = 0; i < 20; i++) {
      const pct = hashToPercentage(`user${i}`, `flag${i}`, `salt${i}`);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  test("handles empty strings", () => {
    const pct = hashToPercentage("", "", "");
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });
});
