CREATE TABLE `img` (
	`id` integer PRIMARY KEY NOT NULL,
	`data` blob,
	`timestamp` integer DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scan` (
	`id` integer PRIMARY KEY NOT NULL,
	`data` text,
	`timestamp` integer DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `img_id_unique` ON `img` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `scan_id_unique` ON `scan` (`id`);