CREATE TABLE `count_snapshot` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tag` text NOT NULL,
	`sessions` integer NOT NULL,
	`online` integer NOT NULL,
	`away` integer NOT NULL,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `count_snapshot_tag_timestamp_idx` ON `count_snapshot` (`tag`,`timestamp`);
