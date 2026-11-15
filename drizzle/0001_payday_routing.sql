CREATE TABLE `destinations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(128) NOT NULL,
	`kind` text(32) NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `paydays` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text(128) NOT NULL,
	`cadence` text(32) NOT NULL,
	`scheduled_date` text(32) NOT NULL,
	`pay_date` text(32) NOT NULL,
	`expected_amount` integer,
	`received_amount` integer,
	`received_at` text(32),
	`note` text,
	`is_closed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `route_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payday_id` integer,
	`destination_id` integer,
	`name` text(128) NOT NULL,
	`full_amount` integer DEFAULT 0 NOT NULL,
	`full_amount_expr` text(256),
	`minimum_amount` integer,
	`chosen_amount` integer DEFAULT 0 NOT NULL,
	`decision` text(32) DEFAULT 'PENDING' NOT NULL,
	`due_date` text(32),
	`is_done` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`template_id` integer,
	FOREIGN KEY (`payday_id`) REFERENCES `paydays`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destination_id`) REFERENCES `destinations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `route_items_payday_id_idx` ON `route_items` (`payday_id`);
--> statement-breakpoint
ALTER TABLE `settings` ADD `mid_month_salary` integer;
--> statement-breakpoint
ALTER TABLE `settings` ADD `month_end_salary` integer;
--> statement-breakpoint
ALTER TABLE `template_items` ADD `due_day` integer;
--> statement-breakpoint
ALTER TABLE `template_items` ADD `fund_from` text(32) DEFAULT 'BEFORE_DUE' NOT NULL;
--> statement-breakpoint
ALTER TABLE `template_items` ADD `destination_id` integer REFERENCES destinations(id);
--> statement-breakpoint
ALTER TABLE `template_items` ADD `minimum_amount` integer;
--> statement-breakpoint
UPDATE `template_items` SET `fund_from` = CASE `cadence`
	WHEN 'MID_MONTH' THEN 'MID_MONTH'
	WHEN 'MONTH_END' THEN 'MONTH_END'
	ELSE 'EVERY'
END;
--> statement-breakpoint
INSERT INTO `paydays` (
	`id`, `title`, `cadence`, `scheduled_date`, `pay_date`,
	`expected_amount`, `received_amount`, `received_at`, `note`, `is_closed`, `created_at`
)
SELECT
	`id`,
	`title`,
	CASE
		WHEN CAST(substr(`date`, 9, 2) AS INTEGER) = 15 THEN 'MID_MONTH'
		WHEN `date` = date(`date`, 'start of month', '+1 month', '-1 day') THEN 'MONTH_END'
		ELSE 'OTHER'
	END,
	`date`,
	`date`,
	`salary`,
	`salary`,
	CASE WHEN `salary` IS NOT NULL THEN `date` ELSE NULL END,
	`note`,
	`is_closed`,
	`created_at`
FROM `cycles`;
--> statement-breakpoint
INSERT INTO `route_items` (
	`id`, `payday_id`, `destination_id`, `name`, `full_amount`, `full_amount_expr`,
	`minimum_amount`, `chosen_amount`, `decision`, `due_date`, `is_done`, `sort_order`, `template_id`
)
SELECT
	`id`,
	`cycle_id`,
	NULL,
	`name`,
	`amount`,
	`amount_expr`,
	NULL,
	CASE WHEN `is_done` THEN `amount` ELSE 0 END,
	CASE WHEN `is_done` THEN 'FULL' ELSE 'PENDING' END,
	NULL,
	`is_done`,
	`sort_order`,
	NULL
FROM `cycle_items`;
--> statement-breakpoint
DROP TABLE `cycle_items`;
--> statement-breakpoint
DROP TABLE `cycles`;
