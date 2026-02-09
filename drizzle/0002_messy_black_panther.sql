CREATE TABLE `downloadableTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('MAF','PR','CATTO') NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`s3Url` varchar(1000) NOT NULL,
	`fileType` varchar(100),
	`fileSize` int,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `downloadableTemplates_id` PRIMARY KEY(`id`),
	CONSTRAINT `downloadableTemplates_type_unique` UNIQUE(`type`)
);
