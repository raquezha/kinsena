ALTER TABLE `template_items` ADD `installment_count` integer;--> statement-breakpoint
ALTER TABLE `template_items` ADD `installments_completed` integer DEFAULT 0 NOT NULL;
