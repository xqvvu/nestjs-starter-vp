import type { RPCClient } from "@xqvvu/api/client";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import { createApiClient } from "./create-api-client";
import { createTestApp } from "./create-test-app";

let origin: string;
let close: () => Promise<void>;
let client: RPCClient;

beforeAll(async () => {
  const app = await createTestApp();
  origin = app.origin;
  close = app.close;
  client = createApiClient(origin);
});

afterAll(async () => {
  await close();
});

describe("health", () => {
  it("serves the health procedure through the contract", async () => {
    await expect(client.health.check()).resolves.toEqual({ status: "ok" });
  });

  it("echoes the request id onto unmatched routes outside the API prefix", async () => {
    const response = await fetch(`${origin}/no-such-route`);

    expect(response.status).toBe(404);
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("serves the OpenAPI document generated from the contract", async () => {
    const response = await fetch(`${origin}/specs.json`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      paths: expect.objectContaining({ "/health/check": expect.anything() }),
    });
  });
});
