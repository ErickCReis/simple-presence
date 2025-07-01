import type { RouterClient } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db, SCHEMAS } from "@/db";
import { publicProcedure } from "@/lib/orpc";

const updatePresenceSchema = z.object({
	publicKey: z.string(),
	sessionId: z.string(),
	page: z.string(),
	status: z.enum(["online", "offline", "away", "busy"]),
	metadata: z.record(z.any()).optional(),
	ipAddress: z.string().optional(),
	userAgent: z.string().optional(),
});

const getPresenceSchema = z.object({
	publicKey: z.string(),
	page: z.string().optional(),
});

export const presenceRouter = {
	// Update presence for a session
	update: publicProcedure
		.input(updatePresenceSchema)
		.handler(async ({ input }) => {
			// First, get the app by public key
			const [app] = await db
				.select()
				.from(SCHEMAS.app)
				.where(eq(SCHEMAS.app.publicKey, input.publicKey));

			if (!app) {
				throw new Error("Invalid public key");
			}

			const now = new Date();

			// Create presence event
			const [event] = await db
				.insert(SCHEMAS.presenceEvent)
				.values({
					id: nanoid(),
					appId: app.id,
					userId: app.userId, // Using app owner's userId for now
					eventType: input.status,
					metadata: input.metadata ? JSON.stringify(input.metadata) : null,
					ipAddress: input.ipAddress,
					userAgent: input.userAgent,
					createdAt: now,
				})
				.returning();

			// Update or create presence session
			const [existingSession] = await db
				.select()
				.from(SCHEMAS.presenceSession)
				.where(
					and(
						eq(SCHEMAS.presenceSession.appId, app.id),
						eq(SCHEMAS.presenceSession.sessionId, input.sessionId),
					),
				);

			if (existingSession) {
				// Update existing session
				await db
					.update(SCHEMAS.presenceSession)
					.set({
						status: input.status,
						lastSeen: now,
						updatedAt: now,
					})
					.where(
						and(
							eq(SCHEMAS.presenceSession.appId, app.id),
							eq(SCHEMAS.presenceSession.sessionId, input.sessionId),
						),
					);
			} else {
				// Create new session
				await db.insert(SCHEMAS.presenceSession).values({
					id: nanoid(),
					appId: app.id,
					userId: app.userId,
					sessionId: input.sessionId,
					status: input.status,
					lastSeen: now,
					createdAt: now,
					updatedAt: now,
				});
			}

			// Get current presence count for the page
			const activeSessions = await db
				.select()
				.from(SCHEMAS.presenceSession)
				.where(
					and(
						eq(SCHEMAS.presenceSession.appId, app.id),
						eq(SCHEMAS.presenceSession.status, "online"),
					),
				);

			return {
				success: true,
				activeCount: activeSessions.length,
				eventId: event.id,
			};
		}),

	// Get presence data for an app
	get: publicProcedure.input(getPresenceSchema).handler(async ({ input }) => {
		// Get the app by public key
		const [app] = await db
			.select()
			.from(SCHEMAS.app)
			.where(eq(SCHEMAS.app.publicKey, input.publicKey));

		if (!app) {
			throw new Error("Invalid public key");
		}

		// Get active sessions
		const activeSessions = await db
			.select()
			.from(SCHEMAS.presenceSession)
			.where(
				and(
					eq(SCHEMAS.presenceSession.appId, app.id),
					eq(SCHEMAS.presenceSession.status, "online"),
				),
			);

		// Get recent events (last 100)
		const recentEvents = await db
			.select()
			.from(SCHEMAS.presenceEvent)
			.where(eq(SCHEMAS.presenceEvent.appId, app.id))
			.orderBy(SCHEMAS.presenceEvent.createdAt)
			.limit(100);

		return {
			app: {
				id: app.id,
				name: app.name,
				publicKey: app.publicKey,
			},
			activeSessions: activeSessions.length,
			recentEvents: recentEvents.map((event) => ({
				...event,
				metadata: event.metadata ? JSON.parse(event.metadata) : null,
			})),
		};
	}),

	// Get presence events for an app (with pagination)
	getEvents: publicProcedure
		.input(
			z.object({
				publicKey: z.string(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.handler(async ({ input }) => {
			// Get the app by public key
			const [app] = await db
				.select()
				.from(SCHEMAS.app)
				.where(eq(SCHEMAS.app.publicKey, input.publicKey));

			if (!app) {
				throw new Error("Invalid public key");
			}

			// Get events with pagination
			const events = await db
				.select()
				.from(SCHEMAS.presenceEvent)
				.where(eq(SCHEMAS.presenceEvent.appId, app.id))
				.orderBy(SCHEMAS.presenceEvent.createdAt)
				.limit(input.limit)
				.offset(input.offset);

			return events.map((event) => ({
				...event,
				metadata: event.metadata ? JSON.parse(event.metadata) : null,
			}));
		}),
};

export type PresenceRouter = typeof presenceRouter;
export type PresenceRouterClient = RouterClient<PresenceRouter>;
