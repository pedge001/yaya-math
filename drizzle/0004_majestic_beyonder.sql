CREATE TABLE `daily_challenge_leaderboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`initials` varchar(3) NOT NULL,
	`score` int NOT NULL,
	`totalProblems` int NOT NULL,
	`challengeDate` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_challenge_leaderboard_id` PRIMARY KEY(`id`)
);
