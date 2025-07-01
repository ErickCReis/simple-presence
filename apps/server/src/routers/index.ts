import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "@/lib/orpc";
import { appsRouter } from "./apps";
import { presenceRouter } from "./presence";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	apps: appsRouter,
	presence: presenceRouter,
};

export type AppRouter = typeof appRouter;

export type AppRouterClient = RouterClient<AppRouter>;
