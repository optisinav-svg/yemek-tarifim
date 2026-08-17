CREATE TABLE `recipe_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipeId` int NOT NULL,
	`authorId` int NOT NULL,
	`caption` varchar(600),
	`imageUrl` text NOT NULL,
	`imageMimeType` varchar(120) NOT NULL,
	`status` enum('visible','hidden') NOT NULL DEFAULT 'visible',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recipe_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recipe_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipeId` int NOT NULL,
	`authorId` int NOT NULL,
	`body` varchar(1200) NOT NULL,
	`status` enum('visible','hidden') NOT NULL DEFAULT 'visible',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recipe_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `recipe_attempts_recipe_created_idx` ON `recipe_attempts` (`recipeId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `recipe_attempts_author_idx` ON `recipe_attempts` (`authorId`);--> statement-breakpoint
CREATE INDEX `recipe_comments_recipe_created_idx` ON `recipe_comments` (`recipeId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `recipe_comments_author_idx` ON `recipe_comments` (`authorId`);