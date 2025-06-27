/// <reference types="bun" />

import alchemy from "alchemy";
import { D1Database, Worker } from "alchemy/cloudflare";

const app = await alchemy("simple-presence", {
	password: process.env.SECRET_PASSPHRASE,
});

const db = await D1Database("simple-presence-db");

export const server = await Worker("simple-presence-server", {
	entrypoint: "./src/index.ts",
	dev: {
		port: 3000,
	},
	bindings: {
		DB: db,
		CORS_ORIGIN: process.env.CORS_ORIGIN!,
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
		BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET),
	},
});

console.log({
	dbId: db.id,
	serverUrl: server.url,
});

await app.finalize();
