CREATE TABLE `recipe_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countryCode` varchar(8) NOT NULL,
	`name` varchar(80) NOT NULL,
	`authorId` int NOT NULL,
	`status` enum('active','hidden') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recipe_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `recipe_groups_country_name_idx` UNIQUE(`countryCode`,`name`)
);
--> statement-breakpoint
CREATE INDEX `recipe_groups_country_created_idx` ON `recipe_groups` (`countryCode`,`createdAt`);--> statement-breakpoint
CREATE INDEX `recipe_groups_author_idx` ON `recipe_groups` (`authorId`);