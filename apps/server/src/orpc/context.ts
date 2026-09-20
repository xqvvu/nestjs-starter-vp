import { type DefaultInitialContext } from "@orpc/server";
import { getRequestId } from "@xqvvu/middlewares";

declare module "@orpc/server" {
  interface DefaultInitialContext {
    /** Id assigned by `requestIdHandler`, echoed in the `x-request-id` response header. */
    requestId: string;
  }
}

/**
 * Builds the oRPC initial context.
 *
 * Reads the id from the `AsyncLocalStorage` scope entered by `requestIdHandler`,
 * which works regardless of which request object a layer hands us — `@orpc/nest`
 * passes the Fastify wrapper while `app.use()` sees the raw `IncomingMessage`.
 * Verified to propagate across that boundary.
 *
 * Falls back to a stable placeholder so the contract's `string` type holds for
 * the rare request that reached oRPC outside the middleware scope.
 */
export function createInitialContext(): DefaultInitialContext {
  return { requestId: getRequestId() };
}
