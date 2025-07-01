import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const app = sqliteTable("app", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	publicKey: text("public_key").notNull().unique(),
	description: text("description"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const presenceEvent = sqliteTable("presence_event", {
	id: text("id").primaryKey(),
	appId: text("app_id")
		.notNull()
		.references(() => app.id),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	eventType: text("event_type").notNull(), // 'online', 'offline', 'away', 'busy'
	metadata: text("metadata"), // JSON string for additional data
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const presenceSession = sqliteTable("presence_session", {
	id: text("id").primaryKey(),
	appId: text("app_id")
		.notNull()
		.references(() => app.id),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	sessionId: text("session_id").notNull(),
	status: text("status").notNull(), // 'online', 'offline', 'away', 'busy'
	lastSeen: integer("last_seen", { mode: "timestamp" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
