import type { CountSnapshot, PresenceData, TagPeak } from "@simple-presence/contracts";
import { getOrCreateClientId } from "./client-id.js";
import {
  type PresenceConnection,
  acquireConnection,
  releaseConnection,
} from "./connection-manager.js";

const DEFAULT_API_URL = "wss://simple-presence.erickr.dev/api/presence";

export interface PresenceConfig {
  tag: string;
  appKey: string;
  apiUrl?: string;
  onCountChange?: (count: number) => void;
}

export type { CountSnapshot, PresenceData, TagPeak } from "@simple-presence/contracts";

export class SimplePresence {
  private config: PresenceConfig & { apiUrl: string };
  private currentStatus: "online" | "away" = "online";
  private isDestroyed = false;
  private currentCount = 0;
  private connection?: PresenceConnection;
  private clientId: string;
  private readonly visibilityHandler: () => void;
  private unsubscribeCountListener?: () => void;

  constructor(config: PresenceConfig) {
    this.config = {
      tag: config.tag,
      appKey: config.appKey,
      apiUrl: config.apiUrl ? `${config.apiUrl.replace(/^http/, "ws")}/presence` : DEFAULT_API_URL,
      onCountChange: config.onCountChange,
    };

    this.clientId = getOrCreateClientId();
    this.visibilityHandler = this.handleVisibilityChange.bind(this);
    void this.initialize();
  }

  private async initialize() {
    try {
      await this.setupWebSocket();
      if (this.isDestroyed) return;
      this.setupVisibilityDetection();
      await this.updatePresence();
    } catch (error) {
      if (!this.isDestroyed) {
        console.warn("Failed to initialize presence:", error);
      }
    }
  }

  private async setupWebSocket() {
    this.connection = await acquireConnection(
      this.config.apiUrl,
      this.config.appKey,
      this.config.tag,
      this.clientId,
    );
    this.unsubscribeCountListener = this.connection.subscribe((count) => {
      if (this.isDestroyed || count === this.currentCount) {
        return;
      }

      this.currentCount = count;
      this.config.onCountChange?.(count);
    });
    this.currentCount = this.connection.getCurrentCount();
  }

  private setupVisibilityDetection() {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.visibilityHandler);
    }
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      this.setStatus("away");
    } else {
      this.setStatus("online");
    }
  }

  private setStatus(status: PresenceData["status"]) {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      void this.updatePresence();
    }
  }

  private async updatePresence() {
    if (!this.connection || this.isDestroyed) return;
    await this.connection.sendUpdate({
      tag: this.config.tag,
      status: this.currentStatus,
    });
  }

  public getStatus() {
    return this.currentStatus;
  }

  public getCount() {
    return this.currentCount;
  }

  public async destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }

    this.unsubscribeCountListener?.();
    this.unsubscribeCountListener = undefined;
    releaseConnection(this.config.apiUrl, this.config.appKey, this.config.tag);
  }

  public async getHistory(): Promise<CountSnapshot[]> {
    if (!this.connection) return [];
    return this.connection.getHistory();
  }

  public async getStats(): Promise<TagPeak> {
    if (!this.connection) return { peak: 0, peakAt: null };
    return this.connection.getStats();
  }

  public getClientId() {
    return this.clientId;
  }
}

export async function initPresence(config: PresenceConfig & { tag: string }) {
  if (typeof window === "undefined") {
    throw new Error("initPresence can only be called in the browser");
  }

  return new SimplePresence(config);
}

if (typeof window !== "undefined") {
  (window as any).SimplePresence = {
    initPresence,
    SimplePresence,
  };
}
