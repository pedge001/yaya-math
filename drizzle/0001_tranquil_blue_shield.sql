CREATE TABLE `leaderboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`initials` varchar(3) NOT NULL,
	`score` int NOT NULL,
	`totalProblems` int NOT NULL,
	`operations` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leaderboard_id` PRIMARY KEY(`id`)
);
