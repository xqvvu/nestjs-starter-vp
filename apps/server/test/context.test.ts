import { getRequestId, requestIdHandler } from "@xqvvu/middlewares";
import { describe, expect, it } from "vite-plus/test";

import { createInitialContext } from "@/orpc/context";

describe("createInitialContext", () => {
  it("reads the id resolved by requestIdHandler, so the oRPC context matches the response header", () => {
    const inbound = "550e8400-e29b-41d4-a716-446655440000";
    const req = { headers: { "x-request-id": inbound } } as never;
    const headers: Record<string, string> = {};
    const res = { setHeader: (k: string, v: string) => void (headers[k] = v) } as never;

    let requestId: string | undefined;
    requestIdHandler(req, res, () => {
      requestId = createInitialContext().requestId;
    });

    expect(requestId).toBe(inbound);
    expect(headers["x-request-id"]).toBe(inbound);
  });

  it("reads no request scope outside a request", () => {
    expect(getRequestId()).toBeUndefined();
  });
});
