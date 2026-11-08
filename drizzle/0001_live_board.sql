CREATE TABLE `board` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`context` text DEFAULT '' NOT NULL,
	`sections` text NOT NULL,
	`plan_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `board_comment` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`board_id` text NOT NULL,
	`author` text DEFAULT '' NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `board_comment_board_idx` ON `board_comment` (`board_id`);--> statement-breakpoint
CREATE TABLE `board_item` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`section_id` text NOT NULL,
	`kind` text NOT NULL,
	`object_key` text,
	`content_type` text,
	`text` text DEFAULT '' NOT NULL,
	`author` text DEFAULT '' NOT NULL,
	`width` integer,
	`height` integer,
	`created_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `board_item_board_idx` ON `board_item` (`board_id`);