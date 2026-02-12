CREATE TABLE `speed_leaderboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`initials` varchar(3) NOT NULL,
	`completionTime` int NOT NULL,
	`totalProblems` int NOT NULL,
	`operation` enum('addition','subtraction','multiplication','division') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `speed_leaderboard_id` PRIMARY KEY(`id`)
);
