import { DurableObject } from "cloudflare:workers";
import { RPCHandler } from "@orpc/server/websocket";
import type { PresenceData } from "@simple-presence/core";
import { desc } from "drizzle-orm";
import {
	type DrizzleSqliteDODatabase,
	drizzle,
} from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
// @ts-ignore
import migrations from "./db/migrations/migrations";
import { SCHEMAS } from "./db/schema";
import { router } from "./router";

const handler = new RPCHandler(router);

interface TagInfo {
	name: string;
	sessions: Set<WebSocket>;
}

export class Presence extends DurableObject<Env> {
	state: DurableObjectState;
	db: DrizzleSqliteDODatabase;

	// Local maps for session management using WebSocket as key
	sessions: Map<WebSocket, PresenceData> = new Map();
	tags: Map<string, TagInfo> = new Map();
	lastUpdated: number = Date.now();

	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
		this.state = state;
		this.db = drizzle(this.state.storage);

		this.state.blockConcurrencyWhile(async () => {
			await migrate(this.db, migrations);
		});
	}

	async fetch() {
		const { "0": client, "1": server } = new WebSocketPair();
		this.state.acceptWebSocket(server);

		await this.db.insert(SCHEMAS.presenceEvent).values({
			sessionId: "test",
			type: "connect",
		});

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
		await this.db.insert(SCHEMAS.presenceEvent).values({
			sessionId: "test",
			type: "update",
			tag: presence.tag,
			status: presence.status,
		});

		this.removeSession(ws);
		if (presence.status === "online") {
			this.addSession(ws, presence);
		}

		this.lastUpdated = Date.now();

		const tagInfo = this.tags.get(presence.tag);
		return tagInfo ? tagInfo.sessions.size : 0;
	}

	private removeSession(ws: WebSocket) {
		const sessionInfo = this.sessions.get(ws);
		if (!sessionInfo) return;

		this.sessions.delete(ws);

		const tagInfo = this.tags.get(sessionInfo.tag);
		tagInfo?.sessions.delete(ws);
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

	public getStats() {
		return {
			lastUpdated: this.lastUpdated,
			tags: [
				...this.tags.values().map((tag) => ({
					name: tag.name,
					sessions: tag.sessions.size,
				})),
			],
		};
	}

	public getEvents() {
		return this.db
			.select()
			.from(SCHEMAS.presenceEvent)
			.orderBy(desc(SCHEMAS.presenceEvent.id))
			.limit(50);
	}
}
