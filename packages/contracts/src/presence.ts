import type { ContractRouterClient } from "@orpc/contract";
import { eventIterator, oc } from "@orpc/contract";
import * as v from "valibot";
import { presenceUpdateInputSchema } from "./schemas";

export const presenceContract = oc.router({
  on: oc.input(v.object({ tag: v.string() })).output(eventIterator(v.number())),
  update: oc.input(presenceUpdateInputSchema),
});

export type PresenceClient = ContractRouterClient<typeof presenceContract>;
