import type { PresenceRouterClient } from "../../../apps/server/src/durable-objects/presence/router.js";
import { getOrCreateClientId } from "./client-id.js";
import { acquireConnection, releaseConnection } from "./connection-manager.js";

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

export class SimplePresence {
	private config: PresenceConfig & { apiUrl: string };
	private currentStatus: "online" | "away" = "online";
	private isDestroyed = false;
	private currentCount = 1;
  private client?: PresenceRouterClient;
	private subscription?: AsyncIterable<number>;
  private clientId: string;
  private readonly visibilityHandler: () => void;

	constructor(config: PresenceConfig) {
		const wsUrl =
			config.apiUrl ??
			process.env.SERVER_URL?.replace("http", "ws") ??
			"ws://localhost:3000";

    this.config = {
			tag: config.tag,
			appKey: config.appKey,
			apiUrl: `${wsUrl}/presence`,
			onCountChange: config.onCountChange,
		};

    this.clientId = getOrCreateClientId();
    this.visibilityHandler = this.handleVisibilityChange.bind(this);
    this.initialize();
	}

	private async initialize(): Promise<void> {
		await this.setupWebSocket();
		this.setupVisibilityDetection();
		this.startListening();
		await this.updatePresence();
	}

  private async setupWebSocket(): Promise<void> {
    this.client = await acquireConnection(
      this.config.apiUrl,
      this.config.appKey,
      this.config.tag,
      this.clientId,
    );
  }

	private setupVisibilityDetection(): void {
    document.addEventListener("visibilitychange", this.visibilityHandler);
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
			this.updatePresence();
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
			console.warn("Error updating presence:", error);
		}
	}

	private async startListening(): Promise<void> {
		if (!this.client || this.isDestroyed) return;

		try {
			this.subscription = await this.client.on({ tag: this.config.tag });
			this.processUpdates();
		} catch (error) {
			console.warn("Error starting presence listener:", error);
		}
	}

	private async processUpdates(): Promise<void> {
		if (!this.subscription) return;

		try {
			for await (const count of this.subscription) {
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
		this.isDestroyed = true;

    document.removeEventListener("visibilitychange", this.visibilityHandler);

    releaseConnection(this.config.apiUrl, this.config.appKey, this.config.tag);
	}

  public getClientId(): string {
    return this.clientId;
  }
}

// Global initialization function
export async function initPresence(
	config: PresenceConfig & { tag: string },
): Promise<SimplePresence> {
	if (typeof window === "undefined") {
		throw new Error("initPresence can only be called in the browser");
	}

	return new SimplePresence(config);
}

// Export for global use
if (typeof window !== "undefined") {
	// biome-ignore lint/suspicious/noExplicitAny: !
	(window as any).SimplePresence = {
		initPresence,
		SimplePresence,
	};
}
