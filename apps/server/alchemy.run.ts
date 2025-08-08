/// <reference types="bun" />
/** biome-ignore-all lint/style/noNonNullAssertion: ! */

import alchemy from "alchemy";
import {
	AccountId,
	D1Database,
	DurableObjectNamespace,
	Worker,
} from "alchemy/cloudflare";
import { StaticTextFile } from "alchemy/fs";
import type { Presence } from "./src/durable-objects/presence";

const app = await alchemy("simple-presence", {
	password: process.env.SECRET_PASSPHRASE,
});

const accountId = await AccountId();

await StaticTextFile("account-id", ".alchemy/account-id.txt", accountId);

const presence = DurableObjectNamespace<Presence>("presence", {
	className: "Presence",
	sqlite: true,
});

const db = await D1Database("simple-presence-db", { adopt: true });

export const server = await Worker("simple-presence-server", {
	entrypoint: "./src/index.ts",
	compatibility: "node",
	dev: {
		port: 3000,
	},
	adopt: true,
	bundle: { loader: { ".sql": "text" } },
	bindings: {
		DB: db,
		PRESENCE: presence,
		CORS_ORIGIN: process.env.CORS_ORIGIN!,
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
		BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET),
	},
});

console.log({
	accountId,
	dbId: db.id,
	serverUrl: server.url,
});

await app.finalize();
