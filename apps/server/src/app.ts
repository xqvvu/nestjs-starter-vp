import { type INestApplication, type NestApplicationOptions } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { type NestFastifyApplication, FastifyAdapter } from "@nestjs/platform-fastify";
import { requestIdHandler } from "@xqvvu/middlewares";

import { AppModule } from "@/app.module";
import { env } from "@/env";
import { API_PREFIX, API_PREFIX_EXCLUDES } from "@/orpc/prefix";

/**
 * Creates the application and applies every cross-cutting concern.
 *
 * Kept in one place so tests exercise the same wiring as production. Anything
 * added to the bootstrap flow belongs here, not in `main.ts`.
 */
export async function createApp(options: NestApplicationOptions = {}) {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bodyParser: false,
    ...options,
  });

  // Controllers stay prefix-free; the public API namespace is applied once here.
  // This also scopes `NestModule.configure()` middleware to the prefix, which is
  // why request id is registered with `app.use()` below instead.
  app.setGlobalPrefix(API_PREFIX, { exclude: API_PREFIX_EXCLUDES });

  app.use(requestIdHandler);

  app.enableCors({
    origin: env.CORS_ORIGIN,
    exposedHeaders: ["x-request-id"],
  });

  // Let in-flight requests finish and lifecycle hooks run on SIGTERM/SIGINT.
  app.enableShutdownHooks();

  return app;
}

/** Closes an application created by {@link createApp}. */
export async function closeApp(app: INestApplication): Promise<void> {
  await app.close();
}
