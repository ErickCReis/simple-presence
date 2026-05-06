import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: [
    "**/node_modules",
    "**/dist",
    "**/.source",
    "**/.alchemy",
    "**/routeTree.gen.ts",
    "**/db/migrations/meta/**/*",
  ],
});
