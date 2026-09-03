CREATE TABLE `service_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`state_json` text NOT NULL,
	`customer_token_hash` text NOT NULL,
	`owner_token_hash` text NOT NULL,
	`revision` integer NOT NULL,
	`storage_version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
