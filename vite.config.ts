import { defineConfig } from "vite-plus";

const ignorePatterns = ["**/route-tree.gen.ts", "**/node_modules", "**/dist", "**/*.md"];

export default defineConfig({
  run: {
    enablePrePostScripts: true,
    cache: {
      tasks: true,
    },
  },

  fmt: {
    ignorePatterns,

    printWidth: 100,
    sortImports: true,
    sortPackageJson: true,
  },

  lint: {
    ignorePatterns,

    options: {
      typeAware: true,
      typeCheck: true,
    },

    plugins: ["typescript", "eslint", "unicorn"],

    overrides: [
      {
        files: ["apps/server/**"],
        plugins: ["node", "vitest"],
        rules: {
          "typescript/consistent-type-imports": "off",
        },
      },
    ],
  },

  check: {
    fmt: true,
    lint: true,
  },

  staged: {
    "*.{js,jsx,ts,tsx,mjs,cjs}": ["vp check --fix"],
    "*.{json,css,yaml,yml}": ["vp fmt --write"],
  },
});
