import { describe, expect, test } from "bun:test";
import { flagToRow, rowToFlag } from "./mapper.js";
import type { Flag, FlagRow } from "./mapper.js";

describe("flagToRow", () => {
  test("maps flag to row with all fields", () => {
    const flag: Flag = {
      key: "f1",
      type: "boolean",
      defaultValue: true,
      enabled: true,
      description: "A flag",
      rollout: { percentage: 50, seed: "x" },
      schedule: { start: "2024-01-01T00:00:00Z", end: "2024-12-31T23:59:59Z" },
    };
    const row = flagToRow(flag);
    expect(row.key).toBe("f1");
    expect(row.type).toBe("boolean");
    expect(row.defaultValue).toBe(true);
    expect(row.enabled).toBe(true);
    expect(row.description).toBe("A flag");
    expect(row.rolloutPercentage).toBe(50);
    expect(row.rolloutSalt).toBe("x");
    expect(row.enableAt).toEqual(new Date("2024-01-01T00:00:00Z"));
    expect(row.disableAt).toEqual(new Date("2024-12-31T23:59:59Z"));
  });

  test("defaults enabled to true when undefined", () => {
    const flag: Flag = {
      key: "f",
      type: "string",
      defaultValue: "x",
    };
    const row = flagToRow(flag);
    expect(row.enabled).toBe(true);
  });

  test("handles null rollout and schedule", () => {
    const flag: Flag = {
      key: "f",
      type: "number",
      defaultValue: 0,
    };
    const row = flagToRow(flag);
    expect(row.rolloutPercentage).toBeNull();
    expect(row.rolloutSalt).toBeNull();
    expect(row.enableAt).toBeNull();
    expect(row.disableAt).toBeNull();
  });
});

describe("rowToFlag", () => {
  test("maps row to flag with rollout and schedule", () => {
    const row: FlagRow = {
      key: "f1",
      type: "boolean",
      defaultValue: true,
      variants: null,
      enabled: true,
      rolloutPercentage: 75,
      rolloutSalt: "salt",
      enableAt: new Date("2024-01-01"),
      disableAt: new Date("2024-12-31"),
      description: "Desc",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const flag = rowToFlag(row);
    expect(flag.key).toBe("f1");
    expect(flag.type).toBe("boolean");
    expect(flag.defaultValue).toBe(true);
    expect(flag.enabled).toBe(true);
    expect(flag.description).toBe("Desc");
    expect(flag.rollout).toEqual({ percentage: 75, seed: "salt" });
    expect(flag.schedule?.start).toBeDefined();
    expect(flag.schedule?.end).toBeDefined();
  });

  test("handles null rollout and schedule", () => {
    const row: FlagRow = {
      key: "f",
      type: "string",
      defaultValue: "x",
      variants: null,
      enabled: false,
      rolloutPercentage: null,
      rolloutSalt: null,
      enableAt: null,
      disableAt: null,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const flag = rowToFlag(row);
    expect(flag.rollout).toBeUndefined();
    expect(flag.schedule).toBeUndefined();
    expect(flag.enabled).toBe(false);
  });

  test("round-trip preserves data", () => {
    const flag: Flag = {
      key: "roundtrip",
      type: "variant",
      defaultValue: "control",
      variants: [
        { key: "a", value: "control" },
        { key: "b", value: "treatment" },
      ],
      enabled: true,
    };
    const row = flagToRow(flag);
    const back = rowToFlag(row as FlagRow);
    expect(back.key).toBe(flag.key);
    expect(back.type).toBe(flag.type);
    expect(back.defaultValue).toBe(flag.defaultValue);
    expect(back.variants).toEqual(flag.variants);
  });
});
