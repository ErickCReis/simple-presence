/** biome-ignore-all lint/style/noNonNullAssertion: ! */

import { readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

const accountId = readFileSync(".alchemy/account-id.txt", { encoding: "utf8" });

const db = readFileSync(
	".alchemy/simple-presence/erickreis/simple-presence-db.json",
	{ encoding: "utf8" },
);
const dbJson = JSON.parse(db);

export default defineConfig({
	schema: "./src/db/schema",
	dialect: "sqlite",
	driver: "d1-http",
	dbCredentials: {
		accountId: accountId,
		databaseId: dbJson.output.id,
		token: process.env.CLOUDFLARE_API_TOKEN!,
	},
});
