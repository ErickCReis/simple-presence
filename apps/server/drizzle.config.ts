import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema",
	out: "./src/db/migrations",
	// DOCS: https://orm.drizzle.team/docs/guides/d1-http-with-drizzle-kit
	dialect: "sqlite",
	// driver: "d1-http",
	// dbCredentials: {
	// 	accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
	// 	databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
	// 	token: process.env.CLOUDFLARE_D1_TOKEN!,
	// },
	dbCredentials: {
		url: "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/f26dd3b4af2b86035a68fbb491403d4b54d63dee4c1e42d18d4ad58dc6978866.sqlite",
	},
});
