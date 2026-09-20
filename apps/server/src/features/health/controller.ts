import { Controller } from "@nestjs/common";
import { Implement } from "@orpc/nest";
import { contract } from "@xqvvu/api";

import { healthRouter } from "@/features/health/router";

@Controller()
export class HealthController {
  @Implement(contract.health)
  health() {
    return healthRouter;
  }
}
