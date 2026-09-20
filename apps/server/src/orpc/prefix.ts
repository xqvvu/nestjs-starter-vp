/** Public API namespace, applied once via `setGlobalPrefix` so controllers stay prefix-free. */
export const API_PREFIX = "api";

/**
 * Routes served outside the API namespace. The contract's `servers` entry in
 * `src/lib/openapi.ts` must keep pointing at `API_PREFIX`.
 */
export const API_PREFIX_EXCLUDES = ["specs", "specs.json"];
