import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/websocket";
import { WebSocket as RWS } from "partysocket";
// Intentionally avoid importing server router types here to prevent cross-package type coupling

type ConnectionKey = string;

interface ConnectionRecord {
  websocket: RWS;
  client: unknown;
  refCount: number;
  openPromise: Promise<void>;
  url: string;
}

const connections = new Map<ConnectionKey, ConnectionRecord>();

function makeKey(apiUrl: string, appKey: string, tag: string): ConnectionKey {
  // Important: include tag because server associates presence to a single tag per WebSocket session
  return `${apiUrl}::${appKey}::${tag}`;
}

function buildWebSocketUrl(apiUrl: string, appKey: string, clientId: string): string {
  const base = `${apiUrl}/${appKey}`;
  const url = new URL(base, typeof location !== "undefined" ? location.href : "http://localhost/");
  url.searchParams.set("cid", clientId);
  return url.toString();
}

export async function acquireConnection(
  apiUrl: string,
  appKey: string,
  tag: string,
  clientId: string,
): Promise<unknown> {
  const key = makeKey(apiUrl, appKey, tag);
  const existing = connections.get(key);
  if (existing) {
    existing.refCount++;
    await existing.openPromise;
    return existing.client;
  }

  const socketUrl = buildWebSocketUrl(apiUrl, appKey, clientId);
  const websocket = new RWS(socketUrl);
  const openPromise = new Promise<void>((resolve, reject) => {
    websocket.onopen = () => resolve();
    websocket.onerror = (error) => reject(error);
  });
  const link = new RPCLink({ websocket });
  const client = createORPCClient(link) as unknown;

  const record: ConnectionRecord = {
    websocket,
    client,
    refCount: 1,
    openPromise,
    url: socketUrl,
  };

  connections.set(key, record);

  // If the socket closes unexpectedly, drop the record so next acquire reconnects
  websocket.onclose = () => {
    const current = connections.get(key);
    if (current && current.websocket === websocket) {
      connections.delete(key);
    }
  };

  await openPromise;
  return client;
}

export function releaseConnection(apiUrl: string, appKey: string, tag: string): void {
  const key = makeKey(apiUrl, appKey, tag);
  const record = connections.get(key);
  if (!record) return;
  record.refCount--;
  if (record.refCount <= 0) {
    try {
      record.websocket.close();
    } catch {
      // ignore
    }
    connections.delete(key);
  }
}


