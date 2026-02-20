import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal, bigint } from "drizzle-orm/mysql-core";

/**
 * =====================================================
 * USERS TABLE
 * Synced from AWS Cognito
 * =====================================================
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  // Cognito integration
  cognitoSub: varchar("cognito_sub", { length: 255 }).notNull().unique(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(), // For Manus compatibility
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  
  // Organization info
  department: varchar("department", { length: 100 }),
  role: mysqlEnum("role", [
    "CEO",
    "COO",
    "CFO",
    "PPIC",
    "Purchasing",
    "GA",
    "Finance",
    "Production",
    "Logistics",
    "admin"
  ]).default("PPIC").notNull(),
  
  // Cognito groups stored as JSON array
  cognitoGroups: json("cognito_groups").$type<string[]>(),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * =====================================================
 * WORKFLOWS TABLE
 * Main workflow records (MAF, PR)
 * =====================================================
 */
export const workflows = mysqlTable("workflows", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID as string
  workflowNumber: varchar("workflow_number", { length: 50 }).notNull().unique(), // WFMT-MAF-260209-001
  workflowType: mysqlEnum("workflow_type", ["MAF", "PR"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  
  // Requester information
  requesterId: int("requester_id").notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  
  // Financial information
  estimatedAmount: decimal("estimated_amount", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("IDR"),
  
  // Routing flags
  requiresGa: boolean("requires_ga").default(false),
  requiresPpic: boolean("requires_ppic").default(false),
  
  // Workflow status
  currentStage: varchar("current_stage", { length: 100 }),
  overallStatus: mysqlEnum("overall_status", [
    "draft",
    "in_progress",
    "completed",
    "rejected",
    "cancelled"
  ]).default("draft").notNull(),
  
  // Timestamps
  submittedAt: timestamp("submitted_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

/**
 * =====================================================
 * WORKFLOW_STAGES TABLE
 * Track each approval stage with full history
 * =====================================================
 */
export const workflowStages = mysqlTable("workflow_stages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  workflowId: varchar("workflow_id", { length: 36 }).notNull(),
  
  // Stage information
  stageOrder: int("stage_order").notNull(),
  stageName: varchar("stage_name", { length: 100 }).notNull(),
  stageType: varchar("stage_type", { length: 50 }).notNull(), // "ceo_coo", "ppic", "purchasing", etc.
  
  // Approval requirements
  requiredRole: varchar("required_role", { length: 50 }),
  requiresOneOf: json("requires_one_of").$type<string[]>(), // For CEO/COO: ['CEO', 'COO']
  approvalThreshold: decimal("approval_threshold", { precision: 15, scale: 2 }),
  
  // Stage status
  status: mysqlEnum("status", [
    "pending",
    "in_progress",
    "completed",
    "rejected",
    "skipped"
  ]).default("pending").notNull(),
  
  // Timestamps
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
});

export type WorkflowStage = typeof workflowStages.$inferSelect;
export type InsertWorkflowStage = typeof workflowStages.$inferInsert;

/**
 * =====================================================
 * WORKFLOW_APPROVALS TABLE
 * Record all approval/rejection actions
 * =====================================================
 */
export const workflowApprovals = mysqlTable("workflow_approvals", {
  id: varchar("id", { length: 36 }).primaryKey(),
  workflowId: varchar("workflow_id", { length: 36 }).notNull(),
  stageId: varchar("stage_id", { length: 36 }).notNull(),
  
  // Approver information
  approverId: int("approver_id").notNull(),
  approverRole: varchar("approver_role", { length: 50 }).notNull(),
  
  // Action details
  action: mysqlEnum("action", ["approved", "rejected", "commented"]).notNull(),
  comments: text("comments"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
});

export type WorkflowApproval = typeof workflowApprovals.$inferSelect;
export type InsertWorkflowApproval = typeof workflowApprovals.$inferInsert;

/**
 * =====================================================
 * WORKFLOW_FILES TABLE
 * Store S3 file references
 * =====================================================
 */
export const workflowFiles = mysqlTable("workflow_files", {
  id: varchar("id", { length: 36 }).primaryKey(),
  workflowId: varchar("workflow_id", { length: 36 }).notNull(),
  stageId: varchar("stage_id", { length: 36 }),
  
  // File information
  fileName: varchar("file_name", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // "maf_form", "pr_form", "forecast", etc.
  fileCategory: varchar("file_category", { length: 50 }), // "submission", "approval", "supporting"
  
  // S3 storage
  s3Bucket: varchar("s3_bucket", { length: 255 }).notNull(),
  s3Key: varchar("s3_key", { length: 1000 }).notNull(),
  s3Url: text("s3_url"),
  
  // File metadata
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: varchar("mime_type", { length: 100 }),
  
  // Upload information
  uploadedBy: int("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
});

export type WorkflowFile = typeof workflowFiles.$inferSelect;
export type InsertWorkflowFile = typeof workflowFiles.$inferInsert;

/**
 * =====================================================
 * WORKFLOW_COMMENTS TABLE
 * Comments and feedback throughout workflow
 * =====================================================
 */
export const workflowComments = mysqlTable("workflow_comments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  workflowId: varchar("workflow_id", { length: 36 }).notNull(),
  stageId: varchar("stage_id", { length: 36 }),
  
  // Comment details
  commentText: text("comment_text").notNull(),
  commentType: varchar("comment_type", { length: 50 }).default("general"), // "general", "approval", "rejection", "revision_request"
  
  // Author information
  authorId: int("author_id").notNull(),
  authorRole: varchar("author_role", { length: 50 }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
});

export type WorkflowComment = typeof workflowComments.$inferSelect;
export type InsertWorkflowComment = typeof workflowComments.$inferInsert;

/**
 * =====================================================
 * AUDIT_LOGS TABLE
 * Complete audit trail of all actions
 * =====================================================
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  
  // Entity information
  entityType: varchar("entity_type", { length: 50 }).notNull(), // "workflow", "stage", "approval", "file", "user"
  entityId: varchar("entity_id", { length: 36 }).notNull(),
  
  // Action details
  action: varchar("action", { length: 100 }).notNull(), // "created", "updated", "approved", "rejected", etc.
  actionDescription: text("action_description"),
  
  // Actor information
  actorId: int("actor_id"),
  actorEmail: varchar("actor_email", { length: 255 }),
  actorRole: varchar("actor_role", { length: 50 }),
  
  // Changes tracking
  oldValues: json("old_values").$type<Record<string, any>>(),
  newValues: json("new_values").$type<Record<string, any>>(),
  
  // Request metadata
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 max length
  userAgent: text("user_agent"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * =====================================================
 * EMAIL_RECIPIENTS TABLE
 * Configurable email notification lists
 * =====================================================
 */
export const emailRecipients = mysqlTable("email_recipients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  
  // Recipient grouping
  recipientGroup: varchar("recipient_group", { length: 100 }).notNull(), // "ceo_coo", "finance", "ppic", etc.
  
  // Recipient information
  userId: int("user_id"),
  email: varchar("email", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }),
  
  // Notification preferences
  isActive: boolean("is_active").default(true),
  notificationTypes: json("notification_types").$type<string[]>(), // ["approval_request", "approval_granted", etc.]
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type EmailRecipient = typeof emailRecipients.$inferSelect;
export type InsertEmailRecipient = typeof emailRecipients.$inferInsert;

/**
 * =====================================================
 * SEQUENCE_COUNTERS TABLE
 * Generate WFMT sequence numbers
 * =====================================================
 */
export const sequenceCounters = mysqlTable("sequence_counters", {
  id: varchar("id", { length: 36 }).primaryKey(),
  
  // Sequence identification
  sequenceType: mysqlEnum("sequence_type", ["MAF", "PR"]).notNull(),
  sequenceDate: varchar("sequence_date", { length: 10 }).notNull(), // YYYY-MM-DD format
  
  // Counter
  currentCounter: int("current_counter").default(0).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SequenceCounter = typeof sequenceCounters.$inferSelect;
export type InsertSequenceCounter = typeof sequenceCounters.$inferInsert;
