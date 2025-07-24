/// <reference types="bun" />
/** biome-ignore-all lint/style/noNonNullAssertion: ! */

import alchemy from "alchemy";
import { D1Database, DurableObjectNamespace, Worker } from "alchemy/cloudflare";
import type { Presence } from "./src/durable-objects/presence";

const app = await alchemy("simple-presence", {
	password: process.env.SECRET_PASSPHRASE,
});

const presence = DurableObjectNamespace<Presence>("presence", {
	className: "Presence",
	sqlite: true,
});

const db = await D1Database("simple-presence-db");

export const server = await Worker("simple-presence-server", {
	entrypoint: "./src/index.ts",
	compatibility: "node",
	dev: {
		port: 3000,
	},
	bindings: {
		DB: db,
		PRESENCE: presence,
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
