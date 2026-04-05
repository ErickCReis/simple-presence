import type { ContractRouterClient } from "@orpc/contract";
import { eventIterator, oc } from "@orpc/contract";
import * as v from "valibot";
import {
  appDetailSchema,
  appSummarySchema,
  createAppInputSchema,
  deleteAppInputSchema,
  updateAppInputSchema,
  watchAppPayloadSchema,
} from "./schemas";

export const dashboardContract = oc.router({
  apps: oc.router({
    create: oc.input(createAppInputSchema).output(appDetailSchema),
    list: oc.output(v.array(appSummarySchema)),
    get: oc.input(v.object({ id: v.string() })).output(appDetailSchema),
    update: oc.input(updateAppInputSchema).output(appDetailSchema),
    delete: oc.input(deleteAppInputSchema).output(v.object({ success: v.boolean() })),
    watch: oc.input(v.object({ id: v.string() })).output(eventIterator(watchAppPayloadSchema)),
  }),
});

export type DashboardClient = ContractRouterClient<typeof dashboardContract>;
