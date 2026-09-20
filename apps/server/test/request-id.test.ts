import { getRequestId, resolveRequestId } from "@xqvvu/middlewares";
import { describe, expect, it } from "vite-plus/test";

import { createTestApp } from "./create-test-app";

describe("request id", () => {
  it("echoes a safe inbound id and exposes it to the handler", async () => {
    const app = await createTestApp();
    try {
      const inbound = "550e8400-e29b-41d4-a716-446655440000";
      const response = await fetch(`${app.origin}/api/health/check`, {
        headers: { "x-request-id": inbound },
      });

      expect(response.headers.get("x-request-id")).toBe(inbound);
    } finally {
      await app.close();
    }
  });

  it("replaces a hostile inbound id rather than echoing it", async () => {
    const app = await createTestApp();
    try {
      const hostile = '"><script>alert(1)</script>';
      const response = await fetch(`${app.origin}/api/health/check`, {
        headers: { "x-request-id": hostile },
      });

      const echoed = response.headers.get("x-request-id");
      expect(echoed).not.toBe(hostile);
      expect(echoed).toMatch(/^[0-9a-f-]{36}$/);
    } finally {
      await app.close();
    }
  });

  it("bounds the echoed header even for an oversized inbound id", async () => {
    const app = await createTestApp();
    try {
      const response = await fetch(`${app.origin}/api/health/check`, {
        headers: { "x-request-id": "a".repeat(8000) },
      });

      expect(response.headers.get("x-request-id")).toHaveLength(36);
    } finally {
      await app.close();
    }
  });

  it("covers unmatched routes, where no procedure runs", async () => {
    const app = await createTestApp();
    try {
      const response = await fetch(`${app.origin}/no-such-route`);

      expect(response.status).toBe(404);
      expect(response.headers.get("x-request-id")).toBeTruthy();
    } finally {
      await app.close();
    }
  });

  it("does not leak request scope across requests", async () => {
    const app = await createTestApp();
    try {
      const first = await fetch(`${app.origin}/api/health/check`);
      const second = await fetch(`${app.origin}/api/health/check`);

      expect(first.headers.get("x-request-id")).not.toBe(second.headers.get("x-request-id"));
      expect(getRequestId()).toBeUndefined();
    } finally {
      await app.close();
    }
  });
});

describe("resolveRequestId", () => {
  it("is pure, so the same headers resolve identically", () => {
    const headers = { "x-request-id": "trace-1" };
    expect(resolveRequestId(headers)).toBe(resolveRequestId(headers));
  });
});
