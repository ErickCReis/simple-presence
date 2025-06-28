import { env } from "cloudflare:workers";
import { app } from "./app";

app.get("/", (c) => c.text("OK"));

app.post("/presence", async (c) => {
	const appKey = c.req.header("X-App-Key");
	if (!appKey) {
		return c.json({ message: "Unauthorized" }, 401);
	}

	const data = await c.req.json();

	const id = env.PRESENCE.idFromName(appKey);
	const presenceApp = env.PRESENCE.get(id);

	const count = await presenceApp.update(data);

	return c.json({ message: "OK", count });
});

export default app;
export { Presence } from "./durable-objects/presence";
