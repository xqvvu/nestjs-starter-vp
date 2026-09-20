import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";

import { HealthCheckSchema } from "../schemas/health";

export const health = {
  check: oc.meta(openapi({ method: "GET" })).output(HealthCheckSchema),
};
