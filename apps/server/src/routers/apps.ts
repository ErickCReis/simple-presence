import { env } from "cloudflare:workers";
import { eventIterator } from "@orpc/server";
import {
  type AppDetail,
  appDetailSchema,
  createAppInputSchema,
  updateAppInputSchema,
  watchAppPayloadSchema,
} from "@simple-presence/contracts";
import { FREE_PLAN_LIMITS } from "@simple-presence/config";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as v from "valibot";
import { db, SCHEMAS } from "@/db";
import { protectedProcedure } from "@/lib/orpc";

const APP_WATCH_POLL_INTERVAL_MS = 2000;

function toAppDto(app: {
  id: string;
  name: string;
  publicKey: string;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}): AppDetail {
  return {
    id: app.id,
    name: app.name,
    publicKey: app.publicKey,
    description: app.description,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

function waitForNextPoll(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (!signal || signal.aborted) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, APP_WATCH_POLL_INTERVAL_MS);

    const handleAbort = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", handleAbort);
      resolve();
    };

    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

export const appsRouter = {
  create: protectedProcedure
    .input(createAppInputSchema)
    .output(appDetailSchema)
    .errors({
      MAX_APPS_PER_USER: {
        message: `Free plan limit reached: You can create up to ${FREE_PLAN_LIMITS.maxAppsPerUser} apps.`,
      },
    })
    .handler(async ({ input, context, errors }) => {
      const existingApps = await db
        .select({ id: SCHEMAS.app.id })
        .from(SCHEMAS.app)
        .where(eq(SCHEMAS.app.userId, context.session.user.id));
      if (existingApps.length >= FREE_PLAN_LIMITS.maxAppsPerUser) {
        throw errors.MAX_APPS_PER_USER();
      }

      const appId = nanoid();
      const publicKey = nanoid(32);

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

      return toAppDto(app!);
    }),

  list: protectedProcedure.output(v.array(appDetailSchema)).handler(async ({ context }) => {
    const apps = await db
      .select()
      .from(SCHEMAS.app)
      .where(eq(SCHEMAS.app.userId, context.session.user.id))
      .orderBy(SCHEMAS.app.createdAt);

    return apps.map(toAppDto);
  }),

  get: protectedProcedure
    .input(v.object({ id: v.string() }))
    .output(appDetailSchema)
    .errors({
      NOT_FOUND: { message: "App not found" },
    })
    .handler(async ({ input, context, errors }) => {
      const [app] = await db
        .select()
        .from(SCHEMAS.app)
        .where(and(eq(SCHEMAS.app.id, input.id), eq(SCHEMAS.app.userId, context.session.user.id)));

      if (!app) throw errors.NOT_FOUND();
      return toAppDto(app);
    }),

  update: protectedProcedure
    .input(updateAppInputSchema)
    .output(appDetailSchema)
    .errors({
      NOT_FOUND: { message: "App not found" },
    })
    .handler(async ({ input, context, errors }) => {
      const [app] = await db
        .update(SCHEMAS.app)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          updatedAt: new Date(),
        })
        .where(and(eq(SCHEMAS.app.id, input.id), eq(SCHEMAS.app.userId, context.session.user.id)))
        .returning();

      if (!app) throw errors.NOT_FOUND();
      return toAppDto(app);
    }),

  delete: protectedProcedure
    .input(v.object({ id: v.string() }))
    .output(v.object({ success: v.boolean() }))
    .errors({
      NOT_FOUND: { message: "App not found" },
    })
    .handler(async ({ input, context, errors }) => {
      const [app] = await db
        .delete(SCHEMAS.app)
        .where(and(eq(SCHEMAS.app.id, input.id), eq(SCHEMAS.app.userId, context.session.user.id)))
        .returning();

      if (!app) throw errors.NOT_FOUND();
      return { success: true };
    }),

  watch: protectedProcedure
    .input(v.object({ id: v.string() }))
    .output(eventIterator(watchAppPayloadSchema))
    .errors({
      NOT_FOUND: { message: "App not found" },
    })
    .handler(async function* ({ input, context, errors, signal }) {
      const abortSignal = signal;
      const [app] = await db
        .select()
        .from(SCHEMAS.app)
        .where(and(eq(SCHEMAS.app.id, input.id), eq(SCHEMAS.app.userId, context.session.user.id)));

      if (!app) throw errors.NOT_FOUND();

      const id = env.PRESENCE.idFromName(app.publicKey);
      const presenceDO = env.PRESENCE.get(id);
      let lastUpdated = 0;

      while (!abortSignal?.aborted) {
        const stats = await presenceDO.getStats();

        if (stats.lastUpdated > lastUpdated) {
          lastUpdated = stats.lastUpdated;
          const events = await presenceDO.getEvents();
          yield {
            tags: stats.tags,
            events,
          };
        }

        await waitForNextPoll(abortSignal);
      }
    }),
};
