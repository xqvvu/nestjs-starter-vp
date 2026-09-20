import * as z from "zod";

export const HealthCheckSchema = z.object({
  status: z.literal("ok"),
});

/** Response body of the health check procedure. */
export type HealthCheckOutput = z.output<typeof HealthCheckSchema>;
