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
	on: procedure.input(z.object({ page: z.string() })).handler(async function* ({
		input,
		signal,
	}) {
		for await (const count of publisher.subscribe(input.page, { signal })) {
			yield count;
		}
	}),
	update: procedure
		.input(
			z.object({
				page: z.string(),
				status: z.enum(["online", "away", "offline"]),
			}),
		)
		.handler(async ({ context, input }) => {
			const count = await context.do.update(context.ws, input);
			publisher.publish(input.page, count);
		}),
};

export type PresenceRouter = typeof router;

export type PresenceRouterClient = RouterClient<PresenceRouter>;

const handler = new RPCHandler(router);

interface PageCount {
	page: string;
	count: number;
	sessions: Set<WebSocket>;
}

export class Presence extends DurableObject<Env> {
	state: DurableObjectState;

	// Local maps for session management using WebSocket as key
	sessions: Map<WebSocket, PresenceData> = new Map();
	pages: Map<string, PageCount> = new Map();

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
		await handler.message(ws, message, {
			context: { ws, do: this },
		});
	}

	async webSocketClose(ws: WebSocket) {
		handler.close(ws);
		// Clean up session when WebSocket closes
		this.removeSession(ws);
	}

	async update(ws: WebSocket, presence: PresenceData): Promise<number> {
		const { page, status } = presence;

		// Handle different status scenarios
		if (status === "offline" || status === "away") {
			// Remove session
			this.removeSession(ws);
		} else if (status === "online") {
			// Remove session from current page if it exists
			this.removeSession(ws);

			// Add session to the new page
			this.addSession(ws, page, status);
		}

		// Return the count for the specified page
		const pageCount = this.pages.get(page);
		return pageCount ? pageCount.count : 0;
	}

	private removeSession(ws: WebSocket): void {
		const sessionInfo = this.sessions.get(ws);
		if (!sessionInfo) return;

		// Remove from sessions map
		this.sessions.delete(ws);

		// Remove from page
		const pageCount = this.pages.get(sessionInfo.page);
		if (pageCount) {
			pageCount.sessions.delete(ws);
			pageCount.count = pageCount.sessions.size;

			// Remove page if no sessions left
			if (pageCount.count === 0) {
				this.pages.delete(sessionInfo.page);
			}
		}
	}

	private addSession(
		ws: WebSocket,
		page: string,
		status: "online" | "away" | "offline",
	): void {
		// Update session info
		this.sessions.set(ws, { page, status });

		// Get or create page count
		let pageCount = this.pages.get(page);
		if (!pageCount) {
			pageCount = { page, count: 0, sessions: new Set() };
			this.pages.set(page, pageCount);
		}

		// Add session to page
		pageCount.sessions.add(ws);
		pageCount.count = pageCount.sessions.size;
	}
}
