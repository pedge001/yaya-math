ALTER TABLE `leaderboard` ADD `operation` enum('addition','subtraction','multiplication','division') NOT NULL;--> statement-breakpoint
ALTER TABLE `leaderboard` DROP COLUMN `operations`;