-- =====================================================
-- Drop all old tables
-- =====================================================
DROP TABLE IF EXISTS `sequences`;
DROP TABLE IF EXISTS `sequenceConfig`;
DROP TABLE IF EXISTS `auditTrail`;
DROP TABLE IF EXISTS `approvals`;
DROP TABLE IF EXISTS `downloadableTemplates`;
DROP TABLE IF EXISTS `formSubmissions`;
DROP TABLE IF EXISTS `formTemplates`;
DROP TABLE IF EXISTS `forms`;
DROP TABLE IF EXISTS `milestones`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `users`;

-- =====================================================
-- Create new MAF PR workflow tables
-- =====================================================

-- Users table
CREATE TABLE `users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `cognito_sub` varchar(255) NOT NULL UNIQUE,
  `open_id` varchar(64) NOT NULL UNIQUE,
  `email` varchar(255) NOT NULL UNIQUE,
  `full_name` varchar(255) NOT NULL,
  `department` varchar(100),
  `role` enum('CEO', 'COO', 'CFO', 'PPIC', 'Purchasing', 'GA', 'Finance', 'Production', 'Logistics', 'admin') NOT NULL DEFAULT 'PPIC',
  `cognito_groups` json,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` timestamp NULL,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_cognito_sub` (`cognito_sub`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_is_active` (`is_active`)
);

-- Workflows table
CREATE TABLE `workflows` (
  `id` varchar(36) PRIMARY KEY,
  `workflow_number` varchar(50) NOT NULL UNIQUE,
  `workflow_type` enum('MAF', 'PR') NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text,
  `requester_id` int NOT NULL,
  `department` varchar(100) NOT NULL,
  `estimated_amount` decimal(15,2),
  `currency` varchar(3) DEFAULT 'IDR',
  `requires_ga` boolean DEFAULT false,
  `requires_ppic` boolean DEFAULT false,
  `current_stage` varchar(100),
  `overall_status` enum('draft', 'in_progress', 'completed', 'rejected', 'cancelled') NOT NULL DEFAULT 'draft',
  `submitted_at` timestamp NULL,
  `completed_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `metadata` json DEFAULT ('{}'),
  INDEX `idx_workflows_number` (`workflow_number`),
  INDEX `idx_workflows_type` (`workflow_type`),
  INDEX `idx_workflows_requester` (`requester_id`),
  INDEX `idx_workflows_status` (`overall_status`),
  INDEX `idx_workflows_submitted` (`submitted_at`),
  INDEX `idx_workflows_current_stage` (`current_stage`)
);

-- Workflow stages table
CREATE TABLE `workflow_stages` (
  `id` varchar(36) PRIMARY KEY,
  `workflow_id` varchar(36) NOT NULL,
  `stage_order` int NOT NULL,
  `stage_name` varchar(100) NOT NULL,
  `stage_type` varchar(50) NOT NULL,
  `required_role` varchar(50),
  `requires_one_of` json,
  `approval_threshold` decimal(15,2),
  `status` enum('pending', 'in_progress', 'completed', 'rejected', 'skipped') NOT NULL DEFAULT 'pending',
  `started_at` timestamp NULL,
  `completed_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `metadata` json DEFAULT ('{}'),
  INDEX `idx_stages_workflow` (`workflow_id`),
  INDEX `idx_stages_status` (`status`),
  INDEX `idx_stages_order` (`workflow_id`, `stage_order`),
  UNIQUE KEY `unique_workflow_stage` (`workflow_id`, `stage_order`)
);

-- Workflow approvals table
CREATE TABLE `workflow_approvals` (
  `id` varchar(36) PRIMARY KEY,
  `workflow_id` varchar(36) NOT NULL,
  `stage_id` varchar(36) NOT NULL,
  `approver_id` int NOT NULL,
  `approver_role` varchar(50) NOT NULL,
  `action` enum('approved', 'rejected', 'commented') NOT NULL,
  `comments` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metadata` json DEFAULT ('{}'),
  INDEX `idx_approvals_workflow` (`workflow_id`),
  INDEX `idx_approvals_stage` (`stage_id`),
  INDEX `idx_approvals_approver` (`approver_id`),
  INDEX `idx_approvals_action` (`action`),
  INDEX `idx_approvals_created` (`created_at`)
);

-- Workflow files table
CREATE TABLE `workflow_files` (
  `id` varchar(36) PRIMARY KEY,
  `workflow_id` varchar(36) NOT NULL,
  `stage_id` varchar(36),
  `file_name` varchar(500) NOT NULL,
  `file_type` varchar(50) NOT NULL,
  `file_category` varchar(50),
  `s3_bucket` varchar(255) NOT NULL,
  `s3_key` varchar(1000) NOT NULL,
  `s3_url` text,
  `file_size` bigint,
  `mime_type` varchar(100),
  `uploaded_by` int NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metadata` json DEFAULT ('{}'),
  INDEX `idx_files_workflow` (`workflow_id`),
  INDEX `idx_files_stage` (`stage_id`),
  INDEX `idx_files_type` (`file_type`),
  INDEX `idx_files_uploader` (`uploaded_by`),
  INDEX `idx_files_s3_key` (`s3_key`(255))
);

-- Workflow comments table
CREATE TABLE `workflow_comments` (
  `id` varchar(36) PRIMARY KEY,
  `workflow_id` varchar(36) NOT NULL,
  `stage_id` varchar(36),
  `comment_text` text NOT NULL,
  `comment_type` varchar(50) DEFAULT 'general',
  `author_id` int NOT NULL,
  `author_role` varchar(50),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `metadata` json DEFAULT ('{}'),
  INDEX `idx_comments_workflow` (`workflow_id`),
  INDEX `idx_comments_stage` (`stage_id`),
  INDEX `idx_comments_author` (`author_id`),
  INDEX `idx_comments_created` (`created_at`)
);

-- Audit logs table
CREATE TABLE `audit_logs` (
  `id` varchar(36) PRIMARY KEY,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` varchar(36) NOT NULL,
  `action` varchar(100) NOT NULL,
  `action_description` text,
  `actor_id` int,
  `actor_email` varchar(255),
  `actor_role` varchar(50),
  `old_values` json,
  `new_values` json,
  `ip_address` varchar(45),
  `user_agent` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metadata` json DEFAULT ('{}'),
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
  INDEX `idx_audit_actor` (`actor_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_created` (`created_at`)
);

-- Email recipients table
CREATE TABLE `email_recipients` (
  `id` varchar(36) PRIMARY KEY,
  `recipient_group` varchar(100) NOT NULL,
  `user_id` int,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255),
  `is_active` boolean DEFAULT true,
  `notification_types` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_group_email` (`recipient_group`, `email`)
);

-- Sequence counters table
CREATE TABLE `sequence_counters` (
  `id` varchar(36) PRIMARY KEY,
  `sequence_type` enum('MAF', 'PR') NOT NULL,
  `sequence_date` varchar(10) NOT NULL,
  `current_counter` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_type_date` (`sequence_type`, `sequence_date`),
  INDEX `idx_sequence_type_date` (`sequence_type`, `sequence_date`)
);

-- =====================================================
-- Insert default email recipient groups
-- =====================================================
INSERT INTO `email_recipients` (`id`, `recipient_group`, `email`, `full_name`, `is_active`, `notification_types`)
VALUES 
  (UUID(), 'ceo_coo', 'ceo@compawnion.co', 'CEO', true, JSON_ARRAY('approval_request', 'approval_granted', 'workflow_stuck')),
  (UUID(), 'ceo_coo', 'coo@compawnion.co', 'COO', true, JSON_ARRAY('approval_request', 'approval_granted', 'workflow_stuck')),
  (UUID(), 'finance', 'cfo@compawnion.co', 'CFO', true, JSON_ARRAY('approval_request', 'approval_granted', 'workflow_stuck')),
  (UUID(), 'ppic', 'ppic@compawnion.co', 'PPIC Team', true, JSON_ARRAY('approval_request', 'approval_granted')),
  (UUID(), 'purchasing', 'purchasing@compawnion.co', 'Purchasing Team', true, JSON_ARRAY('approval_request', 'approval_granted')),
  (UUID(), 'ga', 'ga@compawnion.co', 'GA Team', true, JSON_ARRAY('approval_request', 'approval_granted'));
