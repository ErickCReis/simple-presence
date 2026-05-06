import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import mdx from "fumadocs-mdx/vite";
import { defineConfig } from "vite";

export default defineConfig({
  preview: {
    host: "127.0.0.1",
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    mdx(await import("./source.config")),
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        prerender: {
          enabled: true,
          outputPath: "/index",
          retryCount: 3,
          retryDelay: 1000,
        },
      },
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        autoSubfolderIndex: true,
        crawlLinks: true,
        concurrency: 1,
        failOnError: true,
        filter: (page) =>
          page.path === "/" || page.path === "/docs" || page.path.startsWith("/docs/"),
        retryCount: 3,
        retryDelay: 1000,
      },
      pages: [{ path: "/" }, { path: "/docs" }],
    }),
    viteReact(),
  ],
});
