export interface PresenceConfig {
	appKey: string;
	apiUrl?: string;
	heartbeatInterval?: number;
	debounceDelay?: number;
	onCountChange?: (count: number) => void;
}

export interface PresenceData {
	sessionId: string;
	page: string;
	status: "online" | "away" | "offline";
}

export class SimplePresence {
	private config: PresenceConfig;
	private heartbeatTimer?: number;
	private sessionId: string;
	private currentPage: string;
	private currentStatus: "online" | "away" | "offline" = "online";
	private isDestroyed = false;
	private debounceTimer?: number;
	private currentCount = 0;

	constructor(config: PresenceConfig) {
		this.config = {
			appKey: config.appKey,
			apiUrl: process.env.SERVER_URL,
			heartbeatInterval: config.heartbeatInterval ?? 10_000,
			debounceDelay: config.debounceDelay ?? 1_000,
		};

		this.sessionId = this.generateSessionId();
		this.currentPage = window.location.pathname;

		this.initialize();
	}

	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random()
			.toString(36)
			.substring(2, 15)}`;
	}

	private initialize(): void {
		// Set up page change detection
		this.setupPageChangeDetection();

		// Set up visibility change detection
		this.setupVisibilityDetection();

		// Start heartbeat
		this.startHeartbeat();

		// Send initial presence
		this.updatePresence();
	}

	private setupPageChangeDetection(): void {
		// Listen for popstate (browser back/forward)
		window.addEventListener("popstate", this.handlePageChange.bind(this));

		// Listen for pushstate/replacestate (programmatic navigation)
		const originalPushState = window.history.pushState;
		const originalReplaceState = window.history.replaceState;

		window.history.pushState = (...args) => {
			originalPushState.apply(window.history, args);
			this.handlePageChange();
		};

		window.history.replaceState = (...args) => {
			originalReplaceState.apply(window.history, args);
			this.handlePageChange();
		};
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

	private handlePageChange(): void {
		const newPage = window.location.pathname;
		if (newPage !== this.currentPage) {
			this.currentPage = newPage;
			this.setStatus("online");
			this.updatePresence();
		}
	}

	private setStatus(status: "online" | "away" | "offline"): void {
		if (this.currentStatus !== status) {
			this.currentStatus = status;
			this.updatePresence();
		}
	}

	private startHeartbeat(): void {
		this.heartbeatTimer = window.setInterval(() => {
			if (!this.isDestroyed) {
				this.updatePresence();
			}
		}, this.config.heartbeatInterval);
	}

	private async updatePresence(): Promise<void> {
		// Clear existing debounce timer
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		// Set up debounce timer
		this.debounceTimer = window.setTimeout(async () => {
			try {
				const response = await fetch(`${this.config.apiUrl}/presence`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-App-Key": this.config.appKey,
					},
					body: JSON.stringify({
						sessionId: this.sessionId,
						page: this.currentPage,
						status: this.currentStatus,
					}),
				});

				if (!response.ok) {
					console.warn("Failed to update presence:", response.statusText);
					return;
				}

				// Parse the response to get the count
				const data = await response.json();
				if (data.count !== undefined && typeof data.count === "number") {
					const newCount = data.count;
					if (newCount !== this.currentCount) {
						this.currentCount = newCount;
						// Call the callback if provided
						if (this.config.onCountChange) {
							this.config.onCountChange(newCount);
						}
					}
				}
			} catch (error) {
				console.warn("Error updating presence:", error);
			}
		}, this.config.debounceDelay);
	}

	public getStatus(): "online" | "away" | "offline" {
		return this.currentStatus;
	}

	public getPage(): string {
		return this.currentPage;
	}

	public getSessionId(): string {
		return this.sessionId;
	}

	public getCount(): number {
		return this.currentCount;
	}

	public destroy(): void {
		this.isDestroyed = true;

		window.removeEventListener("popstate", this.handlePageChange);
		document.removeEventListener(
			"visibilitychange",
			this.handleVisibilityChange,
		);

		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
		}

		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.setStatus("offline");
	}
}

// Global initialization function
export function initPresence(config: PresenceConfig): SimplePresence {
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
