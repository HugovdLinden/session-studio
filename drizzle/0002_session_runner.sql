CREATE TABLE `board_template` (
	`board_id` text NOT NULL,
	`section_id` text NOT NULL,
	`mode` text NOT NULL,
	`data` text NOT NULL,
	`updated_at` text NOT NULL,
	`completed_at` text,
	PRIMARY KEY(`board_id`, `section_id`)
);
--> statement-breakpoint
ALTER TABLE `board` ADD `plan` text;--> statement-breakpoint
ALTER TABLE `board` ADD `current_section` text;--> statement-breakpoint
ALTER TABLE `board` ADD `started_at` text;--> statement-breakpoint
ALTER TABLE `board_item` ADD `file_name` text;