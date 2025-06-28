import { readdirSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "drizzle-kit";

const alchemyD1Path = "./.alchemy/miniflare/d1/miniflare-D1DatabaseObject";
const files = readdirSync(alchemyD1Path);
const dbPath = files.find((file) => file.endsWith(".sqlite"));

if (!dbPath) {
	throw new Error("No database file found");
}

export default defineConfig({
	schema: "./src/db/schema",
	dialect: "sqlite",
	dbCredentials: {
		url: join(alchemyD1Path, dbPath),
	},
});
