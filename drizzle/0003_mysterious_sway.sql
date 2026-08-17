CREATE TABLE `recipe_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipeId` int NOT NULL,
	`authorId` int NOT NULL,
	`mediaType` enum('image','video') NOT NULL,
	`url` text NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recipe_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `recipe_media_recipe_idx` ON `recipe_media` (`recipeId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `recipe_media_author_idx` ON `recipe_media` (`authorId`);