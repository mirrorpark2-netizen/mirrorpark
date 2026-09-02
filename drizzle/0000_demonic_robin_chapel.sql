CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`discord` text NOT NULL,
	`game_id` text NOT NULL,
	`game_name` text NOT NULL,
	`mobile` text NOT NULL,
	`cid` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_at` text NOT NULL,
	`assigned_role` text DEFAULT 'Mechanic' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`week` text DEFAULT '0h 00m' NOT NULL,
	`month` text DEFAULT '0h 00m' NOT NULL,
	`status` text DEFAULT 'Off duty' NOT NULL,
	`initials` text NOT NULL,
	`invoices` integer DEFAULT 0 NOT NULL,
	`discord` text,
	`game_id` text,
	`mobile` text,
	`cid` text
);
