import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const presenceEvent = sqliteTable(
  "presence_event",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type", { enum: ["update", "connect", "disconnect"] }).notNull(),
    tag: text("tag"),
    status: text("status", { enum: ["online", "away"] }),
    sessionId: text("session_id").notNull(),
    timestamp: integer("timestamp", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    userAgent: text("user_agent"),
    duration: integer("duration"),
  },
  (table) => [
    index("presence_event_tag_idx").on(table.tag),
    index("presence_event_timestamp_idx").on(table.timestamp),
    index("presence_event_session_id_idx").on(table.sessionId),
    index("presence_event_tag_timestamp_idx").on(table.tag, table.timestamp),
    index("presence_event_status_timestamp_idx").on(table.status, table.timestamp),
  ],
);

export const presenceTag = sqliteTable("presence_tag", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  totalUpdates: integer("total_updates").notNull().default(0),
  peakConcurrentConnections: integer("peak_concurrent_connections").notNull().default(0),
  peakReachedAt: integer("peak_reached_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const countSnapshot = sqliteTable(
  "count_snapshot",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tag: text("tag").notNull(),
    sessions: integer("sessions").notNull(),
    online: integer("online").notNull(),
    away: integer("away").notNull(),
    timestamp: integer("timestamp", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("count_snapshot_tag_timestamp_idx").on(table.tag, table.timestamp)],
);

export const SCHEMAS = {
  presenceEvent,
  presenceTag,
  countSnapshot,
};
