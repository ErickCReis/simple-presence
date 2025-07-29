import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { app } from "./app";
import { db, SCHEMAS } from "./db";

app.get("/", (c) => c.text("OK"));

app.get("/presence/:appKey", async (c) => {
	const appKeyParam = c.req.param("appKey");
	const [app] = await db
		.select({ publicKey: SCHEMAS.app.publicKey })
		.from(SCHEMAS.app)
		.where(eq(SCHEMAS.app.publicKey, appKeyParam))
		.limit(1);

	if (!app) {
		return c.text("App not found", 404);
	}

	const id = env.PRESENCE.idFromName(app.publicKey);
	const presenceApp = env.PRESENCE.get(id);
	return presenceApp.fetch(c.req.raw);
});

export default app;
export { Presence } from "./durable-objects/presence";
