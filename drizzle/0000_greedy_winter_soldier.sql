CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`anonymous_id` text,
	`event_name` text NOT NULL,
	`level` integer,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_events_name_idx` ON `analytics_events` (`event_name`,`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_user_idx` ON `analytics_events` (`user_id`);--> statement-breakpoint
CREATE TABLE `challenge_scores` (
	`challenge_id` text NOT NULL,
	`user_id` text NOT NULL,
	`time_ms` integer NOT NULL,
	`transfer_count` integer DEFAULT 0 NOT NULL,
	`run_proof` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`challenge_id`, `user_id`),
	FOREIGN KEY (`challenge_id`) REFERENCES `weekly_challenges`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `challenge_scores_rank_idx` ON `challenge_scores` (`challenge_id`,`time_ms`);--> statement-breakpoint
CREATE TABLE `inventory` (
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`source` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`acquired_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `item_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `level_progress` (
	`user_id` text NOT NULL,
	`level_id` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`best_time_remaining_ms` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `level_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `level_progress_user_idx` ON `level_progress` (`user_id`);--> statement-breakpoint
CREATE TABLE `login_codes` (
	`nonce` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`telegram_id` text,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `login_codes_expires_idx` ON `login_codes` (`expires_at`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_charge_id` text NOT NULL,
	`item_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_provider_charge_id_unique` ON `orders` (`provider_charge_id`);--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`inviter_user_id` text NOT NULL,
	`invitee_user_id` text NOT NULL,
	`status` text DEFAULT 'rewarded' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`inviter_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invitee_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referrals_invitee_unique` ON `referrals` (`invitee_user_id`);--> statement-breakpoint
CREATE INDEX `referrals_inviter_idx` ON `referrals` (`inviter_user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`telegram_id` text NOT NULL,
	`username` text,
	`display_name` text NOT NULL,
	`photo_url` text,
	`locale` text DEFAULT 'uz' NOT NULL,
	`referral_code` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_telegram_id_unique` ON `users` (`telegram_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_referral_code_unique` ON `users` (`referral_code`);--> statement-breakpoint
CREATE TABLE `weekly_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`level` integer NOT NULL,
	`seed` integer NOT NULL,
	`modifier` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`reward_item_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `weekly_challenges_window_idx` ON `weekly_challenges` (`starts_at`,`ends_at`);