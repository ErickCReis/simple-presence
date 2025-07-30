PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_presence_event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`tag` text,
	`status` text,
	`session_id` text NOT NULL,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	`user_agent` text,
	`duration` integer
);
--> statement-breakpoint
INSERT INTO `__new_presence_event`("id", "type", "tag", "status", "session_id", "timestamp", "user_agent", "duration") SELECT "id", "type", "tag", "status", "session_id", "timestamp", "user_agent", "duration" FROM `presence_event`;--> statement-breakpoint
DROP TABLE `presence_event`;--> statement-breakpoint
ALTER TABLE `__new_presence_event` RENAME TO `presence_event`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `presence_event_tag_idx` ON `presence_event` (`tag`);--> statement-breakpoint
CREATE INDEX `presence_event_timestamp_idx` ON `presence_event` (`timestamp`);--> statement-breakpoint
CREATE INDEX `presence_event_session_id_idx` ON `presence_event` (`session_id`);--> statement-breakpoint
CREATE INDEX `presence_event_tag_timestamp_idx` ON `presence_event` (`tag`,`timestamp`);--> statement-breakpoint
CREATE INDEX `presence_event_status_timestamp_idx` ON `presence_event` (`status`,`timestamp`);