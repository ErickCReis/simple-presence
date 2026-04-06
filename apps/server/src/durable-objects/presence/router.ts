import { implement } from "@orpc/server";
import { HibernationEventIterator } from "@orpc/server/hibernation";
import { presenceContract } from "@simple-presence/contracts";
import type { Presence } from ".";

export type PresenceRouterContext = {
  ws: WebSocket;
  do: Presence;
};

const presence = implement(presenceContract).$context<PresenceRouterContext>();

export const router = presence.router({
  on: presence.on.handler(async ({ context, input }) => {
    return new HibernationEventIterator<number>((id) =>
      context.do.registerCountSubscription(context.ws, id, input.tag),
    );
  }),
  update: presence.update.handler(async ({ context, input }) => {
    const result = await context.do.update(context.ws, input);

    if (result.previousTag && result.previousTag !== input.tag) {
      context.do.broadcastTagCount(result.previousTag, result.previousTagCount, context.ws);
    }

    context.do.broadcastTagCount(input.tag, result.currentTagCount);
  }),
});

export type PresenceRouter = typeof router;
