import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["production", "development", "test"]).default("development"),

    HOST: z.string().min(1).default("0.0.0.0"),
    PORT: z.coerce.number<number>().int().positive().min(1025).max(65535).default(8888),

    /** Value for the `Access-Control-Allow-Origin` response header. */
    CORS_ORIGIN: z.string().min(1).default("*"),
  },
  isServer: true,
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
});
