import { Module } from "@nestjs/common";
import { ORPCModule } from "@orpc/nest";

import { HealthController } from "@/features/health/controller";
import { SpecsController } from "@/features/specs.controller";
import { UsersModule } from "@/features/users/users.module";
import { createInitialContext } from "@/orpc/context";

@Module({
  imports: [ORPCModule.forRoot({ context: createInitialContext }), UsersModule],
  controllers: [SpecsController, HealthController],
})
export class AppModule {}
