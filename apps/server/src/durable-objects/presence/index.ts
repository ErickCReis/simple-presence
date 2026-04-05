import { DurableObject } from "cloudflare:workers";
import { RPCHandler } from "@orpc/server/websocket";
import { FREE_PLAN_LIMITS } from "@simple-presence/config";
import type { PresenceData } from "@simple-presence/contracts";
import { desc } from "drizzle-orm";
import { type DrizzleSqliteDODatabase, drizzle } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { SCHEMAS } from "./db/schema";
import { router } from "./router";

// @ts-ignore
import migrations from "./db/migrations/migrations";

const handler = new RPCHandler(router);

interface TagInfo {
  name: string;
  sessions: Set<WebSocket>;
}

interface SessionInfo {
  id: string;
  presence: PresenceData | null;
}

export class Presence extends DurableObject<Env> {
  state: DurableObjectState;
  db: DrizzleSqliteDODatabase;

  // Local maps for session management using WebSocket as key
  sessions: Map<WebSocket, SessionInfo> = new Map();
  tags: Map<string, TagInfo> = new Map();
  lastUpdated: number = Date.now();

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.state = state;
    this.db = drizzle(this.state.storage);

    void this.state.blockConcurrencyWhile(async () => {
      await migrate(this.db, migrations);
    });
  }

  async fetch() {
    // Enforce max concurrent connections per app
    if (this.sessions.size >= FREE_PLAN_LIMITS.maxConcurrentConnectionsPerApp) {
      return new Response("Connection limit reached for this app (free plan)", {
        status: 429,
      });
    }

    const { "0": client, "1": server } = new WebSocketPair();
    this.state.acceptWebSocket(server);
    // Create a session for this connection with no presence data yet
    const sessionId = crypto.randomUUID();
    this.sessions.set(server, { id: sessionId, presence: null });

    await this.db.insert(SCHEMAS.presenceEvent).values({
      sessionId,
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
    const sessionInfo = this.sessions.get(ws);
    this.removeSession(ws);

    await this.db.insert(SCHEMAS.presenceEvent).values({
      sessionId: sessionInfo?.id ?? "unknown",
      type: "disconnect",
    });
  }

  async update(ws: WebSocket, presence: PresenceData) {
    const sessionInfo = this.sessions.get(ws) ?? {
      id: crypto.randomUUID(),
      presence: null,
    };

    await this.db.insert(SCHEMAS.presenceEvent).values({
      sessionId: sessionInfo.id,
      type: "update",
      tag: presence.tag,
      status: presence.status,
    });

    const previousPresence = sessionInfo.presence ?? null;

    // If tag changed, remove from old tag
    if (previousPresence) {
      const tagChanged = previousPresence.tag !== presence.tag;
      if (tagChanged) {
        const previousTagInfo = this.tags.get(previousPresence.tag);
        previousTagInfo?.sessions.delete(ws);
      }
    }

    // Treat both "online" and "away" as active: ensure tag exists and add
    let tagInfo = this.tags.get(presence.tag);
    if (!tagInfo) {
      // Enforce max tags per app (free plan)
      if (this.tags.size >= FREE_PLAN_LIMITS.maxTagsPerApp) {
        throw new Error(
          `Tag limit reached for this app (max ${FREE_PLAN_LIMITS.maxTagsPerApp} tags on free plan)`,
        );
      }
      tagInfo = { name: presence.tag, sessions: new Set() };
      this.tags.set(presence.tag, tagInfo);
    }
    tagInfo.sessions.add(ws);

    // Update the stored presence data for this session in-place
    this.sessions.set(ws, { id: sessionInfo.id, presence });

    this.lastUpdated = Date.now();

    const currentTagInfo = this.tags.get(presence.tag);
    return currentTagInfo ? currentTagInfo.sessions.size : 0;
  }

  private removeSession(ws: WebSocket) {
    const sessionInfo = this.sessions.get(ws);
    // Always delete the session record
    this.sessions.delete(ws);

    // Remove from tag only if it was online with a tag
    if (sessionInfo?.presence) {
      const tagInfo = this.tags.get(sessionInfo.presence.tag);
      tagInfo?.sessions.delete(ws);
    }
  }

  public getStats() {
    const tags = [...this.tags.values()].map((tag) => {
      let online = 0;
      let away = 0;
      for (const socket of tag.sessions) {
        const session = this.sessions.get(socket);
        const presence = session?.presence;
        if (!presence) continue;
        if (presence.status === "online") online++;
        else if (presence.status === "away") away++;
      }

      return {
        name: tag.name,
        sessions: tag.sessions.size,
        online,
        away,
      };
    });

    return {
      lastUpdated: this.lastUpdated,
      tags,
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
