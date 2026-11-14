-- IF NOT EXISTS lets databases created by Kinsena 0.1 adopt this baseline unchanged.
CREATE TABLE IF NOT EXISTS `cycle_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cycle_id` integer NOT NULL,
	`name` text(128) NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`amount_expr` text(256),
	`is_done` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`cycle_id`) REFERENCES `cycles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `cycles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text(128) NOT NULL,
	`date` text(32) NOT NULL,
	`salary` integer,
	`note` text,
	`is_closed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`currency` text(3) DEFAULT 'PHP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `template_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(128) NOT NULL,
	`default_amount` integer,
	`cadence` text(32) DEFAULT 'ANY' NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
