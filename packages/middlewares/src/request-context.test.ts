import {
  getRequestContextValue,
  getRequestId,
  requestIdHandler,
  runWithRequestContext,
} from "@xqvvu/middlewares";
import { describe, expect, it } from "vite-plus/test";

// A second concern, declared by the module that owns it — no second
// AsyncLocalStorage, no change to request-id.
declare module "@xqvvu/middlewares" {
  interface RequestStore {
    tenantId: string;
    locale: string;
  }
}

describe("request context store", () => {
  it("carries several concerns through one scope", () => {
    const req = { headers: {} } as never;
    const res = { setHeader: () => {} } as never;
    const seen: Record<string, unknown> = {};

    requestIdHandler(req, res, () => {
      runWithRequestContext({ tenantId: "t-1", locale: "en" }, () => {
        seen["requestId"] = getRequestId();
        seen["tenantId"] = getRequestContextValue("tenantId");
        seen["locale"] = getRequestContextValue("locale");
      });
    });

    expect(seen["requestId"]).toBeTruthy();
    expect(seen["tenantId"]).toBe("t-1");
    expect(seen["locale"]).toBe("en");
  });

  it("keeps an outer value stable when an inner scope omits it", () => {
    runWithRequestContext({ tenantId: "outer" }, () => {
      runWithRequestContext({ locale: "de" }, () => {
        expect(getRequestContextValue("tenantId")).toBe("outer");
        expect(getRequestContextValue("locale")).toBe("de");
      });
    });
  });

  it("does not leak values between sibling scopes", () => {
    let insideFirst: string | undefined;
    runWithRequestContext({ tenantId: "first" }, () => {
      insideFirst = getRequestContextValue("tenantId");
    });

    runWithRequestContext({ locale: "fr" }, () => {
      expect(getRequestContextValue("locale")).toBe("fr");
    });

    expect(insideFirst).toBe("first");
    expect(getRequestContextValue("tenantId")).toBeUndefined();
    expect(getRequestContextValue("locale")).toBeUndefined();
  });

  it("returns undefined for a declared key that was never set", () => {
    runWithRequestContext({}, () => {
      expect(getRequestContextValue("tenantId")).toBeUndefined();
    });
  });
});
