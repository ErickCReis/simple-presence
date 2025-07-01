import { DurableObject } from "cloudflare:workers";
import type { PresenceData } from "@simple-presence/core";

interface SessionInfo {
	sessionId: string;
	page: string;
	status: "online" | "away" | "offline";
	lastUpdate: number;
}

interface PageCount {
	page: string;
	count: number;
	sessions: Set<string>;
}

export class Presence extends DurableObject<Env> {
	private state: DurableObjectState;

	// Local maps for session management
	private sessions: Map<string, SessionInfo> = new Map();
	private pages: Map<string, PageCount> = new Map();
	private sessionTTLs: Map<string, number> = new Map();

	// TTL configuration
	private readonly TTL_DURATION = 10_000; // 10 seconds in milliseconds

	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
		this.state = state;
	}

	async update(presence: PresenceData): Promise<number> {
		const { sessionId, page, status } = presence;
		const now = Date.now();

		// Update session TTL
		this.sessionTTLs.set(sessionId, now + this.TTL_DURATION);

		// Handle different status scenarios
		if (status === "offline" || status === "away") {
			// Remove session from all pages
			this.removeSessionFromAllPages(sessionId);

			// Remove session data
			this.sessions.delete(sessionId);
			this.sessionTTLs.delete(sessionId);
		} else if (status === "online") {
			// Remove session from all pages first
			this.removeSessionFromAllPages(sessionId);

			// Add session to the new page
			this.addSessionToPage(sessionId, page, status, now);
		}

		// Always check for expired sessions
		this.cleanupExpiredSessions();

		// use alarms to all cleanup after 10 seconds without requests
		const currentAlarm = await this.state.storage.getAlarm();
		if (currentAlarm) {
			await this.state.storage.deleteAlarm();
		}
		this.state.storage.setAlarm(Date.now() + this.TTL_DURATION * 2);

		// Return the count for the specified page
		const pageCount = this.pages.get(page);
		return pageCount ? pageCount.count : 0;
	}

	private removeSessionFromAllPages(sessionId: string): void {
		// Remove session from all pages
		for (const [pageKey, pageCount] of this.pages.entries()) {
			if (pageCount.sessions.has(sessionId)) {
				pageCount.sessions.delete(sessionId);
				pageCount.count = pageCount.sessions.size;

				// Remove page if no sessions left
				if (pageCount.count === 0) {
					this.pages.delete(pageKey);
				}
			}
		}
	}

	private addSessionToPage(
		sessionId: string,
		page: string,
		status: "online" | "away" | "offline",
		timestamp: number,
	): void {
		// Update or create session info
		this.sessions.set(sessionId, {
			sessionId,
			page,
			status,
			lastUpdate: timestamp,
		});

		// Get or create page count
		let pageCount = this.pages.get(page);
		if (!pageCount) {
			pageCount = {
				page,
				count: 0,
				sessions: new Set(),
			};
			this.pages.set(page, pageCount);
		}

		// Add session to page
		pageCount.sessions.add(sessionId);
		pageCount.count = pageCount.sessions.size;
	}

	private cleanupExpiredSessions(): void {
		const now = Date.now();
		const expiredSessions: string[] = [];

		// Find expired sessions
		for (const [sessionId, ttl] of this.sessionTTLs.entries()) {
			if (now > ttl) {
				expiredSessions.push(sessionId);
			}
		}

		// Remove expired sessions
		for (const sessionId of expiredSessions) {
			this.removeSessionFromAllPages(sessionId);
			this.sessions.delete(sessionId);
			this.sessionTTLs.delete(sessionId);
		}
	}

	// Method to get presence counts by page
	async getPresenceCounts(): Promise<Record<string, number>> {
		this.cleanupExpiredSessions();

		const counts: Record<string, number> = {};
		for (const [page, pageCount] of this.pages.entries()) {
			counts[page] = pageCount.count;
		}

		return counts;
	}

	// Method to get all active sessions
	async getActiveSessions(): Promise<SessionInfo[]> {
		this.cleanupExpiredSessions();

		return Array.from(this.sessions.values());
	}

	alarm(_?: AlarmInvocationInfo): void | Promise<void> {
		console.log("alarm");
		this.cleanupExpiredSessions();
	}
}
