import { createORPCClient } from "@orpc/client";
import { OpenAPILink } from "@orpc/openapi/fetch";
import { contract } from "@xqvvu/api";
import type { RPCClient } from "@xqvvu/api/client";

import { API_PREFIX } from "@/orpc/prefix";

/** Builds a contract-typed client against a running test server. */
export function createApiClient(origin: string): RPCClient {
  return createORPCClient(new OpenAPILink(contract, { origin, url: `/${API_PREFIX}` }));
}
