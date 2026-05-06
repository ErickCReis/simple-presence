import * as v from "valibot";

// ─── App DTOs ───

export const appSummarySchema = v.object({
  id: v.string(),
  name: v.string(),
  publicKey: v.string(),
  description: v.nullable(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
});

export const appDetailSchema = appSummarySchema;

export const createAppInputSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  description: v.optional(v.string()),
});

export const updateAppInputSchema = v.object({
  id: v.string(),
  name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
  description: v.optional(v.string()),
});

export const deleteAppInputSchema = v.object({
  id: v.string(),
});

// ─── Watch DTOs ───

export const watchTagStatSchema = v.object({
  name: v.string(),
  sessions: v.number(),
  online: v.number(),
  away: v.number(),
});

export const watchAppInputSchema = v.object({
  id: v.string(),
});

export const presenceEventDtoSchema = v.object({
  id: v.number(),
  type: v.string(),
  timestamp: v.string(),
  tag: v.nullable(v.string()),
  status: v.nullable(v.string()),
});

export const watchAppPayloadSchema = v.object({
  tags: v.array(watchTagStatSchema),
  events: v.array(presenceEventDtoSchema),
});

// ─── Presence DTOs ───

export const presenceUpdateInputSchema = v.object({
  tag: v.string(),
  status: v.picklist(["online", "away"]),
});

export const presenceDataSchema = v.object({
  tag: v.string(),
  status: v.picklist(["online", "away"]),
});

export const countSnapshotSchema = v.object({
  timestamp: v.string(),
  sessions: v.number(),
  online: v.number(),
  away: v.number(),
});

export const tagPeakSchema = v.object({
  peak: v.number(),
  peakAt: v.nullable(v.string()),
});

// ─── Inferred Types ───

export type AppSummary = v.InferOutput<typeof appSummarySchema>;
export type AppDetail = v.InferOutput<typeof appDetailSchema>;
export type CreateAppInput = v.InferOutput<typeof createAppInputSchema>;
export type UpdateAppInput = v.InferOutput<typeof updateAppInputSchema>;
export type DeleteAppInput = v.InferOutput<typeof deleteAppInputSchema>;
export type WatchTagStat = v.InferOutput<typeof watchTagStatSchema>;
export type WatchAppInput = v.InferOutput<typeof watchAppInputSchema>;
export type PresenceEventDto = v.InferOutput<typeof presenceEventDtoSchema>;
export type WatchAppPayload = v.InferOutput<typeof watchAppPayloadSchema>;
export type PresenceUpdateInput = v.InferOutput<typeof presenceUpdateInputSchema>;
export type PresenceData = v.InferOutput<typeof presenceDataSchema>;
export type CountSnapshot = v.InferOutput<typeof countSnapshotSchema>;
export type TagPeak = v.InferOutput<typeof tagPeakSchema>;
