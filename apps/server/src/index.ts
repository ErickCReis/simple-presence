import { env } from "cloudflare:workers";
import { app } from "./app";

app.get("/", (c) => c.text("OK"));

app.get("/presence/:appKey", async (c) => {
	const appKey = c.req.param("appKey");
	const id = env.PRESENCE.idFromName(appKey);
	const presenceApp = env.PRESENCE.get(id);
	return presenceApp.fetch(c.req.raw);
});

export default app;
export { Presence } from "./durable-objects/presence";
