import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const app = sqliteTable(
	"app",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		publicKey: text("public_key").notNull().unique(),
		description: text("description"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(table) => [
		index("app_user_id_idx").on(table.userId),
		index("app_created_at_idx").on(table.createdAt),
	],
);
