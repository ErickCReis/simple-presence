import { defineConfig } from "tsdown";

export default defineConfig({
  platform: "browser",
  deps: {
    onlyBundle: false,
  },
  dts: {
    eager: true,
  },
});
