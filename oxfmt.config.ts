import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: [
    "**/node_modules",
    "**/dist",
    "**/.alchemy",
    "**/routeTree.gen.ts",
    "**/db/migrations/meta/**/*",
  ],
});
