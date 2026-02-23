import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal, bigint, index, date } from "drizzle-orm/mysql-core";

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
    "Exec Asst",
    "PPIC",
    "Purchasing",
    "GA",
    "Finance",
    "Production",
    "Logistics",
    "Staff",
    "admin"
  ]).default("Staff").notNull(),
  
  // Cognito groups stored as JSON array
  cognitoGroups: json("cognito_groups").$type<string[]>(),
  
  // Signature for CEO/CFO approval
  signatureUrl: text("signature_url"), // S3 URL to signature image
  
  // Pinned workflows (personal user preference)
  pinnedWorkflows: json("pinned_workflows").$type<string[]>().default([]),
  
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
  workflowType: varchar("workflow_type", { length: 50 }).notNull(), // Changed from enum to varchar to support custom workflow types
  templateId: varchar("template_id", { length: 36 }), // Reference to workflow template used
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  
  // Requester information
  requesterId: int("requester_id").notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  
  // Financial information
  estimatedAmount: decimal("estimated_amount", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("IDR"),
  
  // Routing flags (deprecated - kept for backward compatibility)
  requiresGa: boolean("requires_ga").default(false),
  requiresPpic: boolean("requires_ppic").default(false),
  
  // Pre-completion contingency - workflow IDs that must be completed first
  contingencyWorkflowIds: json("contingency_workflow_ids").$type<string[]>(),
  
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
  isQuickAssignEnabled: boolean("is_quick_assign_enabled").default(false).notNull(), // Show in Quick Assign modal
  
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


/**
 * =====================================================
 * DEPARTMENT_BUDGETS TABLE
 * Track allocated budgets per department
 * =====================================================
 */
export const departmentBudgets = mysqlTable("department_budgets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  
  // Department information
  department: varchar("department", { length: 100 }).notNull(),
  
  // Budget period
  year: int("year").notNull(),
  quarter: int("quarter"), // 1-4, null for annual budget
  month: int("month"), // 1-12, null for quarterly/annual budget
  
  // Budget amounts
  allocatedBudget: decimal("allocated_budget", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IDR"),
  
  // Metadata
  notes: text("notes"),
  createdBy: int("created_by").notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DepartmentBudget = typeof departmentBudgets.$inferSelect;
export type InsertDepartmentBudget = typeof departmentBudgets.$inferInsert;


/**
 * =====================================================
 * EXCEL_TEMPLATES TABLE
 * Manage downloadable Excel template files
 * =====================================================
 */
export const excelTemplates = mysqlTable("excel_templates", {
  id: int("id").autoincrement().primaryKey(),
  workflowType: varchar("workflow_type", { length: 100 }).notNull(), // MAF, PR, Reimbursement, etc.
  templateName: varchar("template_name", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileKey: varchar("file_key", { length: 1000 }).notNull(),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  uploadedBy: int("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export type ExcelTemplate = typeof excelTemplates.$inferSelect;
export type InsertExcelTemplate = typeof excelTemplates.$inferInsert;

/**
 * =====================================================
 * TASK ASSIGNMENTS TABLE
 * Tracks workflow assignments from managers to staff
 * =====================================================
 */
export const taskAssignments = mysqlTable("task_assignments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  workflowId: varchar("workflow_id", { length: 36 }).notNull(),
  assignedTo: int("assigned_to").notNull(), // user.id (Staff)
  assignedBy: int("assigned_by").notNull(), // user.id (Manager/Dept Head)
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => ({
  workflowIdx: index("idx_workflow_id").on(table.workflowId),
  assignedToIdx: index("idx_assigned_to").on(table.assignedTo),
  assignedByIdx: index("idx_assigned_by").on(table.assignedBy),
}));

export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = typeof taskAssignments.$inferInsert;

/**
 * =====================================================
 * USER PERFORMANCE METRICS TABLE
 * Cached performance metrics for capacity page
 * Refreshed every 12 hours
 * =====================================================
 */
export const userPerformanceMetrics = mysqlTable("user_performance_metrics", {
  userId: int("user_id").primaryKey(),
  avgCompletionHours: decimal("avg_completion_hours", { precision: 10, scale: 2 }),
  tasksCompletedThisMonth: int("tasks_completed_this_month").default(0).notNull(),
  longestStuckHours: decimal("longest_stuck_hours", { precision: 10, scale: 2 }),
  longestStuckWorkflowId: varchar("longest_stuck_workflow_id", { length: 36 }),
  rejectedCount: int("rejected_count").default(0).notNull(),
  lastCalculated: timestamp("last_calculated").defaultNow().notNull(),
}, (table) => ({
  lastCalculatedIdx: index("idx_last_calculated").on(table.lastCalculated),
}));

export type UserPerformanceMetrics = typeof userPerformanceMetrics.$inferSelect;
export type InsertUserPerformanceMetrics = typeof userPerformanceMetrics.$inferInsert;

/**
 * =====================================================
 * SALARY CACHE TABLE
 * Cached salary data from Qapita API
 * Synced monthly
 * =====================================================
 */
export const salaryCache = mysqlTable("salary_cache", {
  userId: int("user_id").primaryKey(),
  salaryAmount: decimal("salary_amount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("IDR").notNull(),
  lastSynced: timestamp("last_synced").defaultNow().notNull(),
});

export type SalaryCache = typeof salaryCache.$inferSelect;
export type InsertSalaryCache = typeof salaryCache.$inferInsert;

/**
 * =====================================================
 * EMAIL LOGS TABLE
 * Track all sent email notifications
 * =====================================================
 */
export const emailLogs = mysqlTable("email_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  
  // Recipient
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  
  // Email details
  subject: text("subject").notNull(),
  template: mysqlEnum("template", [
    "milestone_completion",
    "workflow_rejection",
    "workflow_completion",
    "deadline_reminder"
  ]).notNull(),
  
  // Related workflow
  workflowId: varchar("workflow_id", { length: 36 }),
  
  // Delivery status
  status: mysqlEnum("status", ["sent", "failed"]).notNull(),
  messageId: varchar("message_id", { length: 255 }), // AWS SES Message ID
  errorMessage: text("error_message"),
  
  // Timestamps
  sentAt: timestamp("sent_at").defaultNow().notNull(),
}, (table) => ({
  workflowIdx: index("idx_workflow_id").on(table.workflowId),
  recipientIdx: index("idx_recipient_email").on(table.recipientEmail),
  sentAtIdx: index("idx_sent_at").on(table.sentAt),
}));

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

/**
 * =====================================================
 * RECURRING_WORKFLOWS TABLE
 * Recurring workflow templates with scheduling
 * =====================================================
 */
export const recurringWorkflows = mysqlTable("recurring_workflows", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  
  // Template reference
  templateId: varchar("template_id", { length: 36 }).notNull(),
  
  // Workflow details (pre-filled values)
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  department: varchar("department", { length: 100 }).notNull(),
  
  // Recurrence configuration
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly"]).notNull(),
  dayOfMonth: int("day_of_month"), // 1-31 for monthly recurrence
  dayOfWeek: int("day_of_week"), // 0-6 (0=Sunday) for weekly recurrence
  
  // Schedule dates
  startDate: date("start_date").notNull(),
  endDate: date("end_date"), // Optional end date
  
  // Next scheduled generation
  nextScheduledDate: date("next_scheduled_date").notNull(),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  isPaused: boolean("is_paused").default(false).notNull(),
  
  // Owner information
  createdBy: int("created_by").notNull(),
  assignedTo: json("assigned_to").$type<number[]>(), // User IDs who should be assigned
  
  // Pre-filled form data (optional)
  formTemplateId: varchar("form_template_id", { length: 36 }),
  formData: json("form_data").$type<Record<string, any>>(),
  
  // Contingency workflows (optional)
  contingencyWorkflowIds: json("contingency_workflow_ids").$type<string[]>(),
  
  // Timestamps
  lastGeneratedAt: timestamp("last_generated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
}, (table) => ({
  createdByIdx: index("idx_created_by").on(table.createdBy),
  nextScheduledIdx: index("idx_next_scheduled_date").on(table.nextScheduledDate),
  isActiveIdx: index("idx_is_active").on(table.isActive),
}));

export type RecurringWorkflow = typeof recurringWorkflows.$inferSelect;
export type InsertRecurringWorkflow = typeof recurringWorkflows.$inferInsert;

/**
 * =====================================================
 * RECURRING_WORKFLOW_HISTORY TABLE
 * Track generated workflows from recurring templates
 * =====================================================
 */
export const recurringWorkflowHistory = mysqlTable("recurring_workflow_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  
  // References
  recurringWorkflowId: varchar("recurring_workflow_id", { length: 36 }).notNull(),
  generatedWorkflowId: varchar("generated_workflow_id", { length: 36 }).notNull(),
  
  // Generation details
  scheduledDate: date("scheduled_date").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  generationStatus: mysqlEnum("generation_status", ["success", "failed"]).notNull(),
  errorMessage: text("error_message"),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
}, (table) => ({
  recurringWorkflowIdx: index("idx_recurring_workflow_id").on(table.recurringWorkflowId),
  generatedWorkflowIdx: index("idx_generated_workflow_id").on(table.generatedWorkflowId),
  scheduledDateIdx: index("idx_scheduled_date").on(table.scheduledDate),
}));

export type RecurringWorkflowHistory = typeof recurringWorkflowHistory.$inferSelect;
export type InsertRecurringWorkflowHistory = typeof recurringWorkflowHistory.$inferInsert;
