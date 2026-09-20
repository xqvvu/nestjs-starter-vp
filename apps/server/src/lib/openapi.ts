import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import packageJson from "@package-json";
import { contract } from "@xqvvu/api";

import { API_PREFIX } from "@/orpc/prefix";

const openAPIGenerator = new OpenAPIGenerator({
  converters: [new ZodToJsonSchemaConverter()],
});

export function generateOpenAPISpec() {
  return openAPIGenerator.generate(contract, {
    base: {
      info: {
        title: "NestJS Starter",
        version: packageJson.version,
      },
      servers: [{ url: `/${API_PREFIX}` }],
    },
  });
}

export const scalarDocument = `<!doctype html>
<html>
  <head>
    <title>NestJS Starter</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="https://orpc.dev/icon.svg" />
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      Scalar.createApiReference('#app', {
        url: '/specs.json',
        telemetry: false,
        agent: { disabled: true },
        mcp: { disabled: true },
      })
    </script>
  </body>
</html>
`;
