CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(60) NOT NULL,
	`entityId` varchar(120),
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`targetType` enum('recipe','comment','attempt','user') NOT NULL,
	`targetId` int NOT NULL,
	`reason` varchar(80) NOT NULL,
	`details` varchar(800),
	`status` enum('pending','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate_limit_buckets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bucketKey` varchar(220) NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	`resetAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rate_limit_buckets_id` PRIMARY KEY(`id`),
	CONSTRAINT `rate_limit_buckets_bucketKey_unique` UNIQUE(`bucketKey`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `accountStatus` enum('active','suspended','deleted') DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE INDEX `audit_logs_actor_idx` ON `audit_logs` (`actorId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entityType`,`entityId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `content_reports_status_idx` ON `content_reports` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `content_reports_target_idx` ON `content_reports` (`targetType`,`targetId`);