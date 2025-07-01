import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
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
		.handler(async ({ input, context }) => {
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
};
