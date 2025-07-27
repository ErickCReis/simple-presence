import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/websocket";
import type { PresenceRouterClient } from "./presence";

const websocket = new WebSocket("ws://localhost:3000/presence");

const link = new RPCLink({
	websocket,
});

const client: PresenceRouterClient = createORPCClient(link);

setInterval(async () => {
	console.log("Updating");
	await client.update({
		page: "test",
		status: "online",
	});
}, 1000);

const result = await client.on({ page: "test" });

let close = false;
setTimeout(async () => {
	console.log("Closing");
	close = true;
}, 5000);

for await (const payload of result) {
	console.log("Received message:", payload);

	if (close) {
		await result.return?.();
		break;
	}
}
