import { describe, expect, test } from "bun:test";
import { createInMemoryFlagAdapter } from "@better-flag/adapter-memory";
import { betterFlag } from "@better-flag/core";
import { createExpressHandler } from "@better-flag/handler-express";
import express from "express";
import supertest from "supertest";

function createApp() {
  const adapter = createInMemoryFlagAdapter();
  const engine = betterFlag({
    adapter,
    plugins: [],
  });
  const handler = createExpressHandler(engine, {
    basePath: "/api",
    getContext: () => ({ userId: "e2e-user" }),
  });
  const app = express();
  app.use(express.json());
  app.use("/api", handler);
  return { app, adapter, engine };
}

describe("E2E Express", () => {
  test("GET /api/flags returns empty array when no flags", async () => {
    const { app } = createApp();
    const res = await supertest(app).get("/api/flags").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  test("POST /api/flags creates flag, GET returns it", async () => {
    const { app } = createApp();
    const created = await supertest(app)
      .post("/api/flags")
      .send({
        key: "feature-x",
        type: "boolean",
        defaultValue: true,
      })
      .expect(201);
    expect(created.body.key).toBe("feature-x");
    expect(created.body.type).toBe("boolean");

    const list = await supertest(app).get("/api/flags").expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].key).toBe("feature-x");

    const get = await supertest(app).get("/api/flags/feature-x").expect(200);
    expect(get.body.key).toBe("feature-x");
  });

  test("PATCH /api/flags/:key updates flag", async () => {
    const { app } = createApp();
    await supertest(app)
      .post("/api/flags")
      .send({ key: "f1", type: "boolean", defaultValue: true })
      .expect(201);

    const updated = await supertest(app)
      .patch("/api/flags/f1")
      .send({ enabled: false })
      .expect(200);
    expect(updated.body.enabled).toBe(false);
  });

  test("DELETE /api/flags/:key removes flag", async () => {
    const { app } = createApp();
    await supertest(app)
      .post("/api/flags")
      .send({ key: "to-delete", type: "boolean", defaultValue: true })
      .expect(201);

    await supertest(app).delete("/api/flags/to-delete").expect(200);

    await supertest(app).get("/api/flags/to-delete").expect(404);
  });

  test("POST /api/flags/evaluate returns evaluation result", async () => {
    const { app } = createApp();
    await supertest(app)
      .post("/api/flags")
      .send({ key: "eval-flag", type: "boolean", defaultValue: true })
      .expect(201);

    const res = await supertest(app)
      .post("/api/flags/evaluate")
      .send({ key: "eval-flag", context: { userId: "u1" } })
      .expect(200);
    expect(res.body).toHaveProperty("value");
    expect(res.body).toHaveProperty("reason");
    expect(typeof res.body.value).toBe("boolean");
  });

  test("GET /api/flags/:key returns 404 for missing flag", async () => {
    const { app } = createApp();
    const res = await supertest(app).get("/api/flags/nonexistent").expect(404);
    expect(res.body).toHaveProperty("code");
    expect(res.body.code).toBe("FLAG_NOT_FOUND");
  });

  test("POST /api/flags with invalid body returns 400", async () => {
    const { app } = createApp();
    await supertest(app)
      .post("/api/flags")
      .send({ key: "", type: "boolean", defaultValue: true })
      .expect(400);
  });

  test("GET /api/flags?limit=2 respects limit", async () => {
    const { app } = createApp();
    await supertest(app).post("/api/flags").send({ key: "a", type: "boolean", defaultValue: true });
    await supertest(app).post("/api/flags").send({ key: "b", type: "boolean", defaultValue: true });
    await supertest(app).post("/api/flags").send({ key: "c", type: "boolean", defaultValue: true });

    const res = await supertest(app).get("/api/flags?limit=2").expect(200);
    expect(res.body).toHaveLength(2);
  });
});
