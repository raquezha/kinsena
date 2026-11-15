-- Pay rule support: holidays, pay-date overrides, and a JSON pay_rule on settings.
-- Official holiday sources are documented in src/lib/server/data/holiday-seed.ts.

CREATE TABLE `holidays` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text(32) NOT NULL,
	`name` text(128) NOT NULL,
	`kind` text(32) NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `holidays_date_name_idx` ON `holidays` (`date`, `name`);
--> statement-breakpoint
CREATE TABLE `pay_date_overrides` (
	`scheduled_date` text(32) PRIMARY KEY NOT NULL,
	`pay_date` text(32) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `settings` ADD `pay_rule` text;
--> statement-breakpoint
INSERT INTO `holidays` (`date`, `name`, `kind`, `created_at`) VALUES
	('2026-01-01', 'New Year''s Day', 'NATIONAL', 1794760000000),
	('2026-04-02', 'Maundy Thursday', 'NATIONAL', 1794760000000),
	('2026-04-03', 'Good Friday', 'NATIONAL', 1794760000000),
	('2026-04-09', 'Araw ng Kagitingan', 'NATIONAL', 1794760000000),
	('2026-05-01', 'Labor Day', 'NATIONAL', 1794760000000),
	('2026-06-12', 'Independence Day', 'NATIONAL', 1794760000000),
	('2026-08-31', 'National Heroes Day', 'NATIONAL', 1794760000000),
	('2026-11-30', 'Bonifacio Day', 'NATIONAL', 1794760000000),
	('2026-12-25', 'Christmas Day', 'NATIONAL', 1794760000000),
	('2026-12-30', 'Rizal Day', 'NATIONAL', 1794760000000),
	('2026-08-21', 'Ninoy Aquino Day', 'NATIONAL', 1794760000000),
	('2026-11-01', 'All Saints'' Day', 'NATIONAL', 1794760000000),
	('2026-12-08', 'Feast of the Immaculate Conception of Mary', 'NATIONAL', 1794760000000),
	('2026-12-31', 'Last Day of the Year', 'NATIONAL', 1794760000000),
	('2026-02-17', 'Chinese New Year', 'NATIONAL', 1794760000000),
	('2026-04-04', 'Black Saturday', 'NATIONAL', 1794760000000),
	('2026-11-02', 'All Souls'' Day', 'NATIONAL', 1794760000000),
	('2026-12-24', 'Christmas Eve', 'NATIONAL', 1794760000000),
	('2027-01-01', 'New Year''s Day', 'NATIONAL', 1794760000000),
	('2027-03-25', 'Maundy Thursday', 'NATIONAL', 1794760000000),
	('2027-03-26', 'Good Friday', 'NATIONAL', 1794760000000),
	('2027-04-09', 'Araw ng Kagitingan', 'NATIONAL', 1794760000000),
	('2027-05-01', 'Labor Day', 'NATIONAL', 1794760000000),
	('2027-06-12', 'Independence Day', 'NATIONAL', 1794760000000),
	('2027-08-30', 'National Heroes Day', 'NATIONAL', 1794760000000),
	('2027-11-30', 'Bonifacio Day', 'NATIONAL', 1794760000000),
	('2027-12-25', 'Christmas Day', 'NATIONAL', 1794760000000),
	('2027-12-30', 'Rizal Day', 'NATIONAL', 1794760000000),
	('2027-08-21', 'Ninoy Aquino Day', 'NATIONAL', 1794760000000),
	('2027-11-01', 'All Saints'' Day', 'NATIONAL', 1794760000000),
	('2027-12-08', 'Feast of the Immaculate Conception of Mary', 'NATIONAL', 1794760000000),
	('2027-12-31', 'Last Day of the Year', 'NATIONAL', 1794760000000),
	('2027-02-06', 'Chinese New Year', 'NATIONAL', 1794760000000),
	('2027-03-27', 'Black Saturday', 'NATIONAL', 1794760000000),
	('2027-11-02', 'All Souls'' Day', 'NATIONAL', 1794760000000),
	('2027-12-24', 'Christmas Eve', 'NATIONAL', 1794760000000);
