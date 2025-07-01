/** biome-ignore-all lint/style/noNonNullAssertion: ! */

import { readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

const db = readFileSync(
	".alchemy/simple-presence/erickreis/simple-presence-db.json",
	{ encoding: "utf8" },
);
const dbJson = JSON.parse(db);
const { id: databaseId, accountId } = dbJson.output;

export default defineConfig({
	schema: "./src/db/schema",
	dialect: "sqlite",
	driver: "d1-http",
	dbCredentials: {
		accountId: accountId,
		databaseId: databaseId,
		token: process.env.CLOUDFLARE_API_TOKEN!,
	},
});
