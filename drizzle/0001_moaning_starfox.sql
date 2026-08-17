CREATE TABLE `recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`countryCode` varchar(8) NOT NULL DEFAULT 'TR',
	`category` varchar(80) NOT NULL,
	`title` varchar(180) NOT NULL,
	`summary` text,
	`imageUrl` text,
	`servings` int NOT NULL DEFAULT 4,
	`prepMinutes` int NOT NULL DEFAULT 0,
	`cookMinutes` int NOT NULL DEFAULT 0,
	`ingredientsJson` text NOT NULL,
	`stepsJson` text NOT NULL,
	`status` enum('published','hidden') NOT NULL DEFAULT 'published',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recipes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `recipes_country_category_idx` ON `recipes` (`countryCode`,`category`);--> statement-breakpoint
CREATE INDEX `recipes_author_idx` ON `recipes` (`authorId`);--> statement-breakpoint
CREATE INDEX `recipes_status_created_idx` ON `recipes` (`status`,`createdAt`);