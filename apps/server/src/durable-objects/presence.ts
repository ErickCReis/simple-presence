import { DurableObject } from "cloudflare:workers";
import { EventPublisher, eventIterator, os } from "@orpc/server";

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
				sessionId: z.string(),
				page: z.string(),
				status: z.enum(["online", "away", "offline"]),
			}),
		)
		.handler(async ({ context, input }) => {
			const count = await context.do.update(input);
			publisher.publish(input.page, count);
		}),
};

const handler = new RPCHandler(router);

interface SessionInfo {
	sessionId: string;
	page: string;
	status: "online" | "away" | "offline";
	lastUpdate: number;
}

interface PageCount {
	page: string;
	count: number;
	sessions: Set<string>;
}

export class Presence extends DurableObject<Env> {
	state: DurableObjectState;

	// Local maps for session management
	sessions: Map<string, SessionInfo> = new Map();
	pages: Map<string, PageCount> = new Map();
	sessionTTLs: Map<string, number> = new Map();

	// TTL configuration
	readonly TTL_DURATION = 10_000; // 10 seconds in milliseconds

	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
		this.state = state;
	}

	fetch(request: Request): Response | Promise<Response> {
		const { "0": client, "1": server } = new WebSocketPair();

		this.state.acceptWebSocket(server);

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		console.log("message", message);
		await handler.message(ws, message, {
			context: {
				ws,
				do: this,
			},
		});
	}

	async webSocketClose(ws: WebSocket) {
		handler.close(ws);
	}

	async update(presence: PresenceData): Promise<number> {
		const { sessionId, page, status } = presence;
		const now = Date.now();

		// Update session TTL
		this.sessionTTLs.set(sessionId, now + this.TTL_DURATION);

		// Handle different status scenarios
		if (status === "offline" || status === "away") {
			// Remove session from all pages
			this.removeSessionFromAllPages(sessionId);

			// Remove session data
			this.sessions.delete(sessionId);
			this.sessionTTLs.delete(sessionId);
		} else if (status === "online") {
			// Remove session from all pages first
			this.removeSessionFromAllPages(sessionId);

			// Add session to the new page
			this.addSessionToPage(sessionId, page, status, now);
		}

		// Always check for expired sessions
		this.cleanupExpiredSessions();

		// use alarms to all cleanup after 10 seconds without requests
		const currentAlarm = await this.state.storage.getAlarm();
		if (currentAlarm) {
			await this.state.storage.deleteAlarm();
		}
		this.state.storage.setAlarm(Date.now() + this.TTL_DURATION * 2);

		// Return the count for the specified page
		const pageCount = this.pages.get(page);
		return pageCount ? pageCount.count : 0;
	}

	private removeSessionFromAllPages(sessionId: string): void {
		// Remove session from all pages
		for (const [pageKey, pageCount] of this.pages.entries()) {
			if (pageCount.sessions.has(sessionId)) {
				pageCount.sessions.delete(sessionId);
				pageCount.count = pageCount.sessions.size;

				// Remove page if no sessions left
				if (pageCount.count === 0) {
					this.pages.delete(pageKey);
				}
			}
		}
	}

	private addSessionToPage(
		sessionId: string,
		page: string,
		status: "online" | "away" | "offline",
		timestamp: number,
	): void {
		// Update or create session info
		this.sessions.set(sessionId, {
			sessionId,
			page,
			status,
			lastUpdate: timestamp,
		});

		// Get or create page count
		let pageCount = this.pages.get(page);
		if (!pageCount) {
			pageCount = {
				page,
				count: 0,
				sessions: new Set(),
			};
			this.pages.set(page, pageCount);
		}

		// Add session to page
		pageCount.sessions.add(sessionId);
		pageCount.count = pageCount.sessions.size;
	}

	private cleanupExpiredSessions(): void {
		const now = Date.now();
		const expiredSessions: string[] = [];

		// Find expired sessions
		for (const [sessionId, ttl] of this.sessionTTLs.entries()) {
			if (now > ttl) {
				expiredSessions.push(sessionId);
			}
		}

		// Remove expired sessions
		for (const sessionId of expiredSessions) {
			this.removeSessionFromAllPages(sessionId);
			this.sessions.delete(sessionId);
			this.sessionTTLs.delete(sessionId);
		}
	}

	// Method to get presence counts by page
	async getPresenceCounts(): Promise<Record<string, number>> {
		this.cleanupExpiredSessions();

		const counts: Record<string, number> = {};
		for (const [page, pageCount] of this.pages.entries()) {
			counts[page] = pageCount.count;
		}

		return counts;
	}

	// Method to get all active sessions
	async getActiveSessions(): Promise<SessionInfo[]> {
		this.cleanupExpiredSessions();

		return Array.from(this.sessions.values());
	}

	alarm(_?: AlarmInvocationInfo): void | Promise<void> {
		console.log("alarm");
		this.cleanupExpiredSessions();
	}
}
