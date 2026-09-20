import { createApp } from "@/app";

/**
 * Boots the real application on an ephemeral port. Uses the same `createApp`
 * factory as production, so tests cannot drift from the real wiring.
 */
export async function createTestApp() {
  const app = await createApp({ logger: false });

  await app.listen(0, "127.0.0.1");

  const address = app.getHttpServer().address();
  if (address === null || typeof address === "string") {
    throw new Error("test server did not bind to a TCP address");
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => app.close(),
  };
}
