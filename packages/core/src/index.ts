import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/websocket";
import type { PresenceRouterClient } from "../../../apps/server/src/durable-objects/presence.ts";

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
	private currentCount = 0;
	private websocket?: WebSocket;
	private client?: PresenceRouterClient;
	private subscription?: AsyncIterable<number>;

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

		this.initialize();
	}

	private async initialize(): Promise<void> {
		await this.setupWebSocket();
		this.setupVisibilityDetection();
		this.startListening();
		await this.updatePresence();
	}

	private async setupWebSocket(): Promise<void> {
		this.websocket = new WebSocket(
			`${this.config.apiUrl}/${this.config.appKey}`,
		);

		await new Promise<void>((resolve, reject) => {
			if (!this.websocket) {
				return reject(new Error("WebSocket not initialized"));
			}

			this.websocket.onopen = () => resolve();
			this.websocket.onerror = (error) => reject(error);
		});

		const link = new RPCLink({ websocket: this.websocket });
		this.client = createORPCClient(link);
	}

	private setupVisibilityDetection(): void {
		document.addEventListener(
			"visibilitychange",
			this.handleVisibilityChange.bind(this),
		);
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

	public getStatus(): "online" | "away" {
		return this.currentStatus;
	}

	public getCount(): number {
		return this.currentCount;
	}

	public async destroy(): Promise<void> {
		this.isDestroyed = true;

		document.removeEventListener(
			"visibilitychange",
			this.handleVisibilityChange,
		);

		this.websocket?.close();
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
