ALTER TABLE `users` ADD `surname` text;--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerifyCode` varchar(12);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetToken` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetExpires` timestamp;