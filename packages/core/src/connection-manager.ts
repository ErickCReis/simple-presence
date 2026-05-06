import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/websocket";
import type {
  CountSnapshot,
  PresenceClient,
  PresenceUpdateInput,
  TagPeak,
} from "@simple-presence/contracts";
import { WebSocket as RWS } from "partysocket";

type ConnectionRecord = {
  websocket: RWS;
  client: PresenceClient;
  refCount: number;
  openPromise: Promise<void>;
  currentCount: number;
  listeners: Set<(count: number) => void>;
  subscriptionStarted: boolean;
};

export type PresenceConnection = {
  getCurrentCount(): number;
  sendUpdate(input: PresenceUpdateInput): Promise<void>;
  subscribe(listener: (count: number) => void): () => void;
  getHistory(): Promise<CountSnapshot[]>;
  getStats(): Promise<TagPeak>;
};

const connections = new Map<string, ConnectionRecord>();
const MAX_CONNECTION_RETRIES = 5;

function buildWebSocketUrl(apiUrl: string, appKey: string, clientId: string): string {
  const base = `${apiUrl}/${appKey}`;
  const url = new URL(base, typeof location !== "undefined" ? location.href : "http://localhost/");
  url.searchParams.set("cid", clientId);
  return url.toString();
}

async function startSubscription(record: ConnectionRecord, tag: string) {
  record.subscriptionStarted = true;
  const subscription = await record.client.on({ tag });

  void (async () => {
    try {
      for await (const count of subscription) {
        record.currentCount = count;
        for (const listener of record.listeners) {
          listener(count);
        }
      }
    } finally {
      record.subscriptionStarted = false;
    }
  })().catch((error) => {
    console.warn("Error processing presence updates:", error);
  });
}

async function ensureSubscription(record: ConnectionRecord, tag: string) {
  if (record.subscriptionStarted) return;
  await startSubscription(record, tag);
}

function buildConnection(record: ConnectionRecord, tag: string): PresenceConnection {
  return {
    getCurrentCount: () => record.currentCount,
    sendUpdate: async (input) => {
      await record.client.update(input);
    },
    subscribe: (listener) => {
      record.listeners.add(listener);
      listener(record.currentCount);
      return () => record.listeners.delete(listener);
    },
    getHistory: () => record.client.history({ tag }),
    getStats: () => record.client.stats({ tag }),
  };
}

export async function acquireConnection(
  apiUrl: string,
  appKey: string,
  tag: string,
  clientId: string,
): Promise<PresenceConnection> {
  const key = `${apiUrl}::${appKey}::${tag}`;
  const existing = connections.get(key);
  if (existing) {
    existing.refCount++;
    await existing.openPromise;
    await ensureSubscription(existing, tag);
    return buildConnection(existing, tag);
  }

  const socketUrl = buildWebSocketUrl(apiUrl, appKey, clientId);
  const websocket = new RWS(socketUrl, [], {
    maxRetries: MAX_CONNECTION_RETRIES,
  });

  const openPromise = new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      websocket.removeEventListener("open", handleOpen);
      websocket.removeEventListener("error", handleError);
      websocket.removeEventListener("close", handleCloseBeforeOpen);
    };

    const rejectOnce = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const handleOpen = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const handleError = (event: Event) => {
      const error =
        event instanceof ErrorEvent
          ? event.error
          : new Error("WebSocket connection failed before opening");
      rejectOnce(error);
    };

    const handleCloseBeforeOpen = () => {
      rejectOnce(new Error("WebSocket closed before opening"));
    };

    websocket.addEventListener("open", handleOpen);
    websocket.addEventListener("error", handleError);
    websocket.addEventListener("close", handleCloseBeforeOpen);
  });

  const link = new RPCLink({ websocket: websocket as unknown as WebSocket });
  const client = createORPCClient(link) as PresenceClient;

  const record: ConnectionRecord = {
    websocket,
    client,
    refCount: 1,
    openPromise,
    currentCount: 0,
    listeners: new Set(),
    subscriptionStarted: false,
  };

  connections.set(key, record);

  websocket.addEventListener("close", () => {
    const current = connections.get(key);
    if (current && current.websocket === websocket) {
      connections.delete(key);
    }
  });

  try {
    await openPromise;
    await ensureSubscription(record, tag);
    return buildConnection(record, tag);
  } catch (error) {
    const current = connections.get(key);
    if (current?.websocket === websocket) {
      connections.delete(key);
    }

    websocket.close();
    throw error;
  }
}

export function releaseConnection(apiUrl: string, appKey: string, tag: string): void {
  const key = `${apiUrl}::${appKey}::${tag}`;
  const record = connections.get(key);
  if (!record) return;

  record.refCount--;
  if (record.refCount > 0) {
    return;
  }

  record.websocket.close();
  connections.delete(key);
}
