CREATE TABLE `method_metadata` (
	`method_id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
