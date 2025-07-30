CREATE TABLE `presence_event` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`tag` text NOT NULL,
	`status` text,
	`session_id` text NOT NULL,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	`user_agent` text,
	`duration` integer
);
--> statement-breakpoint
CREATE INDEX `presence_event_tag_idx` ON `presence_event` (`tag`);--> statement-breakpoint
CREATE INDEX `presence_event_timestamp_idx` ON `presence_event` (`timestamp`);--> statement-breakpoint
CREATE INDEX `presence_event_session_id_idx` ON `presence_event` (`session_id`);--> statement-breakpoint
CREATE INDEX `presence_event_tag_timestamp_idx` ON `presence_event` (`tag`,`timestamp`);--> statement-breakpoint
CREATE INDEX `presence_event_status_timestamp_idx` ON `presence_event` (`status`,`timestamp`);--> statement-breakpoint
CREATE TABLE `presence_tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`total_updates` integer DEFAULT 0 NOT NULL,
	`peak_concurrent_connections` integer DEFAULT 0 NOT NULL,
	`peak_reached_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
