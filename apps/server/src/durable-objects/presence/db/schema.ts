import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Timeseries table to track all presence update events
export const presenceEvent = sqliteTable(
	"presence_event",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		type: text("type", { enum: ["update", "connect", "disconnect"] }).notNull(),
		tag: text("tag"),
		status: text("status", { enum: ["online", "away"] }),
		sessionId: text("session_id").notNull(), // WebSocket connection identifier
		timestamp: integer("timestamp", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		// Optional metadata for analytics
		userAgent: text("user_agent"),
		duration: integer("duration"), // How long the session lasted (in seconds)
	},
	(table) => [
		// Primary indexes for common queries
		index("presence_event_tag_idx").on(table.tag),
		index("presence_event_timestamp_idx").on(table.timestamp),
		index("presence_event_session_id_idx").on(table.sessionId),
		// Composite indexes for analytics
		index("presence_event_tag_timestamp_idx").on(table.tag, table.timestamp),
		index("presence_event_status_timestamp_idx").on(
			table.status,
			table.timestamp,
		),
	],
);

// Tags analytics table to store aggregated tag information
export const presenceTag = sqliteTable("presence_tag", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
	totalUpdates: integer("total_updates").notNull().default(0),
	peakConcurrentConnections: integer("peak_concurrent_connections")
		.notNull()
		.default(0),
	peakReachedAt: integer("peak_reached_at", { mode: "timestamp" }),
	// Additional metadata
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const SCHEMAS = {
	presenceEvent,
	presenceTag,
};
