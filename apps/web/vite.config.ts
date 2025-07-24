import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react-oxc";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		tailwindcss(),
		tanstackStart({
			prerender: {
				enabled: true,
				crawlLinks: true,
			},
			customViteReactPlugin: true,
		}),
		viteReact(),
	],
});
