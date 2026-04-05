import { EventPublisher, eventIterator, os, type RouterClient } from "@orpc/server";
import { presenceUpdateInputSchema } from "@simple-presence/contracts";
import * as v from "valibot";
import type { Presence } from ".";

const publisher = new EventPublisher<Record<string, number>>();

const procedure = os.$context<{
  ws: WebSocket;
  do: Presence;
}>();

export const router = {
  on: procedure
    .input(v.object({ tag: v.string() }))
    .output(eventIterator(v.number()))
    .handler(async function* ({ input, signal }) {
      for await (const count of publisher.subscribe(input.tag, { signal })) {
        yield count;
      }
    }),
  update: procedure.input(presenceUpdateInputSchema).handler(async ({ context, input }) => {
    const count = await context.do.update(context.ws, input);
    publisher.publish(input.tag, count);
  }),
};

export type PresenceRouter = typeof router;
export type PresenceRouterClient = RouterClient<PresenceRouter>;
