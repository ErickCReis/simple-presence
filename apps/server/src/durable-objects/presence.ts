import { DurableObject } from "cloudflare:workers";
import { EventPublisher, os, type RouterClient } from "@orpc/server";
import { RPCHandler } from "@orpc/server/websocket";
import type { PresenceData } from "@simple-presence/core";
import z from "zod/v3";

const publisher = new EventPublisher<Record<string, number>>();

const procedure = os.$context<{
	ws: WebSocket;
	do: Presence;
}>();

export const router = {
	on: procedure.input(z.object({ tag: z.string() })).handler(async function* ({
		input,
		signal,
	}) {
		for await (const count of publisher.subscribe(input.tag, { signal })) {
			yield count;
		}
	}),
	update: procedure
		.input(
			z.object({
				tag: z.string(),
				status: z.enum(["online", "away"]),
			}),
		)
		.handler(async ({ context, input }) => {
			const count = await context.do.update(context.ws, input);
			publisher.publish(input.tag, count);
		}),
};

export type PresenceRouter = typeof router;

export type PresenceRouterClient = RouterClient<PresenceRouter>;

const handler = new RPCHandler(router);

interface TagInfo {
	name: string;
	sessions: Set<WebSocket>;
}

export class Presence extends DurableObject<Env> {
	state: DurableObjectState;

	// Local maps for session management using WebSocket as key
	sessions: Map<WebSocket, PresenceData> = new Map();
	tags: Map<string, TagInfo> = new Map();

	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
		this.state = state;
	}

	fetch() {
		const { "0": client, "1": server } = new WebSocketPair();

		this.state.acceptWebSocket(server);

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		await handler.message(ws, message, { context: { ws, do: this } });
	}

	async webSocketClose(ws: WebSocket) {
		handler.close(ws);
		this.removeSession(ws);
	}

	async update(ws: WebSocket, presence: PresenceData) {
		this.removeSession(ws);
		if (presence.status === "online") {
			this.addSession(ws, presence);
		}

		const tagInfo = this.tags.get(presence.tag);
		return tagInfo ? tagInfo.sessions.size : 0;
	}

	private removeSession(ws: WebSocket) {
		const sessionInfo = this.sessions.get(ws);
		if (!sessionInfo) return;

		this.sessions.delete(ws);

		const tagInfo = this.tags.get(sessionInfo.tag);
		if (tagInfo) {
			tagInfo.sessions.delete(ws);

			// Remove tag if no sessions left
			if (tagInfo.sessions.size === 0) {
				this.tags.delete(sessionInfo.tag);
			}
		}
	}

	private addSession(ws: WebSocket, presence: PresenceData) {
		// Update session info
		this.sessions.set(ws, presence);

		// Get or create tag info
		let tagInfo = this.tags.get(presence.tag);
		if (!tagInfo) {
			tagInfo = { name: presence.tag, sessions: new Set() };
			this.tags.set(presence.tag, tagInfo);
		}

		// Add session to tag
		tagInfo.sessions.add(ws);
	}
}
