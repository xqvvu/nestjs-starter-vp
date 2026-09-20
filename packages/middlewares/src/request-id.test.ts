import { getRequestId, requestIdHandler, resolveRequestId } from "@xqvvu/middlewares";
import { describe, expect, it } from "vite-plus/test";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("resolveRequestId", () => {
  it("reuses a well-formed inbound id", () => {
    expect(resolveRequestId({ "x-request-id": "550e8400-e29b-41d4-a716-446655440000" })).toBe(
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("preserves W3C trace ids and traceparent values", () => {
    const traceId = "0af7651916cd43dd8448eb211c80319c";
    const traceparent = `00-${traceId}-b7ad6b7169203331-01`;

    expect(resolveRequestId({ "x-request-id": traceId })).toBe(traceId);
    expect(resolveRequestId({ "x-request-id": traceparent })).toBe(traceparent);
  });

  it("regenerates instead of echoing values that would corrupt logs or headers", () => {
    const hostile = [
      '"><script>alert(1)</script>',
      "a,b", // duplicate-header delimiter
      "a b",
      "a\tb",
      "a;b",
      "", // empty echoes as a blank header
      "a".repeat(129), // beyond the accepted length
      "a".repeat(8000), // log amplification
    ];

    for (const value of hostile) {
      const resolved = resolveRequestId({ "x-request-id": value });
      expect(resolved, `should not reuse ${JSON.stringify(value.slice(0, 24))}`).toMatch(
        UUID_PATTERN,
      );
    }
  });

  it("regenerates when the header is absent, repeated, or non-string", () => {
    expect(resolveRequestId({})).toMatch(UUID_PATTERN);
    expect(resolveRequestId({ "x-request-id": ["first", "second"] })).toMatch(UUID_PATTERN);
  });

  it("accepts exactly the length limit and rejects one character more", () => {
    const atLimit = "a".repeat(128);
    expect(resolveRequestId({ "x-request-id": atLimit })).toBe(atLimit);
    expect(resolveRequestId({ "x-request-id": `${atLimit}a` })).toMatch(UUID_PATTERN);
  });
});

describe("getRequestId", () => {
  it("is undefined outside a request scope", () => {
    expect(getRequestId()).toBeUndefined();
  });

  it("exposes the id to code running inside the handler scope", () => {
    const req = { headers: {}, requestId: undefined } as never;
    const res = { setHeader: () => {} } as never;
    let seenInsideScope: string | undefined;

    requestIdHandler(req, res, () => {
      seenInsideScope = getRequestId();
    });

    expect(seenInsideScope).toMatch(UUID_PATTERN);
    expect(getRequestId()).toBeUndefined();
  });
});
