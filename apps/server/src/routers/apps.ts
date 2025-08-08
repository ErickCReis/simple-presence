import { env } from "cloudflare:workers";
import { eventIterator } from "@orpc/server";
import { FREE_PLAN_LIMITS } from "@simple-presence/config";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod/v3";
import { db, SCHEMAS } from "@/db";
import { protectedProcedure } from "@/lib/orpc";

const createAppSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().optional(),
});

const updateAppSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().optional(),
});

export const appsRouter = {
	// Create a new app for the authenticated user
	create: protectedProcedure
		.input(createAppSchema)
		.errors({
			MAX_APPS_PER_USER: {
				message: `Free plan limit reached: You can create up to ${FREE_PLAN_LIMITS.maxAppsPerUser} apps.`,
			},
		})
		.handler(async ({ input, context, errors }) => {
			// Enforce free plan limit: max 3 apps per user
			const existingApps = await db
				.select({ id: SCHEMAS.app.id })
				.from(SCHEMAS.app)
				.where(eq(SCHEMAS.app.userId, context.session.user.id));
			if (existingApps.length >= FREE_PLAN_LIMITS.maxAppsPerUser) {
				throw errors.MAX_APPS_PER_USER();
			}

			const appId = nanoid();
			const publicKey = nanoid(32); // Generate a unique public key

			const [app] = await db
				.insert(SCHEMAS.app)
				.values({
					id: appId,
					name: input.name,
					description: input.description,
					publicKey,
					userId: context.session.user.id,
				})
				.returning();

			return app;
		}),

	// List all apps for the authenticated user
	list: protectedProcedure.handler(async ({ context }) => {
		const apps = await db
			.select()
			.from(SCHEMAS.app)
			.where(eq(SCHEMAS.app.userId, context.session.user.id))
			.orderBy(SCHEMAS.app.createdAt);

		return apps;
	}),

	// Get a specific app by ID
	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			const [app] = await db
				.select()
				.from(SCHEMAS.app)
				.where(
					and(
						eq(SCHEMAS.app.id, input.id),
						eq(SCHEMAS.app.userId, context.session.user.id),
					),
				);

			if (!app) {
				throw new Error("App not found");
			}

			return app;
		}),

	// Update an app
	update: protectedProcedure
		.input(updateAppSchema)
		.handler(async ({ input, context }) => {
			const [app] = await db
				.update(SCHEMAS.app)
				.set({
					...(input.name && { name: input.name }),
					...(input.description !== undefined && {
						description: input.description,
					}),
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(SCHEMAS.app.id, input.id),
						eq(SCHEMAS.app.userId, context.session.user.id),
					),
				)
				.returning();

			if (!app) {
				throw new Error("App not found");
			}

			return app;
		}),

	// Delete an app
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			const [app] = await db
				.delete(SCHEMAS.app)
				.where(
					and(
						eq(SCHEMAS.app.id, input.id),
						eq(SCHEMAS.app.userId, context.session.user.id),
					),
				)
				.returning();

			if (!app) {
				throw new Error("App not found");
			}

			return { success: true };
		}),

	watch: protectedProcedure
		.input(z.object({ id: z.string() }))
		.output(
			eventIterator(
				z.object({
					tags: z.array(
						z.object({
							name: z.string(),
							sessions: z.number(),
							online: z.number(),
							away: z.number(),
						}),
					),
					events: z.array(
						z.object({
							id: z.number(),
							type: z.string(),
							timestamp: z.date(),
							tag: z.string().nullable(),
							status: z.string().nullable(),
						}),
					),
				}),
			),
		)
		.handler(async function* ({ input, context }) {
			const [app] = await db
				.select()
				.from(SCHEMAS.app)
				.where(
					and(
						eq(SCHEMAS.app.id, input.id),
						eq(SCHEMAS.app.userId, context.session.user.id),
					),
				);

			if (!app) {
				throw new Error("App not found");
			}

			let lastUpdated = 0;

			while (true) {
				const id = env.PRESENCE.idFromName(app.publicKey);
				const presenceDO = env.PRESENCE.get(id);
				const [stats, events] = await Promise.all([
					presenceDO.getStats(),
					presenceDO.getEvents(),
				]);

				if (stats.lastUpdated > lastUpdated) {
					lastUpdated = stats.lastUpdated;
					yield { tags: stats.tags, events };
				}

				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}),
};
