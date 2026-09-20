import { os } from "@/orpc/os";

export const healthRouter = os.health.router({
  check: os.health.check.handler(() => {
    return {
      status: "ok",
    };
  }),
});
