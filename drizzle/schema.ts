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
  
  // Signature for CEO/CFO approval
  signatureUrl: text("signature_url"), // S3 URL to signature image
  
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
  templateId: varchar("template_id", { length: 36 }), // Reference to workflow template used
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
    "cancelled",
    "discontinued",
    "archived"
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
  sequenceType: mysqlEnum("sequence_type", ["MAF", "PR", "CATTO", "SKU", "PAF"]).notNull(),
  sequenceDate: varchar("sequence_date", { length: 10 }).notNull(), // YYYY-MM-DD format
  
  // Counter
  currentCounter: int("current_counter").default(0).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SequenceCounter = typeof sequenceCounters.$inferSelect;
export type InsertSequenceCounter = typeof sequenceCounters.$inferInsert;

/**
 * =====================================================
 * FORM_TEMPLATES TABLE
 * Reusable form templates with configurable fields
 * =====================================================
 */
export const formTemplates = mysqlTable("form_templates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  
  // Template information
  templateName: varchar("template_name", { length: 255 }).notNull(),
  templateCode: varchar("template_code", { length: 50 }).notNull().unique(), // "MAF_FORM", "PR_FORM", etc.
  description: text("description"),
  
  // Form configuration
  fields: json("fields").$type<Array<{
    id: string;
    type: "text" | "number" | "date" | "dropdown" | "textarea" | "file" | "checkbox" | "email";
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[]; // For dropdown
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      message?: string;
    };
    defaultValue?: any;
  }>>().notNull(),
  
  // Template status
  isActive: boolean("is_active").default(true).notNull(),
  version: int("version").default(1).notNull(),
  
  // Creator information
  createdBy: int("created_by").notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
});

export type FormTemplate = typeof formTemplates.$inferSelect;
export type InsertFormTemplate = typeof formTemplates.$inferInsert;

/**
 * =====================================================
 * FORM_SUBMISSIONS TABLE
 * Store submitted form data
 * =====================================================
 */
export const formSubmissions = mysqlTable("form_submissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  
  // Template reference
  templateId: varchar("template_id", { length: 36 }).notNull(),
  workflowId: varchar("workflow_id", { length: 36 }),
  stageId: varchar("stage_id", { length: 36 }),
  
  // Form data
  formData: json("form_data").$type<Record<string, any>>().notNull(),
  
  // Submission information
  submittedBy: int("submitted_by").notNull(),
  submissionStatus: mysqlEnum("submission_status", [
    "draft",
    "submitted",
    "approved",
    "rejected"
  ]).default("draft").notNull(),
  
  // Timestamps
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
});

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = typeof formSubmissions.$inferInsert;

/**
 * =====================================================
 * WORKFLOW_TEMPLATES TABLE
 * Reusable workflow templates with custom stages
 * =====================================================
 */
export const workflowTemplates = mysqlTable("workflow_templates", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  workflowType: varchar("workflow_type", { length: 100 }).notNull(), // Flexible: MAF, PR, Reimbursement, Leave, etc.
  
  // Template status
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(), // One default template per type
  
  // Creator
  createdBy: int("created_by").notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = typeof workflowTemplates.$inferInsert;

/**
 * =====================================================
 * TEMPLATE_STAGES TABLE
 * Configurable stages for workflow templates
 * =====================================================
 */
export const templateStages = mysqlTable("template_stages", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  templateId: varchar("template_id", { length: 36 }).notNull(),
  
  // Stage ordering
  stageOrder: int("stage_order").notNull(),
  
  // Stage information
  stageName: varchar("stage_name", { length: 255 }).notNull(),
  stageDescription: text("stage_description"),
  
  // Department/Role assignment
  department: varchar("department", { length: 100 }),
  requiredRole: varchar("required_role", { length: 50 }),
  requiresOneOf: json("requires_one_of").$type<string[]>(), // Multiple roles allowed (e.g., ['CEO', 'COO'])
  
  // Stage conditions
  approvalRequired: boolean("approval_required").default(true).notNull(),
  fileUploadRequired: boolean("file_upload_required").default(false).notNull(),
  
  // Email notifications
  notificationEmails: json("notification_emails").$type<string[]>(), // Email addresses to notify when stage starts
  
  // Stage visibility control
  visibleToDepartments: json("visible_to_departments").$type<string[]>(), // Departments that can see this stage
  
  // Approval threshold (for amount-based routing)
  approvalThreshold: decimal("approval_threshold", { precision: 15, scale: 2 }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TemplateStage = typeof templateStages.$inferSelect;
export type InsertTemplateStage = typeof templateStages.$inferInsert;
