import type { ContractRouterClient } from "@orpc/contract";
import { oc, type as inferType } from "@orpc/contract";
import * as v from "valibot";
import { countSnapshotSchema, presenceUpdateInputSchema, tagPeakSchema } from "./schemas";

export const presenceContract = oc.router({
  on: oc.input(v.object({ tag: v.string() })).output(inferType<AsyncIterable<number>>()),
  update: oc.input(presenceUpdateInputSchema),
  history: oc.input(v.object({ tag: v.string() })).output(v.array(countSnapshotSchema)),
  stats: oc.input(v.object({ tag: v.string() })).output(tagPeakSchema),
});

export type PresenceClient = ContractRouterClient<typeof presenceContract>;
