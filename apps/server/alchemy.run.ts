import alchemy from "alchemy";
import { Assets, D1Database, DurableObjectNamespace, Worker } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";
import type { Presence } from "./src/durable-objects/presence";

const isProd = process.argv.at(-2) === "--stage" && process.argv.at(-1) === "prod";

const app = await alchemy("simple-presence", {
  stateStore: isProd ? (scope) => new CloudflareStateStore(scope) : undefined,
  password: process.env.ALCHEMY_SECRET_PASSPHRASE,
});

const web = await Assets({ path: "../web/dist/client" });

const presence = DurableObjectNamespace<Presence>("presence", {
  className: "Presence",
  sqlite: true,
});

export const db = await D1Database("db", { adopt: true });

export const server = await Worker("server", {
  entrypoint: "./src/index.ts",
  compatibility: "node",
  dev: {
    port: 3000,
  },
  domains: isProd ? ["simple-presence.erickr.dev"] : undefined,
  adopt: true,
  bundle: { loader: { ".sql": "text" } },
  assets: {
    _headers: "/*\n  Cache-Control: public, max-age=2592000",
    run_worker_first: ["/api/**"],
    not_found_handling: "single-page-application",
  },
  bindings: {
    ASSETS: web,
    DB: db,
    PRESENCE: presence,
    CORS_ORIGIN: isProd ? "https://simple-presence.erickr.dev" : process.env.CORS_ORIGIN!,
    BETTER_AUTH_URL: isProd
      ? "https://simple-presence.erickr.dev/api/auth"
      : process.env.BETTER_AUTH_URL!,
    BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET),
  },
});

console.log({
  dbId: db.id,
  serverUrl: server.url,
});

await app.finalize();
