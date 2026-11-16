CREATE TABLE `activity_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`action` text NOT NULL,
	`payday_id` integer,
	`entity_type` text NOT NULL,
	`entity_id` integer,
	`summary` text NOT NULL
);--> statement-breakpoint
CREATE INDEX `activity_events_created_at_idx` ON `activity_events` (`created_at`);
