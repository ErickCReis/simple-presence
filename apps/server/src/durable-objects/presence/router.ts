import {
	EventPublisher,
	eventIterator,
	os,
	type RouterClient,
} from "@orpc/server";
import { z } from "zod";
import type { Presence } from ".";

export const publisher = new EventPublisher<Record<string, number>>();

const procedure = os.$context<{
	ws: WebSocket;
	do: Presence;
}>();

export const router = {
	on: procedure
		.input(z.object({ tag: z.string() }))
		.output(eventIterator(z.number()))
		.handler(async function* ({ input, signal }) {
			for await (const count of publisher.subscribe(input.tag, { signal })) {
				yield count;
			}
		}),
	update: procedure
		.input(
			z.object({
				tag: z.string(),
				status: z.enum(["online", "away"]),
			}),
		)
		.handler(async ({ context, input }) => {
			const count = await context.do.update(context.ws, input);
			publisher.publish(input.tag, count);
		}),
};

export type PresenceRouter = typeof router;

export type PresenceRouterClient = RouterClient<PresenceRouter>;
