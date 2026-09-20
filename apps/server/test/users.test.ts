import type { RPCClient } from "@xqvvu/api/client";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import { createApiClient } from "./create-api-client";
import { createTestApp } from "./create-test-app";

describe("users", () => {
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

  it("starts with no users", async () => {
    await expect(client.users.list()).resolves.toEqual([]);
  });

  it("creates a user and lists it", async () => {
    const created = await client.users.create({ email: "a@example.com" });

    expect(created.email).toBe("a@example.com");
    expect(created.id).toBeTruthy();
    await expect(client.users.list()).resolves.toEqual([created]);
  });

  it("surfaces a duplicate email as the contract's typed CONFLICT, not a 500", async () => {
    await expect(client.users.create({ email: "a@example.com" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects an invalid email at the contract boundary", async () => {
    const response = await fetch(`${origin}/api/users/create`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });

    expect(response.status).toBe(400);
  });
});
