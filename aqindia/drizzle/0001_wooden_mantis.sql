CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(50) NOT NULL,
	`encryptedKey` text NOT NULL,
	`label` varchar(100),
	`isActive` boolean DEFAULT true,
	`usageCount` int DEFAULT 0,
	`lastUsed` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`reportType` varchar(50) NOT NULL,
	`cityIds` text,
	`dateRange` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cityId` varchar(50) NOT NULL,
	`threshold` int NOT NULL,
	`isActive` boolean DEFAULT true,
	`lastTriggered` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `favoriteCities` text;--> statement-breakpoint
ALTER TABLE `users` ADD `alertThreshold` int DEFAULT 150;--> statement-breakpoint
ALTER TABLE `users` ADD `preferredRegion` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `language` varchar(10) DEFAULT 'en';