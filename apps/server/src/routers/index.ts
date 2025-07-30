import type {
	InferRouterInputs,
	InferRouterOutputs,
	RouterClient,
} from "@orpc/server";
import { appsRouter } from "@/routers/apps";

export const appRouter = {
	apps: appsRouter,
};

export type AppRouter = typeof appRouter;

export type AppRouterClient = RouterClient<AppRouter>;
export type AppRouterInputs = InferRouterInputs<AppRouter>;
export type AppRouterOutputs = InferRouterOutputs<AppRouter>;
