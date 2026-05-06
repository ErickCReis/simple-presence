import { DurableObject } from "cloudflare:workers";
import { encodeHibernationRPCEvent, HibernationPlugin } from "@orpc/server/hibernation";
import { RPCHandler } from "@orpc/server/websocket";
import { FREE_PLAN_LIMITS } from "@simple-presence/config";
import type { PresenceData } from "@simple-presence/contracts";
import { asc, desc, eq, lt } from "drizzle-orm";
import { type DrizzleSqliteDODatabase, drizzle } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { SCHEMAS } from "./db/schema";
import { type PresenceRouterContext, router } from "./router";

// @ts-ignore
import migrations from "./db/migrations/migrations";

const SNAPSHOT_INTERVAL_MS = 10_000;
const SNAPSHOT_RETENTION_MS = 30 * 60_000;

type SessionAttachment = {
  sessionId: string;
  presence: PresenceData | null;
  countSubscriptionId: string | null;
  countSubscriptionTag: string | null;
};

const handler = new RPCHandler<PresenceRouterContext>(router, {
  plugins: [new HibernationPlugin()],
});

export class Presence extends DurableObject<Env> {
  state: DurableObjectState;
  db: DrizzleSqliteDODatabase;
  lastUpdated = Date.now();

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.state = state;
    this.db = drizzle(this.state.storage);

    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));

    void this.state.blockConcurrencyWhile(async () => {
      await migrate(this.db, migrations);
    });
  }

  async fetch() {
    if (this.state.getWebSockets().length >= FREE_PLAN_LIMITS.maxConcurrentConnectionsPerApp) {
      return new Response("Connection limit reached for this app (free plan)", {
        status: 429,
      });
    }

    const { "0": client, "1": server } = new WebSocketPair();
    const sessionId = crypto.randomUUID();

    this.state.acceptWebSocket(server);
    server.serializeAttachment({
      sessionId,
      presence: null,
      countSubscriptionId: null,
      countSubscriptionTag: null,
    } satisfies SessionAttachment);

    await this.db.insert(SCHEMAS.presenceEvent).values({
      sessionId,
      type: "connect",
    });

    await this.ensureAlarm();

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async alarm() {
    const sockets = this.state.getWebSockets();

    if (sockets.length > 0) {
      const tagStats = this.collectTagStats();

      for (const [tagName, stats] of tagStats.entries()) {
        await this.db.insert(SCHEMAS.countSnapshot).values({
          tag: tagName,
          sessions: stats.sessions,
          online: stats.online,
          away: stats.away,
        });

        await this.upsertPeak(tagName, stats.sessions);
      }
    }

    const cutoff = new Date(Date.now() - SNAPSHOT_RETENTION_MS);
    await this.db.delete(SCHEMAS.countSnapshot).where(lt(SCHEMAS.countSnapshot.timestamp, cutoff));

    if (sockets.length > 0) {
      await this.state.storage.setAlarm(Date.now() + SNAPSHOT_INTERVAL_MS);
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    await handler.message(ws, message, {
      context: {
        ws,
        do: this,
      },
    });
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    handler.close(ws);

    const session = this.getSession(ws);
    const previousTag = session?.presence?.tag;

    if (previousTag) {
      const remainingCount = this.collectTagStats(ws).get(previousTag)?.sessions ?? 0;
      this.broadcastTagCount(previousTag, remainingCount, ws);
      this.lastUpdated = Date.now();
    }

    await this.db.insert(SCHEMAS.presenceEvent).values({
      sessionId: session?.sessionId ?? "unknown",
      type: "disconnect",
    });

    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CLOSING) {
      ws.close(code, reason);
    }
  }

  registerCountSubscription(ws: WebSocket, subscriptionId: string, tag: string) {
    const session = this.getSession(ws) ?? {
      sessionId: crypto.randomUUID(),
      presence: null,
      countSubscriptionId: null,
      countSubscriptionTag: null,
    };

    ws.serializeAttachment({
      ...session,
      countSubscriptionId: subscriptionId,
      countSubscriptionTag: tag,
    } satisfies SessionAttachment);
  }

  async update(ws: WebSocket, presence: PresenceData) {
    const session = this.getSession(ws) ?? {
      sessionId: crypto.randomUUID(),
      presence: null,
      countSubscriptionId: null,
      countSubscriptionTag: null,
    };
    const previousPresence = session.presence;

    if (
      previousPresence &&
      previousPresence.tag === presence.tag &&
      previousPresence.status === presence.status
    ) {
      return {
        currentTagCount: this.collectTagStats().get(presence.tag)?.sessions ?? 0,
        previousTagCount: 0,
      };
    }

    const tagStatsBeforeUpdate = this.collectTagStats();
    const isNewTag =
      previousPresence?.tag !== presence.tag && !tagStatsBeforeUpdate.has(presence.tag);

    if (isNewTag && tagStatsBeforeUpdate.size >= FREE_PLAN_LIMITS.maxTagsPerApp) {
      throw new Error(
        `Tag limit reached for this app (max ${FREE_PLAN_LIMITS.maxTagsPerApp} tags on free plan)`,
      );
    }

    ws.serializeAttachment({
      ...session,
      presence,
    } satisfies SessionAttachment);

    await this.db.insert(SCHEMAS.presenceEvent).values({
      sessionId: session.sessionId,
      type: "update",
      tag: presence.tag,
      status: presence.status,
    });

    const tagStats = this.collectTagStats();
    this.lastUpdated = Date.now();

    const currentTagCount = tagStats.get(presence.tag)?.sessions ?? 0;
    await this.upsertPeak(presence.tag, currentTagCount);

    return {
      currentTagCount,
      previousTag: previousPresence?.tag,
      previousTagCount: previousPresence?.tag
        ? (tagStats.get(previousPresence.tag)?.sessions ?? 0)
        : 0,
    };
  }

  broadcastTagCount(tag: string, count: number, exclude?: WebSocket) {
    for (const ws of this.state.getWebSockets()) {
      if (exclude && ws === exclude) {
        continue;
      }

      const session = this.getSession(ws);
      if (!session || session.countSubscriptionTag !== tag || !session.countSubscriptionId) {
        continue;
      }

      ws.send(encodeHibernationRPCEvent(session.countSubscriptionId, count));
    }
  }

  public async getHistory(tag: string) {
    const rows = await this.db
      .select()
      .from(SCHEMAS.countSnapshot)
      .where(eq(SCHEMAS.countSnapshot.tag, tag))
      .orderBy(asc(SCHEMAS.countSnapshot.timestamp));

    return rows.map((r) => ({
      timestamp: r.timestamp.toISOString(),
      sessions: r.sessions,
      online: r.online,
      away: r.away,
    }));
  }

  public async getTagPeak(tag: string) {
    const rows = await this.db
      .select()
      .from(SCHEMAS.presenceTag)
      .where(eq(SCHEMAS.presenceTag.name, tag))
      .limit(1);

    if (rows.length === 0) {
      return { peak: 0, peakAt: null };
    }

    return {
      peak: rows[0].peakConcurrentConnections,
      peakAt: rows[0].peakReachedAt?.toISOString() ?? null,
    };
  }

  private getSession(ws: WebSocket) {
    return ws.deserializeAttachment() as SessionAttachment | null;
  }

  private collectTagStats(exclude?: WebSocket) {
    const tags = new Map<
      string,
      { name: string; sessions: number; online: number; away: number }
    >();

    for (const ws of this.state.getWebSockets()) {
      if (exclude && ws === exclude) {
        continue;
      }

      const presence = this.getSession(ws)?.presence;
      if (!presence) {
        continue;
      }

      const existing = tags.get(presence.tag) ?? {
        name: presence.tag,
        sessions: 0,
        online: 0,
        away: 0,
      };

      existing.sessions += 1;
      if (presence.status === "online") {
        existing.online += 1;
      } else {
        existing.away += 1;
      }

      tags.set(presence.tag, existing);
    }

    return tags;
  }

  private async upsertPeak(tag: string, currentCount: number) {
    const existing = await this.db
      .select()
      .from(SCHEMAS.presenceTag)
      .where(eq(SCHEMAS.presenceTag.name, tag))
      .limit(1);

    if (existing.length === 0) {
      await this.db.insert(SCHEMAS.presenceTag).values({
        id: crypto.randomUUID(),
        name: tag,
        isActive: true,
        peakConcurrentConnections: currentCount,
        peakReachedAt: new Date(),
      });
      return;
    }

    if (currentCount > existing[0].peakConcurrentConnections) {
      await this.db
        .update(SCHEMAS.presenceTag)
        .set({
          peakConcurrentConnections: currentCount,
          peakReachedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(SCHEMAS.presenceTag.id, existing[0].id));
    }
  }

  private async ensureAlarm() {
    const alarm = await this.state.storage.getAlarm();
    if (alarm === null) {
      await this.state.storage.setAlarm(Date.now() + SNAPSHOT_INTERVAL_MS);
    }
  }

  public getStats() {
    return {
      lastUpdated: this.lastUpdated,
      tags: [...this.collectTagStats().values()],
    };
  }

  public getEvents() {
    return this.db
      .select()
      .from(SCHEMAS.presenceEvent)
      .orderBy(desc(SCHEMAS.presenceEvent.id))
      .limit(50)
      .then((events) =>
        events.map((event) => ({
          id: event.id,
          type: event.type,
          timestamp: event.timestamp.toISOString(),
          tag: event.tag,
          status: event.status,
        })),
      );
  }
}
