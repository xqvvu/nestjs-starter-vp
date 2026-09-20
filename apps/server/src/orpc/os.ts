import { implement } from "@orpc/server";
import { contract } from "@xqvvu/api";

/**
 * Shared implementer for the public contract.
 *
 * Every procedure MUST be built from this builder so that middleware, context, and
 * typed errors stay consistent across features. Features compose their handlers into
 * a router returned from a controller method decorated with `@Implement(<routerContract>)`.
 */
export const os = implement(contract);
