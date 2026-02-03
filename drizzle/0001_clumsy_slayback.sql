CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`milestoneId` int NOT NULL,
	`projectId` int NOT NULL,
	`approverId` int NOT NULL,
	`status` enum('approved','rejected') NOT NULL,
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditTrail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`action` varchar(255) NOT NULL,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditTrail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`milestoneId` int NOT NULL,
	`templateId` int NOT NULL,
	`data` json NOT NULL,
	`submittedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `formSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`fields` json NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `formTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`milestoneId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`s3Url` varchar(1000) NOT NULL,
	`fileType` varchar(100),
	`fileSize` int,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`stage` int NOT NULL,
	`status` enum('pending','in_progress','completed','rejected') NOT NULL DEFAULT 'pending',
	`approverRole` enum('brand_manager','ppic_manager','production_manager','purchasing_manager','sales_manager','pr_manager','director') NOT NULL,
	`isViewOnly` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`sku` varchar(100),
	`pafSequence` varchar(100),
	`mafSequence` varchar(100),
	`isOem` boolean NOT NULL DEFAULT false,
	`status` enum('pending','in_progress','completed','discontinued') NOT NULL DEFAULT 'pending',
	`currentStage` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_sku_unique` UNIQUE(`sku`),
	CONSTRAINT `projects_pafSequence_unique` UNIQUE(`pafSequence`),
	CONSTRAINT `projects_mafSequence_unique` UNIQUE(`mafSequence`)
);
--> statement-breakpoint
CREATE TABLE `sequenceConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('sku','paf','maf') NOT NULL,
	`prefix` varchar(50) NOT NULL DEFAULT '',
	`suffix` varchar(50) NOT NULL DEFAULT '',
	`currentNumber` int NOT NULL DEFAULT 1,
	`maxPerMonth` int,
	`resetFrequency` enum('monthly','yearly','never') NOT NULL DEFAULT 'never',
	`lastReset` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sequenceConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `sequenceConfig_type_unique` UNIQUE(`type`)
);
--> statement-breakpoint
CREATE TABLE `sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('sku','paf','maf') NOT NULL,
	`sequence` varchar(100) NOT NULL,
	`projectId` int,
	`generatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sequences_id` PRIMARY KEY(`id`),
	CONSTRAINT `sequences_sequence_unique` UNIQUE(`sequence`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','brand_manager','ppic_manager','production_manager','purchasing_manager','sales_manager','pr_manager','director') NOT NULL DEFAULT 'brand_manager';--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;