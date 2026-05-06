import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: [
    "**/node_modules",
    "**/dist",
    "**/.source",
    "**/.alchemy",
    "**/routeTree.gen.ts",
  ],
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
