import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

import { getRequestContextValue, runWithRequestContext } from "./request-context";

declare module "./request-context" {
  interface RequestStore {
    /** Id echoed in the `x-request-id` response header. */
    requestId: string;
  }
}

/**
 * Accepted shape for an inbound id, kept deliberately narrow.
 *
 * Covers the values real callers send — UUIDs, W3C trace ids (32 hex chars), and
 * `traceparent` strings — while rejecting anything that could corrupt a header,
 * a log line, or a downstream parser. OWASP's logging guidance requires
 * sanitizing event data against delimiter characters, not just CR/LF.
 */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:+-]{1,128}$/;

/**
 * Returns the inbound id when it is safe to reuse, otherwise a fresh UUID.
 *
 * Rejects oversized values (log/header amplification), non-string and duplicate
 * headers (which arrive as arrays), and any value outside {@link REQUEST_ID_PATTERN}.
 * Regenerating rather than erroring keeps a malformed header from failing a request.
 */
export function resolveRequestId(headers: IncomingMessage["headers"]): string {
  const inbound = headers["x-request-id"];
  if (typeof inbound === "string" && REQUEST_ID_PATTERN.test(inbound)) return inbound;

  return crypto.randomUUID();
}

/**
 * Assigns a request id to the request scope and echoes it in the `x-request-id`
 * response header.
 *
 * Register it with `app.use(handler)`, not `NestModule.configure()`: a global
 * prefix scopes `configure()` middleware to the prefixed paths, while `app.use()`
 * stays prefix-independent and still covers unmatched requests.
 *
 * Idempotent: a nested registration reuses the ambient id instead of generating a
 * second one, so the header and the scope never disagree.
 */
export function requestIdHandler(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): void {
  const requestId = (getRequestId() as string | undefined) ?? resolveRequestId(req.headers);
  res.setHeader("x-request-id", requestId);

  runWithRequestContext({ requestId }, () => next());
}

/**
 * Reads the current request's id.
 *
 * Returns `undefined` outside a request scope (startup, cron, tests), so callers
 * use `?? fallback` where an id is genuinely optional.
 */
export function getRequestId(): string {
  return getRequestContextValue("requestId")!;
}
