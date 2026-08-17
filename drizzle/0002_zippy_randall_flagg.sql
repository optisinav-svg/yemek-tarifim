CREATE TABLE `saved_recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recipeKey` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_recipes_id` PRIMARY KEY(`id`),
	CONSTRAINT `saved_recipes_user_recipe_idx` UNIQUE(`userId`,`recipeKey`)
);
--> statement-breakpoint
CREATE TABLE `shopping_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemKey` varchar(160) NOT NULL,
	`name` varchar(160) NOT NULL,
	`amount` varchar(80) NOT NULL,
	`checked` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopping_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `shopping_items_user_item_idx` UNIQUE(`userId`,`itemKey`)
);
--> statement-breakpoint
CREATE INDEX `saved_recipes_user_idx` ON `saved_recipes` (`userId`);--> statement-breakpoint
CREATE INDEX `shopping_items_user_idx` ON `shopping_items` (`userId`);