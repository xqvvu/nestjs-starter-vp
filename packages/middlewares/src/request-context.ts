import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Request-scoped values, keyed by name.
 *
 * Extend this interface with module augmentation from wherever a value is
 * produced, so each concern owns its own key and its own docs:
 *
 * ```ts
 * declare module "@xqvvu/middlewares" {
 *   interface RequestStore {
 *     tenantId: string;
 *   }
 * }
 * ```
 *
 * One store serves every concern; do not create a second `AsyncLocalStorage`
 * per value.
 */
export interface RequestStore {}

const als = new AsyncLocalStorage<Partial<RequestStore>>();

/**
 * Runs `callback` inside a request scope that includes `values`.
 *
 * Merges into any surrounding scope, so a second registrant adds to the context
 * rather than replacing it. Values from the outer scope win when they already
 * exist, keeping a value stable once resolved.
 */
export function runWithRequestContext<T>(values: Partial<RequestStore>, callback: () => T): T {
  const current = als.getStore();
  return als.run({ ...values, ...current }, callback);
}

/**
 * Reads a request-scoped value.
 *
 * Returns `undefined` outside a request scope (startup, cron, tests) rather than
 * throwing, so callers choose the fallback.
 */
export function getRequestContextValue<K extends keyof RequestStore>(
  key: K,
): RequestStore[K] | undefined {
  return als.getStore()?.[key];
}
