import { env } from "cloudflare:workers";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { createContext } from "@/lib/context";
import { appRouter } from "@/routers/index";
import { db, SCHEMAS } from "./db";

export const api = new Hono();

api.use(logger());
api.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-App-Key"],
    credentials: true,
  }),
);

api.get("/health", (c) => c.text("OK"));

api.on(["POST", "GET"], "/auth/**", (c) => auth.handler(c.req.raw));

const handler = new RPCHandler(appRouter);
api.use("/rpc/**", async (c, next) => {
  const context = await createContext({ context: c });
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: "/api/rpc",
    context: context,
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }
  await next();
});

api.get("/presence/:appKey", async (c) => {
  const appKeyParam = c.req.param("appKey");
  const [appRecord] = await db
    .select({ publicKey: SCHEMAS.app.publicKey })
    .from(SCHEMAS.app)
    .where(eq(SCHEMAS.app.publicKey, appKeyParam))
    .limit(1);

  if (!appRecord) {
    return c.text("App not found", 404);
  }

  const id = env.PRESENCE.idFromName(appRecord.publicKey);
  const presenceApp = env.PRESENCE.get(id);
  return presenceApp.fetch(c.req.raw);
});
