import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}", "test/**/*.{test,spec}.{ts,tsx}"],
    server: {
      deps: {
        // Workspace packages ship raw TypeScript. Node's native type stripping
        // rejects decorators, so these must be transformed by Vite instead of
        // being externalized to Node.
        inline: [/^@xqvvu\//],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html-spa"],
    },
  },

  pack: {
    entry: "src/main.ts",
    format: "esm",
    clean: true,
    minify: false,
    sourcemap: true,
    deps: { resolveDepSubpath: true, alwaysBundle: [/^@xqvvu\//] },
  },

  run: {
    tasks: {
      build: {
        command: "vp pack",
        dependsOn: [{ task: "typecheck", from: ["dependencies", "devDependencies"] }],
      },

      typecheck: {
        command: "tsc --noEmit",
      },

      test: {
        command: "vp test run",
      },

      "pack:watch": {
        command: "vp pack --watch",
        cache: false,
      },

      start: {
        command: "node --enable-source-maps --env-file-if-exists=.env dist/main.mjs",
        cache: false,
      },

      "start:watch": {
        command: "node --watch --enable-source-maps --env-file-if-exists=.env dist/main.mjs",
        cache: false,
      },

      dev: {
        command: 'echo "dev tasks started"',
        cache: false,
        dependsOn: ["pack:watch", "start:watch"],
      },
    },
  },
});
