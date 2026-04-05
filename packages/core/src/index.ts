import { getOrCreateClientId } from "./client-id.js";
import { acquireConnection, releaseConnection } from "./connection-manager.js";

const DEFAULT_API_URL = "wss://simple-presence.erickr.dev/api/presence";

export interface PresenceConfig {
  tag: string;
  appKey: string;
  apiUrl?: string;
  onCountChange?: (count: number) => void;
}

export interface PresenceData {
  tag: string;
  status: "online" | "away";
}

interface PresenceClient {
  update(input: { tag: string; status: "online" | "away" }): Promise<void>;
  on(input: { tag: string }): Promise<AsyncIterable<number>> | AsyncIterable<number>;
}

export class SimplePresence {
  private config: PresenceConfig & { apiUrl: string };
  private currentStatus: "online" | "away" = "online";
  private isDestroyed = false;
  private currentCount = 0;
  private client?: PresenceClient;
  private clientId: string;
  private readonly visibilityHandler: () => void;

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

  private async initialize(): Promise<void> {
    try {
      await this.setupWebSocket();
      if (this.isDestroyed) return;
      this.setupVisibilityDetection();
      void this.startListening();
      await this.updatePresence();
    } catch (error) {
      if (!this.isDestroyed) {
        console.warn("Failed to initialize presence:", error);
      }
    }
  }

  private async setupWebSocket(): Promise<void> {
    const raw = await acquireConnection(
      this.config.apiUrl,
      this.config.appKey,
      this.config.tag,
      this.clientId,
    );
    this.client = raw as PresenceClient;
  }

  private setupVisibilityDetection(): void {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.visibilityHandler);
    }
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.setStatus("away");
    } else {
      this.setStatus("online");
    }
  }

  private setStatus(status: PresenceData["status"]): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      void this.updatePresence();
    }
  }

  private async updatePresence(): Promise<void> {
    if (!this.client || this.isDestroyed) return;

    try {
      await this.client.update({
        tag: this.config.tag,
        status: this.currentStatus,
      });
    } catch (error) {
      if (!this.isDestroyed) {
        console.warn("Error updating presence:", error);
      }
    }
  }

  private async startListening(): Promise<void> {
    if (!this.client || this.isDestroyed) return;

    try {
      const subscription = await this.client.on({ tag: this.config.tag });
      void this.processUpdates(subscription);
    } catch (error) {
      if (!this.isDestroyed) {
        console.warn("Error starting presence listener:", error);
      }
    }
  }

  private async processUpdates(subscription: AsyncIterable<number>): Promise<void> {
    try {
      for await (const count of subscription) {
        if (this.isDestroyed) break;

        if (count !== this.currentCount) {
          this.currentCount = count;
          this.config.onCountChange?.(count);
        }
      }
    } catch (error) {
      if (!this.isDestroyed) {
        console.warn("Error processing presence updates:", error);
      }
    }
  }

  public getStatus(): PresenceData["status"] {
    return this.currentStatus;
  }

  public getCount(): number {
    return this.currentCount;
  }

  public async destroy(): Promise<void> {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }

    releaseConnection(this.config.apiUrl, this.config.appKey, this.config.tag);
  }

  public getClientId(): string {
    return this.clientId;
  }
}

export async function initPresence(
  config: PresenceConfig & { tag: string },
): Promise<SimplePresence> {
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
