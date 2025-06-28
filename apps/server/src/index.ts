import { app } from "./app";

app.get("/", (c) => c.text("OK"));

app.post("/presence", async (c) => {
	const appKey = c.req.header("X-App-Key");
	const json = await c.req.json();

	console.log({ appKey, json });

	return c.json({
		message: "OK",
	});
});

export default app;
