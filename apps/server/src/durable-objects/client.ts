import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/websocket";
import type { RouterClient } from "@orpc/server";
import type { router } from "./presence";

const websocket = new WebSocket("ws://localhost:3000/teste");

const link = new RPCLink({
	websocket,
});

const client: RouterClient<typeof router> = createORPCClient(link);

const sessionId = Math.random().toString(36).substring(2, 15);

setInterval(async () => {
	console.log("Updating");
	await client.update({
		sessionId,
		page: "test",
		status: "online",
	});
}, 1000);

const abortController = new AbortController();
const result = await client.on(
	{ page: "test" },
	{ signal: abortController.signal },
);

setTimeout(async () => {
	console.log("Closing");
	abortController.abort();
}, 5000);

for await (const payload of result) {
	console.log("Received message:", payload);
}
