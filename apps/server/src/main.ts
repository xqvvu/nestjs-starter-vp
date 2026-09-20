import { createApp } from "@/app";
import { env } from "@/env";

const app = await createApp();

await app.listen(env.PORT, env.HOST);
