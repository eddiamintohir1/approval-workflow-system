var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  auditLogs: () => auditLogs,
  departmentBudgets: () => departmentBudgets2,
  documentSequenceCounters: () => documentSequenceCounters,
  documentSequences: () => documentSequences,
  documentTemplates: () => documentTemplates,
  emailLogs: () => emailLogs,
  emailRecipients: () => emailRecipients,
  excelTemplates: () => excelTemplates,
  formSubmissionDocuments: () => formSubmissionDocuments,
  formSubmissions: () => formSubmissions2,
  formTemplateDocuments: () => formTemplateDocuments,
  formTemplates: () => formTemplates,
  recurringWorkflowHistory: () => recurringWorkflowHistory,
  recurringWorkflows: () => recurringWorkflows,
  salaryCache: () => salaryCache,
  sequenceCounters: () => sequenceCounters,
  signedDocuments: () => signedDocuments,
  skuCategories: () => skuCategories,
  skuCounters: () => skuCounters,
  skus: () => skus,
  taskAssignments: () => taskAssignments,
  templateStages: () => templateStages,
  userPerformanceMetrics: () => userPerformanceMetrics,
  users: () => users,
  workflowApprovals: () => workflowApprovals,
  workflowComments: () => workflowComments,
  workflowFiles: () => workflowFiles,
  workflowStages: () => workflowStages,
  workflowTemplates: () => workflowTemplates,
  workflows: () => workflows
});
import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  decimal,
  bigint,
  index,
  date
} from "drizzle-orm/mysql-core";
var users, workflows, workflowStages, workflowApprovals, workflowFiles, workflowComments, auditLogs, emailRecipients, sequenceCounters, documentSequenceCounters, documentSequences, formTemplates, formTemplateDocuments, formSubmissionDocuments, formSubmissions2, workflowTemplates, templateStages, departmentBudgets2, excelTemplates, taskAssignments, userPerformanceMetrics, salaryCache, emailLogs, recurringWorkflows, recurringWorkflowHistory, signedDocuments, documentTemplates, skuCategories, skuCounters, skus;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      // Legacy identity column names retained for database compatibility. Values
      // are populated from Microsoft Entra object identifiers and claims.
      cognitoSub: varchar("cognito_sub", { length: 255 }).notNull().unique(),
      openId: varchar("open_id", { length: 64 }).notNull().unique(),
      // For Manus compatibility
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
        "R&D",
        "Sales",
        "Marketing",
        "Operations",
        "Staff",
        "admin"
      ]).default("Staff").notNull(),
      // Microsoft Entra roles/groups stored as a JSON array
      cognitoGroups: json("cognito_groups").$type(),
      // Signature for CEO/CFO approval
      signatureUrl: text("signature_url"),
      // S3 URL to signature image
      // Pinned workflows (personal user preference)
      pinnedWorkflows: json("pinned_workflows").$type().default([]),
      // Status
      isActive: boolean("is_active").default(true).notNull(),
      // Timestamps
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
      lastLoginAt: timestamp("last_login_at")
    });
    workflows = mysqlTable("workflows", {
      id: varchar("id", { length: 36 }).primaryKey(),
      // UUID as string
      workflowNumber: varchar("workflow_number", { length: 50 }).notNull().unique(),
      // WFMT-MAF-260209-001
      workflowType: varchar("workflow_type", { length: 50 }).notNull(),
      // Changed from enum to varchar to support custom workflow types
      templateId: varchar("template_id", { length: 36 }),
      // Reference to workflow template used
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
      contingencyWorkflowIds: json("contingency_workflow_ids").$type(),
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
      metadata: json("metadata").$type()
    });
    workflowStages = mysqlTable("workflow_stages", {
      id: varchar("id", { length: 36 }).primaryKey(),
      workflowId: varchar("workflow_id", { length: 36 }).notNull(),
      // Stage information
      stageOrder: int("stage_order").notNull(),
      stageName: varchar("stage_name", { length: 100 }).notNull(),
      stageType: varchar("stage_type", { length: 50 }).notNull(),
      // "ceo_coo", "ppic", "purchasing", etc.
      // Approval requirements
      requiredRole: varchar("required_role", { length: 50 }),
      requiresOneOf: json("requires_one_of").$type(),
      // For CEO/COO: ['CEO', 'COO']
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
      metadata: json("metadata").$type()
    });
    workflowApprovals = mysqlTable("workflow_approvals", {
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
      metadata: json("metadata").$type()
    });
    workflowFiles = mysqlTable("workflow_files", {
      id: varchar("id", { length: 36 }).primaryKey(),
      workflowId: varchar("workflow_id", { length: 36 }).notNull(),
      stageId: varchar("stage_id", { length: 36 }),
      // File information
      fileName: varchar("file_name", { length: 500 }).notNull(),
      fileType: varchar("file_type", { length: 50 }).notNull(),
      // "maf_form", "pr_form", "forecast", etc.
      fileCategory: varchar("file_category", { length: 50 }),
      // "submission", "approval", "supporting"
      // S3 storage
      s3Bucket: varchar("s3_bucket", { length: 255 }).notNull(),
      s3Key: varchar("s3_key", { length: 1e3 }).notNull(),
      s3Url: text("s3_url"),
      // File metadata
      fileSize: bigint("file_size", { mode: "number" }),
      mimeType: varchar("mime_type", { length: 100 }),
      // Upload information
      uploadedBy: int("uploaded_by").notNull(),
      uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
      // Metadata
      metadata: json("metadata").$type()
    });
    workflowComments = mysqlTable("workflow_comments", {
      id: varchar("id", { length: 36 }).primaryKey(),
      workflowId: varchar("workflow_id", { length: 36 }).notNull(),
      stageId: varchar("stage_id", { length: 36 }),
      // Comment details
      commentText: text("comment_text").notNull(),
      commentType: varchar("comment_type", { length: 50 }).default("general"),
      // "general", "approval", "rejection", "revision_request"
      // Author information
      authorId: int("author_id").notNull(),
      authorRole: varchar("author_role", { length: 50 }),
      // Timestamps
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
      // Metadata
      metadata: json("metadata").$type()
    });
    auditLogs = mysqlTable("audit_logs", {
      id: varchar("id", { length: 36 }).primaryKey(),
      // Entity information
      entityType: varchar("entity_type", { length: 50 }).notNull(),
      // "workflow", "stage", "approval", "file", "user"
      entityId: varchar("entity_id", { length: 36 }).notNull(),
      // Action details
      action: varchar("action", { length: 100 }).notNull(),
      // "created", "updated", "approved", "rejected", etc.
      actionDescription: text("action_description"),
      // Actor information
      actorId: int("actor_id"),
      actorEmail: varchar("actor_email", { length: 255 }),
      actorRole: varchar("actor_role", { length: 50 }),
      // Changes tracking
      oldValues: json("old_values").$type(),
      newValues: json("new_values").$type(),
      // Request metadata
      ipAddress: varchar("ip_address", { length: 45 }),
      // IPv6 max length
      userAgent: text("user_agent"),
      // Timestamps
      createdAt: timestamp("created_at").defaultNow().notNull(),
      // Metadata
      metadata: json("metadata").$type()
    });
    emailRecipients = mysqlTable("email_recipients", {
      id: varchar("id", { length: 36 }).primaryKey(),
      // Recipient grouping
      recipientGroup: varchar("recipient_group", { length: 100 }).notNull(),
      // "ceo_coo", "finance", "ppic", etc.
      // Recipient information
      userId: int("user_id"),
      email: varchar("email", { length: 255 }).notNull(),
      fullName: varchar("full_name", { length: 255 }),
      // Notification preferences
      isActive: boolean("is_active").default(true),
      notificationTypes: json("notification_types").$type(),
      // ["approval_request", "approval_granted", etc.]
      // Timestamps
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    sequenceCounters = mysqlTable("sequence_counters", {
      id: varchar("id", { length: 36 }).primaryKey(),
      // Sequence identification
      sequenceType: mysqlEnum("sequence_type", [
        "MAF",
        "PR",
        "CATTO",
        "SKU",
        "PAF"
      ]).notNull(),
      sequenceDate: varchar("sequence_date", { length: 10 }).notNull(),
      // YYYY-MM-DD format
      // Counter
      currentCounter: int("current_counter").default(0).notNull(),
      // Timestamps
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    documentSequenceCounters = mysqlTable(
      "document_sequence_counters",
      {
        id: varchar("id", { length: 100 }).primaryKey(),
        prefix: varchar("prefix", { length: 100 }).notNull(),
        department: varchar("department", { length: 20 }).notNull(),
        documentType: varchar("document_type", { length: 20 }).notNull(),
        currentValue: int("current_value").default(0).notNull(),
        formatPattern: varchar("format_pattern", { length: 255 }),
        resetPeriod: varchar("reset_period", { length: 20 }).default("monthly"),
        lastResetAt: timestamp("last_reset_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
      }
    );
    documentSequences = mysqlTable(
      "document_sequences",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        documentNumber: varchar("document_number", { length: 100 }).notNull().unique(),
        sequenceCounter: int("sequence_counter").notNull(),
        documentType: varchar("document_type", { length: 20 }).notNull(),
        company: varchar("company", { length: 20 }).notNull(),
        division: varchar("division", { length: 20 }).notNull(),
        monthRoman: varchar("month_roman", { length: 10 }).notNull(),
        monthNumeric: int("month_numeric").notNull(),
        year: int("year").notNull(),
        revisionNumber: int("revision_number").default(0).notNull(),
        documentTitle: varchar("document_title", { length: 255 }).notNull(),
        documentDescription: text("document_description"),
        status: varchar("status", { length: 20 }).default("draft").notNull(),
        createdBy: varchar("created_by", { length: 36 }).notNull(),
        updatedBy: varchar("updated_by", { length: 36 }),
        changeHistory: json("change_history").$type().default([]),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
      },
      (table) => ({
        companyIdx: index("document_sequences_company_idx").on(table.company),
        divisionIdx: index("document_sequences_division_idx").on(table.division),
        typeIdx: index("document_sequences_type_idx").on(table.documentType),
        statusIdx: index("document_sequences_status_idx").on(table.status),
        yearIdx: index("document_sequences_year_idx").on(table.year)
      })
    );
    formTemplates = mysqlTable("form_templates", {
      id: varchar("id", { length: 36 }).primaryKey(),
      // Template information
      templateName: varchar("template_name", { length: 255 }).notNull(),
      templateCode: varchar("template_code", { length: 50 }).notNull().unique(),
      // "MAF_FORM", "PR_FORM", etc.
      description: text("description"),
      // Form configuration
      fields: json("fields").$type().notNull(),
      // Template status
      isActive: boolean("is_active").default(true).notNull(),
      version: int("version").default(1).notNull(),
      // Creator information
      createdBy: int("created_by").notNull(),
      // Timestamps
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
      // Metadata
      metadata: json("metadata").$type()
    });
    formTemplateDocuments = mysqlTable("form_template_documents", {
      id: varchar("id", { length: 36 }).primaryKey(),
      formTemplateId: varchar("form_template_id", { length: 36 }).notNull(),
      // Document information
      documentName: varchar("document_name", { length: 255 }).notNull(),
      documentType: mysqlEnum("document_type", ["pdf", "excel"]).notNull(),
      fileSize: bigint("file_size", { mode: "number" }).notNull(),
      storageUrl: text("storage_url").notNull(),
      // Azure Blob Storage URL
      // Fillable fields definition
      fields: json("fields").$type().notNull().default([]),
      // Status
      isActive: boolean("is_active").default(true).notNull(),
      // Creator information
      uploadedBy: int("uploaded_by").notNull(),
      // Timestamps
      uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    formSubmissionDocuments = mysqlTable("form_submission_documents", {
      id: varchar("id", { length: 36 }).primaryKey(),
      submissionId: varchar("submission_id", { length: 36 }).notNull(),
      templateDocumentId: varchar("template_document_id", { length: 36 }).notNull(),
      // Filled field values
      filledData: json("filled_data").$type().notNull().default({}),
      // Validation status
      isComplete: boolean("is_complete").default(false).notNull(),
      validationErrors: json("validation_errors").$type().default([]),
      // Generated document
      generatedDocumentUrl: text("generated_document_url"),
      // URL to filled/signed document
      // Timestamps
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    formSubmissions2 = mysqlTable("form_submissions", {
      id: varchar("id", { length: 36 }).primaryKey(),
      // Template reference
      templateId: varchar("template_id", { length: 36 }).notNull(),
      workflowId: varchar("workflow_id", { length: 36 }),
      stageId: varchar("stage_id", { length: 36 }),
      // Form data
      formData: json("form_data").$type().notNull(),
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
      metadata: json("metadata").$type()
    });
    workflowTemplates = mysqlTable("workflow_templates", {
      id: varchar("id", { length: 36 }).primaryKey(),
      // UUID
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      workflowType: varchar("workflow_type", { length: 100 }).notNull(),
      // Flexible: MAF, PR, Reimbursement, Leave, etc.
      // Template status
      isActive: boolean("is_active").default(true).notNull(),
      isDefault: boolean("is_default").default(false).notNull(),
      // One default template per type
      isQuickAssignEnabled: boolean("is_quick_assign_enabled").default(false).notNull(),
      // Show in Quick Assign modal
      // Creator
      createdBy: int("created_by").notNull(),
      // Timestamps
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    templateStages = mysqlTable("template_stages", {
      id: varchar("id", { length: 36 }).primaryKey(),
      // UUID
      templateId: varchar("template_id", { length: 36 }).notNull(),
      // Stage ordering
      stageOrder: int("stage_order").notNull(),
      // Stage information
      stageName: varchar("stage_name", { length: 255 }).notNull(),
      stageDescription: text("stage_description"),
      // Department/Role assignment
      department: varchar("department", { length: 100 }),
      requiredRole: varchar("required_role", { length: 50 }),
      requiresOneOf: json("requires_one_of").$type(),
      // Multiple roles allowed (e.g., ['CEO', 'COO'])
      // Stage conditions
      approvalRequired: boolean("approval_required").default(true).notNull(),
      fileUploadRequired: boolean("file_upload_required").default(false).notNull(),
      // Email notifications
      notificationEmails: json("notification_emails").$type(),
      // Email addresses to notify when stage starts
      // Stage visibility control
      visibleToDepartments: json("visible_to_departments").$type(),
      // Departments that can see this stage
      // Approval threshold (for amount-based routing)
      approvalThreshold: decimal("approval_threshold", { precision: 15, scale: 2 }),
      // Timestamps
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    departmentBudgets2 = mysqlTable("department_budgets", {
      id: varchar("id", { length: 36 }).primaryKey(),
      // Department information
      department: varchar("department", { length: 100 }).notNull(),
      // Budget period
      year: int("year").notNull(),
      quarter: int("quarter"),
      // 1-4, null for annual budget
      month: int("month"),
      // 1-12, null for quarterly/annual budget
      // Budget amounts
      allocatedBudget: decimal("allocated_budget", {
        precision: 15,
        scale: 2
      }).notNull(),
      currency: varchar("currency", { length: 3 }).default("IDR"),
      // Metadata
      notes: text("notes"),
      createdBy: int("created_by").notNull(),
      // Timestamps
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    excelTemplates = mysqlTable("excel_templates", {
      id: int("id").autoincrement().primaryKey(),
      workflowType: varchar("workflow_type", { length: 100 }).notNull(),
      // MAF, PR, Reimbursement, etc.
      templateName: varchar("template_name", { length: 255 }).notNull(),
      description: text("description"),
      fileUrl: text("file_url").notNull(),
      fileKey: varchar("file_key", { length: 1e3 }).notNull(),
      fileName: varchar("file_name", { length: 500 }).notNull(),
      fileSize: bigint("file_size", { mode: "number" }),
      uploadedBy: int("uploaded_by").notNull(),
      uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
      isActive: boolean("is_active").default(true).notNull(),
      // Excel form-template mapping fields
      formTemplateId: varchar("form_template_id", { length: 36 }),
      workbookMappings: json("workbook_mappings").$type(),
      workbookMetadata: json("workbook_metadata").$type(),
      outputFileNamePattern: varchar("output_file_name_pattern", { length: 255 })
    });
    taskAssignments = mysqlTable(
      "task_assignments",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        workflowId: varchar("workflow_id", { length: 36 }).notNull(),
        assignedTo: int("assigned_to").notNull(),
        // user.id (Staff)
        assignedBy: int("assigned_by").notNull(),
        // user.id (Manager/Dept Head)
        assignedAt: timestamp("assigned_at").defaultNow().notNull()
      },
      (table) => ({
        workflowIdx: index("idx_workflow_id").on(table.workflowId),
        assignedToIdx: index("idx_assigned_to").on(table.assignedTo),
        assignedByIdx: index("idx_assigned_by").on(table.assignedBy)
      })
    );
    userPerformanceMetrics = mysqlTable(
      "user_performance_metrics",
      {
        userId: int("user_id").primaryKey(),
        avgCompletionHours: decimal("avg_completion_hours", {
          precision: 10,
          scale: 2
        }),
        tasksCompletedThisMonth: int("tasks_completed_this_month").default(0).notNull(),
        longestStuckHours: decimal("longest_stuck_hours", {
          precision: 10,
          scale: 2
        }),
        longestStuckWorkflowId: varchar("longest_stuck_workflow_id", {
          length: 36
        }),
        rejectedCount: int("rejected_count").default(0).notNull(),
        lastCalculated: timestamp("last_calculated").defaultNow().notNull()
      },
      (table) => ({
        lastCalculatedIdx: index("idx_last_calculated").on(table.lastCalculated)
      })
    );
    salaryCache = mysqlTable("salary_cache", {
      userId: int("user_id").primaryKey(),
      salaryAmount: decimal("salary_amount", { precision: 12, scale: 2 }),
      currency: varchar("currency", { length: 3 }).default("IDR").notNull(),
      lastSynced: timestamp("last_synced").defaultNow().notNull()
    });
    emailLogs = mysqlTable(
      "email_logs",
      {
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
        messageId: varchar("message_id", { length: 255 }),
        // AWS SES Message ID
        errorMessage: text("error_message"),
        // Timestamps
        sentAt: timestamp("sent_at").defaultNow().notNull()
      },
      (table) => ({
        workflowIdx: index("idx_workflow_id").on(table.workflowId),
        recipientIdx: index("idx_recipient_email").on(table.recipientEmail),
        sentAtIdx: index("idx_sent_at").on(table.sentAt)
      })
    );
    recurringWorkflows = mysqlTable(
      "recurring_workflows",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        // UUID
        // Template reference
        templateId: varchar("template_id", { length: 36 }).notNull(),
        // Workflow details (pre-filled values)
        title: varchar("title", { length: 500 }).notNull(),
        description: text("description"),
        department: varchar("department", { length: 100 }).notNull(),
        // Recurrence configuration
        frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly"]).notNull(),
        dayOfMonth: int("day_of_month"),
        // 1-31 for monthly recurrence
        dayOfWeek: int("day_of_week"),
        // 0-6 (0=Sunday) for weekly recurrence
        // Schedule dates
        startDate: date("start_date").notNull(),
        endDate: date("end_date"),
        // Optional end date
        // Next scheduled generation
        nextScheduledDate: date("next_scheduled_date").notNull(),
        // Status
        isActive: boolean("is_active").default(true).notNull(),
        isPaused: boolean("is_paused").default(false).notNull(),
        // Owner information
        createdBy: int("created_by").notNull(),
        assignedTo: json("assigned_to").$type(),
        // User IDs who should be assigned
        // Assignee presets for each approval stage
        // Format: { "stage_name": [userId1, userId2, ...] }
        assigneePresets: json("assignee_presets").$type(),
        // Pre-filled form data (optional)
        formTemplateId: varchar("form_template_id", { length: 36 }),
        formData: json("form_data").$type(),
        // Contingency workflows (optional)
        contingencyWorkflowIds: json("contingency_workflow_ids").$type(),
        // Timestamps
        lastGeneratedAt: timestamp("last_generated_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
        // Metadata
        metadata: json("metadata").$type()
      },
      (table) => ({
        createdByIdx: index("idx_created_by").on(table.createdBy),
        nextScheduledIdx: index("idx_next_scheduled_date").on(
          table.nextScheduledDate
        ),
        isActiveIdx: index("idx_is_active").on(table.isActive)
      })
    );
    recurringWorkflowHistory = mysqlTable(
      "recurring_workflow_history",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        // References
        recurringWorkflowId: varchar("recurring_workflow_id", {
          length: 36
        }).notNull(),
        generatedWorkflowId: varchar("generated_workflow_id", {
          length: 36
        }).notNull(),
        // Generation details
        scheduledDate: date("scheduled_date").notNull(),
        generatedAt: timestamp("generated_at").defaultNow().notNull(),
        generationStatus: mysqlEnum("generation_status", [
          "success",
          "failed"
        ]).notNull(),
        errorMessage: text("error_message"),
        // Metadata
        metadata: json("metadata").$type()
      },
      (table) => ({
        recurringWorkflowIdx: index("idx_recurring_workflow_id").on(
          table.recurringWorkflowId
        ),
        generatedWorkflowIdx: index("idx_generated_workflow_id").on(
          table.generatedWorkflowId
        ),
        scheduledDateIdx: index("idx_scheduled_date").on(table.scheduledDate)
      })
    );
    signedDocuments = mysqlTable("signed_documents", {
      id: varchar("id", { length: 36 }).primaryKey(),
      workflowId: varchar("workflow_id", { length: 36 }).notNull(),
      documentName: varchar("document_name", { length: 500 }).notNull(),
      s3Key: varchar("s3_key", { length: 1e3 }),
      // S3 storage key (nullable for upload-only)
      s3Url: text("s3_url"),
      // S3 URL for accessing the document (nullable for upload-only)
      uploadedS3Key: varchar("uploaded_s3_key", { length: 1e3 }),
      // Original uploaded document S3 key
      uploadedS3Url: text("uploaded_s3_url"),
      // Original uploaded document S3 URL
      helloDocDocumentId: varchar("hellodoc_document_id", { length: 255 }),
      // HelloDoc document ID (entered manually)
      signerId: int("signer_id").notNull(),
      signerEmail: varchar("signer_email", { length: 255 }).notNull(),
      signerName: varchar("signer_name", { length: 255 }).notNull(),
      status: mysqlEnum("status", [
        "pending",
        "awaiting_hellodoc_id",
        "signed",
        "rejected",
        "expired"
      ]).notNull().default("awaiting_hellodoc_id"),
      signedAt: timestamp("signed_at"),
      sentAt: timestamp("sent_at"),
      // When sent from HelloDoc (nullable)
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
    });
    documentTemplates = mysqlTable("document_templates", {
      id: varchar("id", { length: 36 }).primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      category: varchar("category", { length: 100 }),
      // e.g., "Contract", "NDA", "Invoice", "Agreement"
      s3Key: varchar("s3_key", { length: 1e3 }).notNull(),
      // S3 storage key for template file
      s3Url: text("s3_url").notNull(),
      // S3 URL for accessing the template
      fileType: varchar("file_type", { length: 50 }).notNull(),
      // e.g., "pdf", "docx"
      createdBy: int("created_by").notNull(),
      // User ID who created the template
      isActive: boolean("is_active").default(true).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
    });
    skuCategories = mysqlTable(
      "sku_categories",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        prefix: varchar("prefix", { length: 10 }).notNull().unique(),
        name: varchar("name", { length: 100 }).notNull(),
        description: text("description"),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
      },
      (table) => ({
        prefixIdx: index("idx_prefix").on(table.prefix),
        isActiveIdx: index("idx_is_active").on(table.isActive)
      })
    );
    skuCounters = mysqlTable(
      "sku_counters",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        categoryId: varchar("category_id", { length: 36 }).notNull(),
        currentCounter: int("current_counter").default(0).notNull(),
        resetDate: date("reset_date"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
      },
      (table) => ({
        categoryIdIdx: index("idx_category_id").on(table.categoryId),
        uniqueCategoryCounter: index("unique_category_counter").on(
          table.categoryId
        )
      })
    );
    skus = mysqlTable(
      "skus",
      {
        id: varchar("id", { length: 36 }).primaryKey(),
        skuCode: varchar("sku_code", { length: 50 }).notNull().unique(),
        categoryId: varchar("category_id", { length: 36 }).notNull(),
        prefix: varchar("prefix", { length: 10 }).notNull(),
        sequenceNumber: int("sequence_number").notNull(),
        productName: varchar("product_name", { length: 500 }),
        description: text("description"),
        status: varchar("status", { length: 50 }).default("active").notNull(),
        createdBy: int("created_by").notNull(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
      },
      (table) => ({
        skuCodeIdx: index("idx_sku_code").on(table.skuCode),
        categoryIdIdx: index("idx_category_id").on(table.categoryId),
        prefixIdx: index("idx_prefix").on(table.prefix),
        statusIdx: index("idx_status").on(table.status),
        createdAtIdx: index("idx_created_at").on(table.createdAt)
      })
    );
  }
});

// server/db.ts
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
function ensureExcelMappingSchema() {
  if (excelMappingSchemaPromise) return excelMappingSchemaPromise;
  excelMappingSchemaPromise = (async () => {
    const dbConnection = await mysqlPool.getConnection();
    try {
      await dbConnection.query(
        "SELECT GET_LOCK('excel_mapping_schema_v1', 15)"
      );
      const [columnRows] = await dbConnection.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'excel_templates'`
      );
      const columns = new Set(columnRows.map((row) => String(row.COLUMN_NAME)));
      const additions = [
        ["form_template_id", "VARCHAR(36) NULL"],
        ["workbook_mappings", "JSON NULL"],
        ["workbook_metadata", "JSON NULL"],
        ["output_file_name_pattern", "VARCHAR(255) NULL"]
      ].filter(([name]) => !columns.has(name));
      for (const [name, definition] of additions) {
        await dbConnection.query(
          `ALTER TABLE excel_templates ADD COLUMN \`${name}\` ${definition}`
        );
      }
      const [indexRows] = await dbConnection.query(
        `SELECT INDEX_NAME
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'excel_templates'
           AND INDEX_NAME = 'idx_excel_templates_form_template_id'`
      );
      if (indexRows.length === 0) {
        await dbConnection.query(
          "CREATE INDEX idx_excel_templates_form_template_id ON excel_templates(form_template_id)"
        );
      }
    } finally {
      await dbConnection.query(
        "SELECT RELEASE_LOCK('excel_mapping_schema_v1')"
      );
      dbConnection.release();
    }
  })().catch((error) => {
    excelMappingSchemaPromise = null;
    throw error;
  });
  return excelMappingSchemaPromise;
}
async function upsertUser(user) {
  const [existingUser] = await db.select().from(users).where(eq(users.cognitoSub, user.cognitoSub)).limit(1);
  if (existingUser) {
    await db.update(users).set({
      email: user.email,
      fullName: user.fullName,
      department: user.department,
      role: user.role || existingUser.role,
      cognitoGroups: user.cognitoGroups,
      lastLoginAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, existingUser.id));
    const [updated] = await db.select().from(users).where(eq(users.id, existingUser.id)).limit(1);
    return updated;
  } else {
    const result = await db.insert(users).values({
      cognitoSub: user.cognitoSub,
      openId: user.openId,
      email: user.email,
      fullName: user.fullName,
      department: user.department,
      role: user.role || "PPIC",
      cognitoGroups: user.cognitoGroups,
      isActive: true,
      lastLoginAt: /* @__PURE__ */ new Date()
    });
    const [newUser] = await db.select().from(users).where(eq(users.cognitoSub, user.cognitoSub)).limit(1);
    return newUser;
  }
}
async function getUserByOpenId(openId) {
  const [user] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return user;
}
async function getUserById(id) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}
async function getAllUsers() {
  return await db.select().from(users).orderBy(desc(users.createdAt));
}
async function updateUserRole(userId, role) {
  await db.update(users).set({ role }).where(eq(users.id, userId));
}
async function updateUserStatus(userId, isActive) {
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}
async function updateUserPinnedWorkflows(userId, pinnedWorkflows) {
  await db.update(users).set({ pinnedWorkflows }).where(eq(users.id, userId));
}
async function createWorkflow(workflow) {
  const workflowId = randomUUID();
  const workflowNumber = await generateWorkflowNumber(workflow.workflowType);
  await db.insert(workflows).values({
    id: workflowId,
    workflowNumber,
    workflowType: workflow.workflowType,
    templateId: workflow.templateId,
    title: workflow.title,
    description: workflow.description,
    requesterId: workflow.requesterId,
    department: workflow.department,
    estimatedAmount: workflow.estimatedAmount?.toString(),
    currency: workflow.currency || "IDR",
    requiresGa: workflow.requiresGa || false,
    requiresPpic: workflow.requiresPpic || false,
    contingencyWorkflowIds: workflow.contingencyWorkflowIds,
    overallStatus: "draft"
  });
  const [newWorkflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId)).limit(1);
  return newWorkflow;
}
async function getWorkflowById(workflowId) {
  const [result] = await db.select({
    ...workflows,
    requesterName: users.fullName
  }).from(workflows).leftJoin(users, eq(workflows.requesterId, users.id)).where(eq(workflows.id, workflowId)).limit(1);
  return result;
}
async function getWorkflowsByRequester(requesterId) {
  return await db.select().from(workflows).where(eq(workflows.requesterId, requesterId)).orderBy(desc(workflows.createdAt));
}
async function getAllWorkflows() {
  return await db.select().from(workflows).orderBy(desc(workflows.createdAt));
}
async function updateWorkflowStatus(workflowId, status) {
  await db.update(workflows).set({ overallStatus: status }).where(eq(workflows.id, workflowId));
}
async function submitWorkflow(workflowId) {
  await db.update(workflows).set({
    overallStatus: "in_progress",
    submittedAt: /* @__PURE__ */ new Date()
  }).where(eq(workflows.id, workflowId));
}
async function discontinueWorkflow(workflowId, reason) {
  await db.update(workflows).set({
    overallStatus: "discontinued",
    completedAt: /* @__PURE__ */ new Date(),
    metadata: sql`JSON_SET(COALESCE(metadata, '{}'), '$.discontinuedReason', ${reason || "No reason provided"}, '$.discontinuedAt', ${(/* @__PURE__ */ new Date()).toISOString()})`
  }).where(eq(workflows.id, workflowId));
}
async function archiveWorkflow(workflowId) {
  await db.update(workflows).set({
    overallStatus: "archived",
    metadata: sql`JSON_SET(COALESCE(metadata, '{}'), '$.archivedAt', ${(/* @__PURE__ */ new Date()).toISOString()})`
  }).where(eq(workflows.id, workflowId));
}
async function deleteWorkflow(workflowId) {
  await db.delete(workflowFiles).where(eq(workflowFiles.workflowId, workflowId));
  await db.delete(workflowComments).where(eq(workflowComments.workflowId, workflowId));
  await db.delete(workflowApprovals).where(eq(workflowApprovals.workflowId, workflowId));
  await db.delete(formSubmissions2).where(eq(formSubmissions2.workflowId, workflowId));
  await db.delete(workflowStages).where(eq(workflowStages.workflowId, workflowId));
  await db.delete(workflows).where(eq(workflows.id, workflowId));
}
async function createWorkflowStage(stage) {
  const stageId = randomUUID();
  await db.insert(workflowStages).values({
    id: stageId,
    workflowId: stage.workflowId,
    stageOrder: stage.stageOrder,
    stageName: stage.stageName,
    stageType: stage.stageType,
    requiredRole: stage.requiredRole,
    requiresOneOf: stage.requiresOneOf,
    approvalThreshold: stage.approvalThreshold?.toString(),
    status: "pending"
  });
  const [newStage] = await db.select().from(workflowStages).where(eq(workflowStages.id, stageId)).limit(1);
  return newStage;
}
async function getStagesByWorkflow(workflowId) {
  return await db.select().from(workflowStages).where(eq(workflowStages.workflowId, workflowId)).orderBy(workflowStages.stageOrder);
}
async function getStageById(stageId) {
  const [stage] = await db.select().from(workflowStages).where(eq(workflowStages.id, stageId)).limit(1);
  return stage;
}
async function updateStageStatus(stageId, status) {
  const updates = { status };
  if (status === "in_progress") {
    updates.startedAt = /* @__PURE__ */ new Date();
  } else if (status === "completed" || status === "rejected") {
    updates.completedAt = /* @__PURE__ */ new Date();
  }
  await db.update(workflowStages).set(updates).where(eq(workflowStages.id, stageId));
}
async function checkWorkflowAccess(workflowId, userId, userRole, userDepartment) {
  if (["CEO", "CFO", "COO", "admin"].includes(userRole)) {
    return { hasAccess: true, reason: "C-level or admin access" };
  }
  const workflow = await getWorkflowById(workflowId);
  if (!workflow) {
    return { hasAccess: false, reason: "Workflow not found" };
  }
  if (workflow.requesterId === userId) {
    return { hasAccess: true, reason: "Workflow requester" };
  }
  if (!userDepartment) {
    return { hasAccess: false, reason: "No department assigned" };
  }
  const stages = await getStagesByWorkflow(workflowId);
  const hasVisibleStage = stages.some((stage) => {
    if (!stage.visibleToDepartments || stage.visibleToDepartments.length === 0) {
      return false;
    }
    return stage.visibleToDepartments.includes(userDepartment);
  });
  if (hasVisibleStage) {
    return { hasAccess: true, reason: "Department has stage visibility" };
  }
  return { hasAccess: false, reason: "No visible stages for your department" };
}
async function createApproval(approval) {
  const approvalId = randomUUID();
  await db.insert(workflowApprovals).values({
    id: approvalId,
    workflowId: approval.workflowId,
    stageId: approval.stageId,
    approverId: approval.approverId,
    approverRole: approval.approverRole,
    action: approval.action,
    comments: approval.comments
  });
  const [newApproval] = await db.select().from(workflowApprovals).where(eq(workflowApprovals.id, approvalId)).limit(1);
  return newApproval;
}
async function getApprovalsByWorkflow(workflowId) {
  return await db.select().from(workflowApprovals).where(eq(workflowApprovals.workflowId, workflowId)).orderBy(desc(workflowApprovals.createdAt));
}
async function createWorkflowFile(file) {
  const fileId = randomUUID();
  await db.insert(workflowFiles).values({
    id: fileId,
    workflowId: file.workflowId,
    stageId: file.stageId,
    fileName: file.fileName,
    fileType: file.fileType,
    fileCategory: file.fileCategory,
    s3Bucket: file.s3Bucket,
    s3Key: file.s3Key,
    s3Url: file.s3Url,
    fileSize: file.fileSize,
    mimeType: file.mimeType,
    uploadedBy: file.uploadedBy
  });
  const [newFile] = await db.select().from(workflowFiles).where(eq(workflowFiles.id, fileId)).limit(1);
  return newFile;
}
async function getFilesByWorkflow(workflowId) {
  const files = await db.select({
    file: workflowFiles,
    uploader: {
      id: users.id,
      fullName: users.fullName,
      email: users.email
    }
  }).from(workflowFiles).leftJoin(
    users,
    eq(workflowFiles.uploadedBy, users.id)
  ).where(eq(workflowFiles.workflowId, workflowId)).orderBy(desc(workflowFiles.uploadedAt));
  return files.map(({ file, uploader }) => ({
    ...file,
    uploaderName: uploader?.fullName || uploader?.email || "Unknown",
    uploaderEmail: uploader?.email
  }));
}
async function getFilesByStage(stageId) {
  return await db.select().from(workflowFiles).where(eq(workflowFiles.stageId, stageId)).orderBy(desc(workflowFiles.uploadedAt));
}
async function createComment(comment) {
  const commentId = randomUUID();
  await db.insert(workflowComments).values({
    id: commentId,
    workflowId: comment.workflowId,
    stageId: comment.stageId,
    commentText: comment.commentText,
    commentType: comment.commentType || "general",
    authorId: comment.authorId,
    authorRole: comment.authorRole
  });
  const [newComment] = await db.select().from(workflowComments).where(eq(workflowComments.id, commentId)).limit(1);
  return newComment;
}
async function getCommentsByWorkflow(workflowId) {
  return await db.select().from(workflowComments).where(eq(workflowComments.workflowId, workflowId)).orderBy(desc(workflowComments.createdAt));
}
async function getCommentsByStage(stageId) {
  return await db.select().from(workflowComments).where(eq(workflowComments.stageId, stageId)).orderBy(desc(workflowComments.createdAt));
}
async function createAuditLog(log) {
  const logId = randomUUID();
  await db.insert(auditLogs).values({
    id: logId,
    entityType: log.entityType,
    entityId: log.entityId,
    action: log.action,
    actionDescription: log.actionDescription,
    actorId: log.actorId,
    actorEmail: log.actorEmail,
    actorRole: log.actorRole,
    oldValues: log.oldValues,
    newValues: log.newValues,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent
  });
  const [newLog] = await db.select().from(auditLogs).where(eq(auditLogs.id, logId)).limit(1);
  return newLog;
}
async function getAuditLogsByEntity(entityType, entityId) {
  return await db.select().from(auditLogs).where(
    and(
      eq(auditLogs.entityType, entityType),
      eq(auditLogs.entityId, entityId)
    )
  ).orderBy(desc(auditLogs.createdAt));
}
async function generateWorkflowNumber(type) {
  const today = /* @__PURE__ */ new Date();
  const dateStr = today.toISOString().slice(2, 10).replace(/-/g, "");
  const validTypes = ["MAF", "PR", "CATTO", "SKU", "PAF"];
  const sequenceType = validTypes.includes(type) ? type : "MAF";
  const [counter] = await db.select().from(sequenceCounters).where(
    and(
      eq(sequenceCounters.sequenceType, sequenceType),
      eq(sequenceCounters.sequenceDate, dateStr)
    )
  ).limit(1);
  let nextCounter;
  if (counter) {
    nextCounter = counter.currentCounter + 1;
    await db.update(sequenceCounters).set({ currentCounter: nextCounter }).where(eq(sequenceCounters.id, counter.id));
  } else {
    nextCounter = 1;
    await db.insert(sequenceCounters).values({
      id: randomUUID(),
      sequenceType,
      sequenceDate: dateStr,
      currentCounter: nextCounter
    });
  }
  const paddedCounter = nextCounter.toString().padStart(3, "0");
  return `WFMT-${type}-${dateStr}-${paddedCounter}`;
}
async function getEmailRecipientsByGroup(group) {
  return await db.select().from(emailRecipients).where(
    and(
      eq(emailRecipients.recipientGroup, group),
      eq(emailRecipients.isActive, true)
    )
  );
}
async function getAllEmailRecipients() {
  return await db.select().from(emailRecipients).where(eq(emailRecipients.isActive, true));
}
async function getAllSequenceCounters() {
  return await db.select().from(sequenceCounters).orderBy(desc(sequenceCounters.createdAt));
}
async function getSequenceCountersByType(type) {
  return await db.select().from(sequenceCounters).where(eq(sequenceCounters.sequenceType, type)).orderBy(desc(sequenceCounters.sequenceDate));
}
async function generateSequenceNumber(type) {
  return await generateWorkflowNumber(type);
}
async function resetSequenceCounter(type, date2) {
  const [counter] = await db.select().from(sequenceCounters).where(
    and(
      eq(sequenceCounters.sequenceType, type),
      eq(sequenceCounters.sequenceDate, date2)
    )
  ).limit(1);
  if (counter) {
    await db.update(sequenceCounters).set({ currentCounter: 0 }).where(eq(sequenceCounters.id, counter.id));
  }
}
async function getWorkflowFileById(fileId) {
  const results = await db.select().from(workflowFiles).where(eq(workflowFiles.id, fileId)).limit(1);
  return results[0] || null;
}
async function deleteWorkflowFile(fileId) {
  await db.delete(workflowFiles).where(eq(workflowFiles.id, fileId));
}
async function createFormTemplate(template) {
  const id = randomUUID();
  await db.insert(formTemplates).values({
    ...template,
    id
  });
  const [created] = await db.select().from(formTemplates).where(eq(formTemplates.id, id)).limit(1);
  return created;
}
async function getAllFormTemplates() {
  return await db.select().from(formTemplates).orderBy(desc(formTemplates.createdAt));
}
async function getActiveFormTemplates() {
  return await db.select().from(formTemplates).where(eq(formTemplates.isActive, true)).orderBy(desc(formTemplates.createdAt));
}
async function getFormTemplateById(id) {
  const [template] = await db.select().from(formTemplates).where(eq(formTemplates.id, id)).limit(1);
  return template || null;
}
async function updateFormTemplate(id, updates) {
  await db.update(formTemplates).set(updates).where(eq(formTemplates.id, id));
}
async function deleteFormTemplate(id) {
  await db.delete(formTemplates).where(eq(formTemplates.id, id));
}
async function createFormSubmission(submission) {
  const id = randomUUID();
  await db.insert(formSubmissions2).values({
    ...submission,
    id
  });
  const [created] = await db.select().from(formSubmissions2).where(eq(formSubmissions2.id, id)).limit(1);
  return created;
}
async function getFormSubmissionById(id) {
  const [submission] = await db.select().from(formSubmissions2).where(eq(formSubmissions2.id, id)).limit(1);
  return submission || null;
}
async function getFormSubmissionsByWorkflow(workflowId) {
  return await db.select().from(formSubmissions2).where(eq(formSubmissions2.workflowId, workflowId)).orderBy(desc(formSubmissions2.createdAt));
}
async function getFormSubmissionsForProcessing() {
  return await db.select({
    submission: formSubmissions2,
    template: formTemplates,
    workflow: workflows,
    submitter: users
  }).from(formSubmissions2).innerJoin(
    formTemplates,
    eq(formSubmissions2.templateId, formTemplates.id)
  ).leftJoin(
    workflows,
    eq(formSubmissions2.workflowId, workflows.id)
  ).leftJoin(
    users,
    eq(formSubmissions2.submittedBy, users.id)
  ).orderBy(desc(formSubmissions2.updatedAt));
}
async function getStagesByWorkflowIds(workflowIds) {
  if (workflowIds.length === 0) return [];
  return await db.select().from(workflowStages).where(inArray(workflowStages.workflowId, workflowIds)).orderBy(
    workflowStages.workflowId,
    workflowStages.stageOrder
  );
}
async function updateFormSubmission(id, updates) {
  await db.update(formSubmissions2).set(updates).where(eq(formSubmissions2.id, id));
}
async function deleteFormSubmission(id) {
  await db.delete(formSubmissions2).where(eq(formSubmissions2.id, id));
}
async function getWorkflowAnalytics() {
  const workflows2 = await db.select().from(workflows);
  const total = workflows2.length;
  const inProgress = workflows2.filter(
    (w) => w.overallStatus === "in_progress"
  ).length;
  const completed = workflows2.filter(
    (w) => w.overallStatus === "completed"
  ).length;
  const rejected = workflows2.filter(
    (w) => ["rejected", "cancelled", "discontinued"].includes(w.overallStatus)
  ).length;
  const draft = workflows2.filter((w) => w.overallStatus === "draft").length;
  const completedWorkflows = workflows2.filter(
    (w) => w.overallStatus === "completed"
  );
  let avgApprovalTime = 0;
  if (completedWorkflows.length > 0) {
    const totalTime = completedWorkflows.reduce((sum, w) => {
      const created = new Date(w.createdAt).getTime();
      const updated = new Date(w.updatedAt).getTime();
      return sum + (updated - created);
    }, 0);
    avgApprovalTime = Math.round(
      totalTime / completedWorkflows.length / (1e3 * 60 * 60 * 24)
    );
  }
  return {
    total,
    inProgress,
    completed,
    rejected,
    draft,
    avgApprovalTime
  };
}
async function getWorkflowsByType() {
  const workflows2 = await db.select().from(workflows);
  const byType = {};
  workflows2.forEach((w) => {
    byType[w.type] = (byType[w.type] || 0) + 1;
  });
  return Object.entries(byType).map(([type, count]) => ({ type, count }));
}
async function getWorkflowsByDepartment() {
  const workflows2 = await db.select().from(workflows);
  const byDept = {};
  workflows2.forEach((w) => {
    byDept[w.department] = (byDept[w.department] || 0) + 1;
  });
  return Object.entries(byDept).map(([department, count]) => ({
    department,
    count
  }));
}
async function getWorkflowsByStatus() {
  const workflows2 = await db.select().from(workflows);
  const byStatus = {};
  workflows2.forEach((w) => {
    byStatus[w.overallStatus] = (byStatus[w.overallStatus] || 0) + 1;
  });
  return Object.entries(byStatus).map(([status, count]) => ({ status, count }));
}
async function getAvgApprovalTimeByType() {
  const workflows2 = await db.select().from(workflows);
  const completedWorkflows = workflows2.filter(
    (w) => w.overallStatus === "completed"
  );
  const timeByType = {};
  completedWorkflows.forEach((w) => {
    const created = new Date(w.createdAt).getTime();
    const updated = new Date(w.updatedAt).getTime();
    const days = Math.round((updated - created) / (1e3 * 60 * 60 * 24));
    if (!timeByType[w.type]) {
      timeByType[w.type] = { total: 0, count: 0 };
    }
    timeByType[w.type].total += days;
    timeByType[w.type].count += 1;
  });
  return Object.entries(timeByType).map(([type, data]) => ({
    type,
    avgDays: Math.round(data.total / data.count)
  }));
}
async function getWorkflowCompletionTrend(days = 30) {
  const workflows2 = await db.select().from(workflows);
  const cutoffDate = /* @__PURE__ */ new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const recentWorkflows = workflows2.filter(
    (w) => new Date(w.createdAt) >= cutoffDate
  );
  const byDate = {};
  recentWorkflows.forEach((w) => {
    const date2 = new Date(w.createdAt).toISOString().split("T")[0];
    if (!byDate[date2]) {
      byDate[date2] = { total: 0, completed: 0 };
    }
    byDate[date2].total += 1;
    if (w.overallStatus === "completed") {
      byDate[date2].completed += 1;
    }
  });
  return Object.entries(byDate).map(([date2, data]) => ({
    date: date2,
    total: data.total,
    completed: data.completed,
    completionRate: data.total > 0 ? Math.round(data.completed / data.total * 100) : 0
  })).sort((a, b) => a.date.localeCompare(b.date));
}
async function getWorkflowTimeline() {
  const workflows2 = await db.select().from(workflows).orderBy(desc(workflows.createdAt));
  const timelineData = await Promise.all(
    workflows2.map(async (workflow) => {
      const stages = await db.select().from(workflowStages).where(eq(workflowStages.workflowId, workflow.id)).orderBy(workflowStages.stageOrder);
      const stageTimeline = stages.map((stage, index2) => {
        const startDate = stage.createdAt;
        const endDate = stage.completedAt || /* @__PURE__ */ new Date();
        const duration = Math.round(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1e3 * 60 * 60 * 24)
        );
        return {
          stageName: stage.stageName,
          status: stage.status,
          startDate,
          endDate: stage.completedAt,
          duration,
          stageOrder: stage.stageOrder
        };
      });
      return {
        id: workflow.id,
        workflowNumber: workflow.workflowNumber,
        title: workflow.title,
        type: workflow.type,
        overallStatus: workflow.overallStatus,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        stages: stageTimeline
      };
    })
  );
  return timelineData;
}
async function getUsersByRole(role) {
  return await db.select().from(users).where(eq(users.role, role));
}
async function createWorkflowTemplate(template) {
  const templateId = randomUUID();
  if (template.isDefault) {
    await db.update(workflowTemplates).set({ isDefault: false }).where(eq(workflowTemplates.workflowType, template.workflowType));
  }
  await db.insert(workflowTemplates).values({
    id: templateId,
    name: template.name,
    description: template.description,
    workflowType: template.workflowType,
    isDefault: template.isDefault || false,
    isActive: true,
    createdBy: template.createdBy
  });
  for (const stage of template.stages) {
    const stageId = randomUUID();
    await db.insert(templateStages).values({
      id: stageId,
      templateId,
      stageOrder: stage.stageOrder,
      stageName: stage.stageName,
      stageDescription: stage.stageDescription,
      department: stage.department,
      requiredRole: stage.requiredRole,
      requiresOneOf: stage.requiresOneOf,
      approvalRequired: stage.approvalRequired,
      fileUploadRequired: stage.fileUploadRequired,
      notificationEmails: stage.notificationEmails,
      visibleToDepartments: stage.visibleToDepartments,
      approvalThreshold: stage.approvalThreshold ? stage.approvalThreshold.toString() : void 0
    });
  }
  return { templateId };
}
async function getWorkflowTemplates(filters) {
  let query = db.select().from(workflowTemplates);
  if (filters?.workflowType) {
    query = query.where(
      eq(workflowTemplates.workflowType, filters.workflowType)
    );
  }
  if (filters?.isActive !== void 0) {
    query = query.where(
      eq(workflowTemplates.isActive, filters.isActive)
    );
  }
  if (filters?.isQuickAssignEnabled !== void 0) {
    query = query.where(
      eq(
        workflowTemplates.isQuickAssignEnabled,
        filters.isQuickAssignEnabled
      )
    );
  }
  const templates = await query.orderBy(
    desc(workflowTemplates.createdAt)
  );
  const templatesWithStages = await Promise.all(
    templates.map(async (template) => {
      const stages = await db.select().from(templateStages).where(eq(templateStages.templateId, template.id));
      return { ...template, stages };
    })
  );
  return templatesWithStages;
}
async function getWorkflowTemplateById(templateId) {
  const [template] = await db.select().from(workflowTemplates).where(eq(workflowTemplates.id, templateId)).limit(1);
  if (!template) {
    return null;
  }
  const stages = await db.select().from(templateStages).where(eq(templateStages.templateId, templateId)).orderBy(templateStages.stageOrder);
  return {
    ...template,
    stages
  };
}
async function getDefaultTemplate(workflowType) {
  const [template] = await db.select().from(workflowTemplates).where(
    and(
      eq(workflowTemplates.workflowType, workflowType),
      eq(workflowTemplates.isDefault, true),
      eq(workflowTemplates.isActive, true)
    )
  ).limit(1);
  if (!template) {
    return null;
  }
  const stages = await db.select().from(templateStages).where(eq(templateStages.templateId, template.id)).orderBy(templateStages.stageOrder);
  return {
    ...template,
    stages
  };
}
async function updateWorkflowTemplate(templateId, updates) {
  await db.update(workflowTemplates).set({
    name: updates.name,
    description: updates.description,
    isDefault: updates.isDefault,
    isActive: updates.isActive,
    isQuickAssignEnabled: updates.isQuickAssignEnabled,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(workflowTemplates.id, templateId));
  if (updates.stages) {
    await db.delete(templateStages).where(eq(templateStages.templateId, templateId));
    for (const stage of updates.stages) {
      const stageId = stage.id || randomUUID();
      await db.insert(templateStages).values({
        id: stageId,
        templateId,
        stageOrder: stage.stageOrder,
        stageName: stage.stageName,
        stageDescription: stage.stageDescription,
        department: stage.department,
        requiredRole: stage.requiredRole,
        requiresOneOf: stage.requiresOneOf,
        approvalRequired: stage.approvalRequired,
        fileUploadRequired: stage.fileUploadRequired,
        notificationEmails: stage.notificationEmails,
        visibleToDepartments: stage.visibleToDepartments,
        approvalThreshold: stage.approvalThreshold ? stage.approvalThreshold.toString() : void 0
      });
    }
  }
  return { success: true };
}
async function deleteWorkflowTemplate(templateId) {
  await db.delete(workflowTemplates).where(eq(workflowTemplates.id, templateId));
  return { success: true };
}
async function getDepartmentMetrics(department) {
  const workflows2 = await db.select().from(workflows).where(eq(workflows.department, department));
  const workflowIds = workflows2.map((w) => w.id);
  if (workflowIds.length === 0) {
    return {
      totalWorkflows: 0,
      avgCompletionDays: 0,
      completedCount: 0,
      inProgressCount: 0
    };
  }
  const completedWorkflows = workflows2.filter(
    (w) => w.overallStatus === "completed"
  );
  let avgCompletionDays = 0;
  if (completedWorkflows.length > 0) {
    const completionTimes = await Promise.all(
      completedWorkflows.map(async (workflow) => {
        const logs = await db.select().from(auditLogs).where(
          and(
            eq(auditLogs.entityType, "workflow"),
            eq(auditLogs.entityId, workflow.id)
          )
        ).orderBy(auditLogs.timestamp);
        if (logs.length === 0) return 0;
        const createdLog = logs.find((log) => log.action === "created");
        const completedLog = logs.find(
          (log) => log.action === "completed" || log.actionDescription?.includes("completed")
        );
        if (!createdLog) return 0;
        const startTime = new Date(createdLog.timestamp).getTime();
        const endTime = completedLog ? new Date(completedLog.timestamp).getTime() : new Date(workflow.updatedAt).getTime();
        return (endTime - startTime) / (1e3 * 60 * 60 * 24);
      })
    );
    avgCompletionDays = Math.round(
      completionTimes.reduce((sum, days) => sum + days, 0) / completionTimes.length
    );
  }
  return {
    totalWorkflows: workflows2.length,
    avgCompletionDays,
    completedCount: completedWorkflows.length,
    inProgressCount: workflows2.filter((w) => w.overallStatus === "in_progress").length
  };
}
async function getDepartmentCostBreakdown(department, period) {
  const workflows2 = await db.select().from(workflows).where(eq(workflows.department, department));
  if (workflows2.length === 0) {
    return [];
  }
  const workflowIds = workflows2.map((w) => w.id);
  const submissions = await db.select().from(formSubmissions2).where(
    sql`${formSubmissions2.workflowId} IN (${sql.join(
      workflowIds.map((id) => sql`${id}`),
      sql`, `
    )})`
  );
  const costData = [];
  const periodMap = /* @__PURE__ */ new Map();
  for (const submission of submissions) {
    const formData = submission.formData;
    let cost = 0;
    if (formData) {
      const costFields = [
        "price",
        "amount",
        "cost",
        "total",
        "totalAmount",
        "totalCost"
      ];
      for (const field of costFields) {
        if (formData[field] && !isNaN(Number(formData[field]))) {
          cost = Number(formData[field]);
          break;
        }
      }
    }
    if (cost > 0 && submission.submittedAt) {
      const date2 = new Date(submission.submittedAt);
      let periodKey;
      if (period === "monthly") {
        periodKey = `${date2.getFullYear()}-${String(date2.getMonth() + 1).padStart(2, "0")}`;
      } else {
        periodKey = String(date2.getFullYear());
      }
      const existing = periodMap.get(periodKey) || { totalCost: 0, count: 0 };
      periodMap.set(periodKey, {
        totalCost: existing.totalCost + cost,
        count: existing.count + 1
      });
    }
  }
  for (const [periodKey, data] of periodMap.entries()) {
    costData.push({
      period: periodKey,
      totalCost: Math.round(data.totalCost),
      count: data.count
    });
  }
  return costData.sort((a, b) => a.period.localeCompare(b.period));
}
async function createBudget(data) {
  const [budget] = await db.insert(departmentBudgets).values({
    id: generateId(),
    department: data.department,
    year: data.year,
    month: data.month || null,
    quarter: data.quarter || null,
    allocatedAmount: data.allocatedAmount,
    period: data.period,
    createdAt: /* @__PURE__ */ new Date()
  }).returning();
  return budget;
}
async function getBudgetsByDepartment(department, year) {
  return await db.select().from(departmentBudgets).where(
    and(
      eq(departmentBudgets.department, department),
      eq(departmentBudgets.year, year)
    )
  ).orderBy(departmentBudgets.period, departmentBudgets.month);
}
async function getAllBudgets(year) {
  return await db.select().from(departmentBudgets).where(eq(departmentBudgets.year, year)).orderBy(departmentBudgets.department, departmentBudgets.period);
}
async function updateBudget(id, allocatedAmount) {
  const [budget] = await db.update(departmentBudgets).set({ allocatedAmount, updatedAt: /* @__PURE__ */ new Date() }).where(eq(departmentBudgets.id, id)).returning();
  return budget;
}
async function deleteBudget(id) {
  await db.delete(departmentBudgets).where(eq(departmentBudgets.id, id));
}
async function getDepartmentBudgetAnalytics(department, year, period) {
  const budgets = await db.select().from(departmentBudgets).where(
    and(
      eq(departmentBudgets.department, department),
      eq(departmentBudgets.year, year),
      eq(departmentBudgets.period, period)
    )
  );
  const workflows2 = await db.select().from(workflowsTable).where(eq(workflowsTable.department, department));
  const workflowIds = workflows2.map((w) => w.id);
  const submissions = workflowIds.length > 0 ? await db.select().from(formSubmissions).where(sql`${formSubmissions.workflowId} IN ${workflowIds}`) : [];
  const spendingMap = /* @__PURE__ */ new Map();
  for (const submission of submissions) {
    const formData = submission.formData;
    let cost = 0;
    if (formData) {
      const costFields = [
        "actualCost",
        "price",
        "amount",
        "cost",
        "total",
        "totalAmount",
        "totalCost"
      ];
      for (const field of costFields) {
        if (formData[field] && !isNaN(Number(formData[field]))) {
          cost = Number(formData[field]);
          break;
        }
      }
    }
    if (cost > 0 && submission.submittedAt) {
      const date2 = new Date(submission.submittedAt);
      if (date2.getFullYear() !== year) continue;
      let periodKey;
      if (period === "monthly") {
        periodKey = String(date2.getMonth() + 1);
      } else if (period === "quarterly") {
        periodKey = String(Math.floor(date2.getMonth() / 3) + 1);
      } else {
        periodKey = "year";
      }
      spendingMap.set(periodKey, (spendingMap.get(periodKey) || 0) + cost);
    }
  }
  const analytics = budgets.map((budget) => {
    let periodKey;
    if (period === "monthly") {
      periodKey = String(budget.month);
    } else if (period === "quarterly") {
      periodKey = String(budget.quarter);
    } else {
      periodKey = "year";
    }
    const actualSpending = spendingMap.get(periodKey) || 0;
    const percentage = budget.allocatedAmount > 0 ? Math.round(actualSpending / budget.allocatedAmount * 100) : 0;
    return {
      id: budget.id,
      period: periodKey,
      periodLabel: period === "monthly" ? `Month ${budget.month}` : period === "quarterly" ? `Q${budget.quarter}` : `Year ${year}`,
      allocatedAmount: budget.allocatedAmount,
      actualSpending: Math.round(actualSpending),
      percentage,
      isOverBudget: actualSpending > budget.allocatedAmount
    };
  });
  return analytics;
}
async function createExcelTemplate(template) {
  const [result] = await db.insert(excelTemplates).values({
    ...template,
    uploadedAt: /* @__PURE__ */ new Date(),
    isActive: true
  });
  return result;
}
async function getAllExcelTemplates() {
  return await db.select({
    id: excelTemplates.id,
    workflowType: excelTemplates.workflowType,
    templateName: excelTemplates.templateName,
    description: excelTemplates.description,
    fileUrl: excelTemplates.fileUrl,
    fileKey: excelTemplates.fileKey,
    fileName: excelTemplates.fileName,
    fileSize: excelTemplates.fileSize,
    uploadedAt: excelTemplates.uploadedAt,
    isActive: excelTemplates.isActive,
    formTemplateId: excelTemplates.formTemplateId,
    workbookMappings: excelTemplates.workbookMappings,
    workbookMetadata: excelTemplates.workbookMetadata,
    outputFileNamePattern: excelTemplates.outputFileNamePattern,
    uploaderName: users.fullName,
    uploaderEmail: users.email
  }).from(excelTemplates).leftJoin(
    users,
    eq(excelTemplates.uploadedBy, users.id)
  ).orderBy(desc(excelTemplates.uploadedAt));
}
async function getActiveExcelTemplates() {
  return await db.select({
    id: excelTemplates.id,
    workflowType: excelTemplates.workflowType,
    templateName: excelTemplates.templateName,
    description: excelTemplates.description,
    fileUrl: excelTemplates.fileUrl,
    fileName: excelTemplates.fileName,
    fileSize: excelTemplates.fileSize,
    uploadedAt: excelTemplates.uploadedAt,
    isActive: excelTemplates.isActive
  }).from(excelTemplates).where(eq(excelTemplates.isActive, true)).orderBy(desc(excelTemplates.uploadedAt));
}
async function getExcelTemplateByWorkflowType(workflowType) {
  const [template] = await db.select().from(excelTemplates).where(
    and(
      eq(excelTemplates.workflowType, workflowType),
      eq(excelTemplates.isActive, true)
    )
  ).orderBy(desc(excelTemplates.uploadedAt)).limit(1);
  return template || null;
}
async function getExcelTemplateById(id) {
  const [template] = await db.select().from(excelTemplates).where(eq(excelTemplates.id, id)).limit(1);
  return template || null;
}
async function getExcelTemplatesByFormTemplate(formTemplateId) {
  return await db.select({
    id: excelTemplates.id,
    templateName: excelTemplates.templateName,
    formTemplateId: excelTemplates.formTemplateId
  }).from(excelTemplates).where(
    and(
      eq(excelTemplates.formTemplateId, formTemplateId),
      eq(excelTemplates.isActive, true)
    )
  ).orderBy(desc(excelTemplates.uploadedAt));
}
async function updateExcelTemplate(id, updates) {
  await db.update(excelTemplates).set(updates).where(eq(excelTemplates.id, id));
}
async function deleteExcelTemplate(id) {
  await db.delete(excelTemplates).where(eq(excelTemplates.id, id));
}
async function createTaskAssignment(data) {
  const assignment = {
    id: randomUUID(),
    ...data
  };
  await db.insert(taskAssignments).values(assignment);
  return assignment;
}
async function getTaskAssignmentsByUser(userId) {
  return await db.select({
    assignment: taskAssignments,
    workflow: workflows
  }).from(taskAssignments).leftJoin(
    workflows,
    eq(taskAssignments.workflowId, workflows.id)
  ).where(eq(taskAssignments.assignedTo, userId)).orderBy(desc(taskAssignments.assignedAt));
}
async function getTeamAssignments(managerId) {
  return await db.select({
    assignment: taskAssignments,
    workflow: workflows,
    assignedUser: users
  }).from(taskAssignments).leftJoin(
    workflows,
    eq(taskAssignments.workflowId, workflows.id)
  ).leftJoin(
    users,
    eq(taskAssignments.assignedTo, users.id)
  ).where(eq(taskAssignments.assignedBy, managerId)).orderBy(desc(taskAssignments.assignedAt));
}
async function calculateUserMetrics(userId) {
  const now = /* @__PURE__ */ new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedWorkflows = await db.select({
    id: workflows.id,
    createdAt: workflows.createdAt,
    completedAt: workflows.completedAt
  }).from(workflows).where(
    and(
      eq(workflows.createdBy, userId),
      eq(workflows.status, "completed")
    )
  );
  const avgCompletionHours = completedWorkflows.length > 0 ? completedWorkflows.reduce((sum, w) => {
    const hours = (new Date(w.completedAt).getTime() - new Date(w.createdAt).getTime()) / (1e3 * 60 * 60);
    return sum + hours;
  }, 0) / completedWorkflows.length : null;
  const tasksCompletedThisMonth = await db.select({ count: sql`count(*)` }).from(workflows).where(
    and(
      eq(workflows.createdBy, userId),
      eq(workflows.status, "completed"),
      sql`${workflows.completedAt} >= ${monthStart.toISOString()}`
    )
  ).then((rows) => rows[0]?.count || 0);
  const inProgressWorkflows = await db.select({
    id: workflows.id,
    createdAt: workflows.createdAt
  }).from(workflows).where(
    and(
      eq(workflows.createdBy, userId),
      eq(workflows.status, "in_progress")
    )
  );
  let longestStuckHours = null;
  let longestStuckWorkflowId = null;
  if (inProgressWorkflows.length > 0) {
    const longestStuck = inProgressWorkflows.reduce(
      (longest, w) => {
        const hours = (now.getTime() - new Date(w.createdAt).getTime()) / (1e3 * 60 * 60);
        return hours > (longest.hours || 0) ? { hours, id: w.id } : longest;
      },
      { hours: 0, id: "" }
    );
    longestStuckHours = longestStuck.hours;
    longestStuckWorkflowId = longestStuck.id;
  }
  const rejectedCount = await db.select({ count: sql`count(*)` }).from(workflows).where(
    and(
      eq(workflows.createdBy, userId),
      eq(workflows.status, "rejected")
    )
  ).then((rows) => rows[0]?.count || 0);
  const metrics = {
    userId,
    avgCompletionHours: avgCompletionHours ? avgCompletionHours.toFixed(2) : null,
    tasksCompletedThisMonth,
    longestStuckHours: longestStuckHours ? longestStuckHours.toFixed(2) : null,
    longestStuckWorkflowId,
    rejectedCount,
    lastCalculated: /* @__PURE__ */ new Date()
  };
  await db.insert(userPerformanceMetrics).values(metrics).onDuplicateKeyUpdate({
    set: metrics
  });
  return metrics;
}
async function getUserMetrics(userId) {
  const [metrics] = await db.select().from(userPerformanceMetrics).where(eq(userPerformanceMetrics.userId, userId)).limit(1);
  return metrics || null;
}
async function recalculateAllMetrics() {
  const users2 = await db.select({ id: users.id }).from(users).where(eq(users.isActive, true));
  for (const user of users2) {
    await calculateUserMetrics(user.id);
  }
  return { success: true, usersProcessed: users2.length };
}
async function upsertSalaryCache(data) {
  const salary = {
    ...data,
    currency: data.currency || "IDR",
    lastSynced: /* @__PURE__ */ new Date()
  };
  await db.insert(salaryCache).values(salary).onDuplicateKeyUpdate({
    set: salary
  });
  return salary;
}
async function getUserSalary(userId) {
  const [salary] = await db.select().from(salaryCache).where(eq(salaryCache.userId, userId)).limit(1);
  return salary || null;
}
async function getUserListPaginated(params) {
  const { page, pageSize, department, managerId } = params;
  const offset = (page - 1) * pageSize;
  let query = db.select({
    user: users,
    metrics: userPerformanceMetrics,
    salary: salaryCache
  }).from(users).leftJoin(
    userPerformanceMetrics,
    eq(users.id, userPerformanceMetrics.userId)
  ).leftJoin(
    salaryCache,
    eq(users.id, salaryCache.userId)
  ).where(eq(users.isActive, true));
  if (department && department !== "My Team") {
    query = query.where(eq(users.role, department));
  }
  if (department === "My Team" && managerId) {
    const assignedUserIds = await db.select({ userId: taskAssignments.assignedTo }).from(taskAssignments).where(eq(taskAssignments.assignedBy, managerId)).then((rows) => rows.map((r) => r.userId));
    if (assignedUserIds.length > 0) {
      query = query.where(
        sql`${users.id} IN (${assignedUserIds.join(",")})`
      );
    } else {
      return { users: [], total: 0 };
    }
  }
  const totalQuery = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.isActive, true));
  const total = totalQuery[0]?.count || 0;
  const results = await query.limit(pageSize).offset(offset).orderBy(users.fullName);
  const users2 = results.map((row) => ({
    id: row.user.id,
    fullName: row.user.fullName,
    email: row.user.email,
    role: row.user.role,
    department: row.user.role,
    // Use role as department for now
    activeTaskCount: 0,
    // TODO: Calculate from workflows
    salary: row.salary?.salary || null
  }));
  return { users: users2, total };
}
async function createRecurringWorkflow(data) {
  const id = randomUUID();
  let nextScheduledDate = new Date(data.startDate);
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  if (nextScheduledDate < today) {
    if (data.frequency === "daily") {
      nextScheduledDate = new Date(today);
      nextScheduledDate.setDate(nextScheduledDate.getDate() + 1);
    } else if (data.frequency === "weekly" && data.dayOfWeek !== void 0) {
      nextScheduledDate = new Date(today);
      const daysUntilTarget = (data.dayOfWeek - nextScheduledDate.getDay() + 7) % 7;
      nextScheduledDate.setDate(
        nextScheduledDate.getDate() + (daysUntilTarget || 7)
      );
    } else if (data.frequency === "monthly" && data.dayOfMonth !== void 0) {
      nextScheduledDate = new Date(today);
      nextScheduledDate.setDate(data.dayOfMonth);
      if (nextScheduledDate <= today) {
        nextScheduledDate.setMonth(nextScheduledDate.getMonth() + 1);
      }
    }
  }
  await db.insert(recurringWorkflows).values({
    id,
    templateId: data.templateId,
    title: data.title,
    description: data.description,
    department: data.department,
    frequency: data.frequency,
    dayOfMonth: data.dayOfMonth,
    dayOfWeek: data.dayOfWeek,
    startDate: data.startDate,
    endDate: data.endDate,
    nextScheduledDate,
    createdBy: data.createdBy,
    assignedTo: data.assignedTo,
    formTemplateId: data.formTemplateId,
    formData: data.formData,
    contingencyWorkflowIds: data.contingencyWorkflowIds,
    isActive: true,
    isPaused: false
  });
  const [created] = await db.select().from(recurringWorkflows).where(eq(recurringWorkflows.id, id)).limit(1);
  return created;
}
async function getRecurringWorkflowsByUser(userId) {
  const workflows2 = await db.select().from(recurringWorkflows).where(
    and(
      eq(recurringWorkflows.createdBy, userId),
      eq(recurringWorkflows.isActive, true)
    )
  ).orderBy(desc(recurringWorkflows.nextScheduledDate));
  return workflows2;
}
async function getRecurringWorkflowById(id) {
  const [workflow] = await db.select().from(recurringWorkflows).where(eq(recurringWorkflows.id, id)).limit(1);
  return workflow;
}
async function updateRecurringWorkflow(id, data) {
  await db.update(recurringWorkflows).set({
    ...data,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(recurringWorkflows.id, id));
  const [updated] = await db.select().from(recurringWorkflows).where(eq(recurringWorkflows.id, id)).limit(1);
  return updated;
}
async function pauseRecurringWorkflow(id) {
  await db.update(recurringWorkflows).set({ isPaused: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(recurringWorkflows.id, id));
}
async function resumeRecurringWorkflow(id) {
  await db.update(recurringWorkflows).set({ isPaused: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(recurringWorkflows.id, id));
}
async function deleteRecurringWorkflow(id) {
  await db.update(recurringWorkflows).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(recurringWorkflows.id, id));
}
async function getRecurringWorkflowHistory(recurringWorkflowId) {
  const history = await db.select().from(recurringWorkflowHistory).where(
    eq(
      recurringWorkflowHistory.recurringWorkflowId,
      recurringWorkflowId
    )
  ).orderBy(desc(recurringWorkflowHistory.scheduledDate)).limit(50);
  return history;
}
async function createSignedDocument(doc) {
  const id = randomUUID();
  const now = /* @__PURE__ */ new Date();
  await db.insert(signedDocuments).values({
    id,
    workflowId: doc.workflowId,
    documentName: doc.documentName,
    s3Key: doc.s3Key,
    s3Url: doc.s3Url,
    uploadedS3Key: doc.uploadedS3Key || null,
    uploadedS3Url: doc.uploadedS3Url || null,
    helloDocDocumentId: doc.helloDocDocumentId || null,
    signerId: doc.signerId,
    signerEmail: doc.signerEmail,
    signerName: doc.signerName,
    status: "awaiting_hellodoc_id",
    signedAt: null,
    sentAt: null,
    createdAt: now,
    updatedAt: now
  });
  return id;
}
async function getSignedDocumentsByWorkflow(workflowId) {
  return db.select().from(signedDocuments).where(eq(signedDocuments.workflowId, workflowId)).orderBy(desc(signedDocuments.createdAt));
}
async function updateSignedDocumentStatus(id, status, signedAt) {
  await db.update(signedDocuments).set({
    status,
    signedAt: signedAt || null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(signedDocuments.id, id));
}
async function getSignedDocumentByHelloDocId(helloDocDocumentId) {
  const [doc] = await db.select().from(signedDocuments).where(eq(signedDocuments.helloDocDocumentId, helloDocDocumentId)).limit(1);
  return doc;
}
async function getAllSignedDocuments(userId, status, search) {
  let query = db.select().from(signedDocuments).where(eq(signedDocuments.signerId, userId));
  if (status && status !== "all") {
    query = query.where(
      and(
        eq(signedDocuments.signerId, userId),
        eq(signedDocuments.status, status)
      )
    );
  }
  if (search) {
    query = query.where(
      and(
        eq(signedDocuments.signerId, userId),
        sql`(${signedDocuments.documentName} LIKE ${`%${search}%`} OR ${signedDocuments.signerEmail} LIKE ${`%${search}%`})`
      )
    );
  }
  return query.orderBy(desc(signedDocuments.createdAt));
}
async function getSignedDocumentsBySender(userId) {
  return db.select().from(signedDocuments).where(eq(signedDocuments.signerId, userId)).orderBy(desc(signedDocuments.createdAt));
}
async function updateSignedDocumentHelloDocId(id, helloDocDocumentId) {
  await db.update(signedDocuments).set({
    helloDocDocumentId,
    status: "pending",
    sentAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(signedDocuments.id, id));
}
async function createDocumentTemplate(template) {
  await db.insert(documentTemplates).values(template);
  return template.id;
}
async function getAllDocumentTemplates(userId) {
  let query = db.select().from(documentTemplates).where(eq(documentTemplates.isActive, true));
  if (userId) {
    query = query.where(
      and(
        eq(documentTemplates.isActive, true),
        eq(documentTemplates.createdBy, userId)
      )
    );
  }
  return query.orderBy(desc(documentTemplates.createdAt));
}
async function getDocumentTemplateById(id) {
  const [template] = await db.select().from(documentTemplates).where(eq(documentTemplates.id, id)).limit(1);
  return template;
}
async function updateDocumentTemplate(id, updates) {
  await db.update(documentTemplates).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(documentTemplates.id, id));
}
async function deleteDocumentTemplate(id) {
  await db.update(documentTemplates).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(documentTemplates.id, id));
}
async function getAllSignedDocumentsForCFO() {
  return db.select({
    id: signedDocuments.id,
    documentName: signedDocuments.documentName,
    uploadedS3Url: signedDocuments.uploadedS3Url,
    signerEmail: signedDocuments.signerEmail,
    signerName: signedDocuments.signerName,
    status: signedDocuments.status,
    createdAt: signedDocuments.createdAt,
    uploaderName: users.fullName,
    uploaderEmail: users.email
  }).from(signedDocuments).leftJoin(
    users,
    eq(signedDocuments.signerId, users.id)
  ).orderBy(desc(signedDocuments.createdAt));
}
var mysqlPool, connection, db, excelMappingSchemaPromise;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    mysqlPool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    connection = mysqlPool;
    db = drizzle(connection, { schema: schema_exports, mode: "default" });
    excelMappingSchemaPromise = null;
  }
});

// server/microsoft-graph.ts
function graphConfiguration() {
  const tenantId2 = process.env.GRAPH_TENANT_ID || process.env.ENTRA_TENANT_ID;
  const clientId2 = process.env.GRAPH_CLIENT_ID || process.env.ENTRA_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;
  const senderMailbox = process.env.GRAPH_SENDER_MAILBOX;
  if (!tenantId2 || !clientId2 || !clientSecret) {
    throw new Error(
      "Microsoft Graph is not configured. Set GRAPH_TENANT_ID, GRAPH_CLIENT_ID and GRAPH_CLIENT_SECRET."
    );
  }
  return { tenantId: tenantId2, clientId: clientId2, clientSecret, senderMailbox };
}
async function getGraphAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 6e4) {
    return cachedToken.accessToken;
  }
  const { tenantId: tenantId2, clientId: clientId2, clientSecret } = graphConfiguration();
  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId2}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId2,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        scope: "https://graph.microsoft.com/.default"
      })
    }
  );
  if (!response.ok) {
    throw new Error(
      `Microsoft Graph token request failed (${response.status}): ${await response.text()}`
    );
  }
  const result = await response.json();
  cachedToken = {
    accessToken: result.access_token,
    expiresAt: Date.now() + result.expires_in * 1e3
  };
  return cachedToken.accessToken;
}
async function graphRequest(pathOrUrl, init) {
  const token = await getGraphAccessToken();
  const url = pathOrUrl.startsWith("https://graph.microsoft.com/") ? pathOrUrl : `https://graph.microsoft.com/v1.0${pathOrUrl}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...init?.headers
    }
  });
  if (!response.ok) {
    throw new Error(
      `Microsoft Graph request failed (${response.status}): ${await response.text()}`
    );
  }
  if (response.status === 202 || response.status === 204) return void 0;
  return await response.json();
}
function extractEmail(value) {
  if (!value) return void 0;
  return value.match(/<([^>]+)>/)?.[1] || value;
}
async function sendGraphEmail(options) {
  const { senderMailbox } = graphConfiguration();
  if (!senderMailbox) {
    throw new Error(
      "Set GRAPH_SENDER_MAILBOX before sending Microsoft 365 email."
    );
  }
  const replyTo = extractEmail(options.replyTo);
  await graphRequest(
    `/users/${encodeURIComponent(senderMailbox)}/sendMail`,
    {
      method: "POST",
      body: JSON.stringify({
        message: {
          subject: options.subject,
          body: { contentType: "HTML", content: options.htmlBody },
          toRecipients: options.to.map((address) => ({
            emailAddress: { address }
          })),
          ...replyTo ? { replyTo: [{ emailAddress: { address: replyTo } }] } : {}
        },
        saveToSentItems: true
      })
    }
  );
}
async function listMicrosoftDirectoryUsers() {
  const users2 = [];
  let nextUrl = "/users?$select=id,displayName,mail,userPrincipalName,accountEnabled&$top=100";
  while (nextUrl) {
    const page = await graphRequest(nextUrl);
    users2.push(...page.value);
    nextUrl = page["@odata.nextLink"];
  }
  return users2;
}
var cachedToken;
var init_microsoft_graph = __esm({
  "server/microsoft-graph.ts"() {
    "use strict";
    cachedToken = null;
  }
});

// server/email.ts
var email_exports = {};
__export(email_exports, {
  sendCompletionEmail: () => sendCompletionEmail,
  sendDeadlineReminderEmail: () => sendDeadlineReminderEmail,
  sendMilestoneCompletionEmail: () => sendMilestoneCompletionEmail,
  sendRejectionEmail: () => sendRejectionEmail,
  sendSignedDocumentEmail: () => sendSignedDocumentEmail
});
import { randomUUID as randomUUID2 } from "crypto";
async function sendEmail2(fromEmail, toEmail, subject, html, template, workflowId) {
  const logId = randomUUID2();
  try {
    await sendGraphEmail({
      replyTo: fromEmail,
      to: [toEmail],
      subject,
      htmlBody: html
    });
    await db.insert(emailLogs).values({
      id: logId,
      recipientEmail: toEmail,
      subject,
      template,
      workflowId: workflowId || null,
      status: "sent",
      messageId: null,
      sentAt: /* @__PURE__ */ new Date()
    });
    console.log(`\u2705 Microsoft Graph email accepted for ${toEmail}`);
    return { success: true };
  } catch (error) {
    await db.insert(emailLogs).values({
      id: logId,
      recipientEmail: toEmail,
      subject,
      template,
      workflowId: workflowId || null,
      status: "failed",
      errorMessage: error.message,
      sentAt: /* @__PURE__ */ new Date()
    });
    console.error(
      `\u274C Failed to send email from ${fromEmail} to ${toEmail}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
}
async function sendMilestoneCompletionEmail(data, workflowId, senderEmail) {
  const subject = `[Action Required] ${data.workflowNumber}: ${data.milestoneName}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Action Required</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">Hello ${data.approverName},</p>
              
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">
                <strong>${data.completedBy}</strong> has completed a milestone in the workflow <strong>${data.workflowTitle}</strong>.
                Your approval is now required for the next stage.
              </p>
              
              <!-- Workflow Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Workflow Number:</strong> ${data.workflowNumber}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Title:</strong> ${data.workflowTitle}</p>
                    <p style="margin: 0; color: #666666; font-size: 14px;"><strong>Current Stage:</strong> ${data.milestoneName}</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.workflowUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Review Workflow</a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #666666; margin: 20px 0 0 0;">
                Please review and approve this workflow at your earliest convenience.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This is an automated notification from CJB Workflow Hub
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Compawnion Jadi Berkat
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  await sendEmail2(
    senderEmail,
    data.approverEmail,
    subject,
    html,
    "milestone_completion",
    workflowId
  );
}
async function sendRejectionEmail(data, workflowId, senderEmail) {
  const subject = `[Rejected] ${data.workflowNumber}: ${data.workflowTitle}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Workflow Rejected</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">Hello ${data.creatorName},</p>
              
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">
                Your workflow <strong>${data.workflowTitle}</strong> has been rejected by <strong>${data.rejectedBy}</strong> at the <strong>${data.milestoneName}</strong> stage.
              </p>
              
              <!-- Workflow Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff5f5; border-left: 4px solid #f5576c; margin: 20px 0; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Workflow Number:</strong> ${data.workflowNumber}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Title:</strong> ${data.workflowTitle}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Rejected Stage:</strong> ${data.milestoneName}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Rejected By:</strong> ${data.rejectedBy}</p>
                    <p style="margin: 0; color: #666666; font-size: 14px;"><strong>Reason:</strong></p>
                    <p style="margin: 10px 0 0 0; color: #333333; font-size: 14px; font-style: italic;">"${data.rejectionReason}"</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.workflowUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">View Workflow</a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #666666; margin: 20px 0 0 0;">
                Please review the rejection reason and make necessary adjustments before resubmitting.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This is an automated notification from CJB Workflow Hub
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Compawnion Jadi Berkat
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  await sendEmail2(
    senderEmail,
    data.creatorEmail,
    subject,
    html,
    "workflow_rejection",
    workflowId
  );
}
async function sendCompletionEmail(data, workflowId, senderEmail) {
  const subject = `[Completed] ${data.workflowNumber}: ${data.workflowTitle}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">\u2713 Workflow Completed</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">Hello ${data.recipientName},</p>
              
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">
                Great news! Your workflow <strong>${data.workflowTitle}</strong> has been completed successfully.
                All approval stages have been finalized.
              </p>
              
              <!-- Workflow Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #38ef7d; margin: 20px 0; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Workflow Number:</strong> ${data.workflowNumber}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Title:</strong> ${data.workflowTitle}</p>
                    <p style="margin: 0; color: #666666; font-size: 14px;"><strong>Completed At:</strong> ${data.completedAt}</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.workflowUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">View Workflow</a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #666666; margin: 20px 0 0 0;">
                You can now proceed with the next steps for this workflow.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This is an automated notification from CJB Workflow Hub
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Compawnion Jadi Berkat
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  await sendEmail2(
    senderEmail,
    data.recipientEmail,
    subject,
    html,
    "workflow_completion",
    workflowId
  );
}
async function sendDeadlineReminderEmail(data, workflowId, senderEmail) {
  const subject = `[Reminder] ${data.workflowNumber}: Deadline Approaching (${data.hoursRemaining}h remaining)`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">\u23F0 Deadline Reminder</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">Hello ${data.approverName},</p>
              
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">
                This is a friendly reminder that the workflow <strong>${data.workflowTitle}</strong> is approaching its deadline.
                Your approval is still pending.
              </p>
              
              <!-- Workflow Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-left: 4px solid #ffd200; margin: 20px 0; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Workflow Number:</strong> ${data.workflowNumber}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Title:</strong> ${data.workflowTitle}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Current Stage:</strong> ${data.milestoneName}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Due Date:</strong> ${data.dueDate}</p>
                    <p style="margin: 0; color: #d97706; font-size: 16px; font-weight: 600;"><strong>Time Remaining:</strong> ${data.hoursRemaining} hours</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.workflowUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Review Now</a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #666666; margin: 20px 0 0 0;">
                Please review and approve this workflow as soon as possible to avoid delays.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This is an automated notification from CJB Workflow Hub
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Compawnion Jadi Berkat
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  await sendEmail2(
    senderEmail,
    data.approverEmail,
    subject,
    html,
    "deadline_reminder",
    workflowId
  );
}
async function sendSignedDocumentEmail(toEmail, toName, documentName, documentUrl, workflowId) {
  const systemEmail = process.env.SYSTEM_EMAIL || "noreply@compawnion.co";
  const subject = `Document Signed: ${documentName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .button { 
          display: inline-block; 
          background-color: #1e3a8a; 
          color: white; 
          padding: 12px 30px; 
          text-decoration: none; 
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Document Successfully Signed</h1>
        </div>
        <div class="content">
          <p>Dear ${toName},</p>
          
          <p>Your document has been successfully signed via HelloDoc e-signature service.</p>
          
          <p><strong>Document Name:</strong> ${documentName}</p>
          <p><strong>Workflow ID:</strong> ${workflowId}</p>
          <p><strong>Signed Date:</strong> ${(/* @__PURE__ */ new Date()).toLocaleString(
    "en-US",
    {
      timeZone: "Asia/Jakarta",
      dateStyle: "long",
      timeStyle: "short"
    }
  )}</p>
          
          <p>The signed document has been securely stored and is available for download:</p>
          
          <div style="text-align: center;">
            <a href="${documentUrl}" class="button">Download Signed Document</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            <strong>Note:</strong> This document is stored securely in our system. 
            For privacy reasons, it is not accessible through the workflow interface. 
            Please save this email or download the document now if you need future access.
          </p>
        </div>
        <div class="footer">
          <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Compawnion Jadi Berkat. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail2(
    systemEmail,
    toEmail,
    subject,
    html,
    "workflow_completion",
    workflowId
  );
}
var init_email = __esm({
  "server/email.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_microsoft_graph();
  }
});

// shared/excelMapping.ts
import { z as z4 } from "zod";
function sanitizeFilename(filename) {
  return filename.replace(/[\/\\:*?"<>|]/g, "_").replace(/^\.+/, "").replace(/\s+/g, "_").substring(0, 255);
}
function looksLikeFormula(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return /^[=+\-@]/.test(trimmed);
}
function convertValueForExcel(value, valueType = "auto") {
  if (looksLikeFormula(value)) {
    return `'${value}`;
  }
  switch (valueType) {
    case "text":
      return String(value);
    case "number":
      const num = Number(value);
      return isNaN(num) ? value : num;
    case "date":
      if (value instanceof Date) return value;
      const date2 = new Date(value);
      return isNaN(date2.getTime()) ? value : date2;
    case "auto":
    default:
      if (typeof value === "number") return value;
      return value;
  }
}
function getBuiltinValue(key, context) {
  switch (key) {
    case "workflow_number":
      return context.workflowNumber || "";
    case "workflow_title":
      return context.workflowTitle || "";
    case "workflow_status":
      return context.workflowStatus || "";
    case "department":
      return context.department || "";
    case "submitter_name":
      return context.submitterName || "";
    case "submitter_email":
      return context.submitterEmail || "";
    case "submitted_at":
      return context.submittedAt || null;
    case "created_at":
      return context.createdAt || null;
    case "updated_at":
      return context.updatedAt || null;
    default:
      return null;
  }
}
var BUILTIN_MAPPING_KEYS, cellAddressRegex, cellAddressSchema, sheetNameSchema, identifierSchema, mappingKeySchema, cellMappingSchema, namedRangeMappingSchema, tableColumnMappingSchema, excelWorkbookMappingSchema, excelWorkbookMappingsSchema, workbookMetadataSchema;
var init_excelMapping = __esm({
  "shared/excelMapping.ts"() {
    "use strict";
    BUILTIN_MAPPING_KEYS = [
      "workflow_number",
      "workflow_title",
      "workflow_status",
      "department",
      "submitter_name",
      "submitter_email",
      "submitted_at",
      "created_at",
      "updated_at"
    ];
    cellAddressRegex = /^[A-Z]+\d+$/;
    cellAddressSchema = z4.string().regex(cellAddressRegex, "Invalid cell address format (e.g., A1, B5)");
    sheetNameSchema = z4.string().min(1).max(31).regex(/^[^\[\]:\*?/\\]+$/, "Invalid sheet name");
    identifierSchema = z4.string().min(1).max(255);
    mappingKeySchema = z4.string().min(1).max(255).regex(
      /^[a-zA-Z0-9_]+$/,
      "Mapping key must contain only alphanumeric and underscore"
    );
    cellMappingSchema = z4.object({
      mappingKey: mappingKeySchema,
      targetType: z4.literal("cell"),
      sheetName: sheetNameSchema,
      cellAddress: cellAddressSchema,
      valueType: z4.enum(["auto", "text", "number", "date"]).optional()
    });
    namedRangeMappingSchema = z4.object({
      mappingKey: mappingKeySchema,
      targetType: z4.literal("named_range"),
      namedRange: identifierSchema,
      valueType: z4.enum(["auto", "text", "number", "date"]).optional()
    });
    tableColumnMappingSchema = z4.object({
      mappingKey: mappingKeySchema,
      targetType: z4.literal("table_column"),
      sheetName: sheetNameSchema,
      tableName: identifierSchema,
      columnName: identifierSchema,
      sourcePath: z4.string().optional(),
      valueType: z4.enum(["auto", "text", "number", "date"]).optional()
    });
    excelWorkbookMappingSchema = z4.union([
      cellMappingSchema,
      namedRangeMappingSchema,
      tableColumnMappingSchema
    ]);
    excelWorkbookMappingsSchema = z4.array(excelWorkbookMappingSchema);
    workbookMetadataSchema = z4.object({
      worksheetNames: z4.array(z4.string()),
      worksheetDimensions: z4.record(
        z4.string(),
        z4.object({
          rows: z4.number(),
          columns: z4.number()
        })
      ),
      definedNames: z4.array(
        z4.object({
          name: z4.string(),
          formula: z4.string(),
          scope: z4.string().optional()
        })
      ),
      tables: z4.array(
        z4.object({
          sheetName: z4.string(),
          tableName: z4.string(),
          displayName: z4.string(),
          columns: z4.array(z4.string()),
          ref: z4.string().optional()
        })
      ),
      sampleCells: z4.array(
        z4.object({
          sheetName: z4.string(),
          cellAddress: z4.string(),
          value: z4.any(),
          type: z4.string().optional()
        })
      )
    });
  }
});

// shared/documentFieldMapping.ts
import { z as z5 } from "zod";
function validateFieldValue(field, value) {
  if (field.required && (value === null || value === void 0 || value === "")) {
    return `${field.label} is required`;
  }
  if (!value) return null;
  switch (field.type) {
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        return `${field.label} must be a valid email`;
      }
      break;
    case "number":
      const num = Number(value);
      if (isNaN(num)) {
        return `${field.label} must be a number`;
      }
      if (field.validation?.min !== void 0 && num < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min}`;
      }
      if (field.validation?.max !== void 0 && num > field.validation.max) {
        return `${field.label} must be at most ${field.validation.max}`;
      }
      break;
    case "date":
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        return `${field.label} must be a valid date (YYYY-MM-DD)`;
      }
      break;
    case "text":
      const str = String(value);
      if (field.validation?.min !== void 0 && str.length < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min} characters`;
      }
      if (field.validation?.max !== void 0 && str.length > field.validation.max) {
        return `${field.label} must be at most ${field.validation.max} characters`;
      }
      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(str)) {
          return field.validation.message || `${field.label} format is invalid`;
        }
      }
      break;
  }
  return null;
}
function validateFormSubmissionDocument(fields, filledData) {
  const errors = [];
  for (const field of fields) {
    const error = validateFieldValue(field, filledData[field.id]);
    if (error) {
      errors.push({
        fieldId: field.id,
        fieldName: field.name,
        message: error
      });
    }
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}
var FieldPositionSchema, FieldValidationSchema, DocumentFieldSchema, FormTemplateDocumentSchema, FormSubmissionDocumentSchema, ValidationResultSchema;
var init_documentFieldMapping = __esm({
  "shared/documentFieldMapping.ts"() {
    "use strict";
    FieldPositionSchema = z5.object({
      page: z5.number().optional(),
      x: z5.number().optional(),
      y: z5.number().optional(),
      width: z5.number().optional(),
      height: z5.number().optional()
    });
    FieldValidationSchema = z5.object({
      min: z5.number().optional(),
      max: z5.number().optional(),
      pattern: z5.string().optional(),
      message: z5.string().optional()
    });
    DocumentFieldSchema = z5.object({
      id: z5.string(),
      name: z5.string(),
      label: z5.string(),
      type: z5.enum(["text", "number", "date", "email", "signature", "checkbox"]),
      required: z5.boolean(),
      placeholder: z5.string().optional(),
      validation: FieldValidationSchema.optional(),
      position: FieldPositionSchema.optional()
    });
    FormTemplateDocumentSchema = z5.object({
      id: z5.string(),
      formTemplateId: z5.string(),
      documentName: z5.string(),
      documentType: z5.enum(["pdf", "excel"]),
      fileSize: z5.number(),
      storageUrl: z5.string(),
      fields: z5.array(DocumentFieldSchema),
      isActive: z5.boolean(),
      uploadedBy: z5.number(),
      uploadedAt: z5.date(),
      updatedAt: z5.date()
    });
    FormSubmissionDocumentSchema = z5.object({
      id: z5.string(),
      submissionId: z5.string(),
      templateDocumentId: z5.string(),
      filledData: z5.record(z5.any()),
      isComplete: z5.boolean(),
      validationErrors: z5.array(
        z5.object({
          fieldId: z5.string(),
          message: z5.string()
        })
      ),
      generatedDocumentUrl: z5.string().optional(),
      createdAt: z5.date(),
      updatedAt: z5.date()
    });
    ValidationResultSchema = z5.object({
      isValid: z5.boolean(),
      errors: z5.array(
        z5.object({
          fieldId: z5.string(),
          fieldName: z5.string(),
          message: z5.string()
        })
      )
    });
  }
});

// server/documentFields.ts
var documentFields_exports = {};
__export(documentFields_exports, {
  areAllSubmissionDocumentsComplete: () => areAllSubmissionDocumentsComplete,
  createFormSubmissionDocument: () => createFormSubmissionDocument,
  createFormTemplateDocument: () => createFormTemplateDocument,
  deleteFormTemplateDocument: () => deleteFormTemplateDocument,
  getFormSubmissionDocument: () => getFormSubmissionDocument,
  getFormSubmissionDocuments: () => getFormSubmissionDocuments,
  getFormTemplateDocument: () => getFormTemplateDocument,
  getFormTemplateDocuments: () => getFormTemplateDocuments,
  getSubmissionDocumentValidationErrors: () => getSubmissionDocumentValidationErrors,
  updateFormSubmissionDocumentData: () => updateFormSubmissionDocumentData
});
import { v4 as uuidv43 } from "uuid";
async function createFormTemplateDocument(formTemplateId, documentName, documentType, fileSize, storageUrl, fields, uploadedBy) {
  const id = uuidv43();
  const now = /* @__PURE__ */ new Date();
  await db.insert(formTemplateDocuments).values({
    id,
    formTemplateId,
    documentName,
    documentType,
    fileSize,
    storageUrl,
    fields,
    uploadedBy,
    uploadedAt: now,
    updatedAt: now
  });
  return {
    id,
    formTemplateId,
    documentName,
    documentType,
    fileSize,
    storageUrl,
    fields,
    isActive: true,
    uploadedBy,
    uploadedAt: now,
    updatedAt: now
  };
}
async function getFormTemplateDocuments(formTemplateId) {
  const docs = await db.query.formTemplateDocuments.findMany({
    where: (table, { eq: eq5 }) => eq5(table.formTemplateId, formTemplateId)
  });
  return docs.map((doc) => ({
    ...doc,
    fields: doc.fields || []
  }));
}
async function getFormTemplateDocument(documentId) {
  const doc = await db.query.formTemplateDocuments.findFirst({
    where: (table, { eq: eq5 }) => eq5(table.id, documentId)
  });
  if (!doc) return null;
  return {
    ...doc,
    fields: doc.fields || []
  };
}
async function deleteFormTemplateDocument(documentId) {
  await db.delete(formTemplateDocuments).where((table) => table.id === documentId);
}
async function createFormSubmissionDocument(submissionId, templateDocumentId) {
  const id = uuidv43();
  const now = /* @__PURE__ */ new Date();
  await db.insert(formSubmissionDocuments).values({
    id,
    submissionId,
    templateDocumentId,
    filledData: {},
    isComplete: false,
    validationErrors: [],
    createdAt: now,
    updatedAt: now
  });
  return {
    id,
    submissionId,
    templateDocumentId,
    filledData: {},
    isComplete: false,
    validationErrors: [],
    createdAt: now,
    updatedAt: now
  };
}
async function getFormSubmissionDocuments(submissionId) {
  const docs = await db.query.formSubmissionDocuments.findMany({
    where: (table, { eq: eq5 }) => eq5(table.submissionId, submissionId)
  });
  return docs.map((doc) => ({
    ...doc,
    filledData: doc.filledData || {},
    validationErrors: doc.validationErrors || []
  }));
}
async function getFormSubmissionDocument(documentId) {
  const doc = await db.query.formSubmissionDocuments.findFirst({
    where: (table, { eq: eq5 }) => eq5(table.id, documentId)
  });
  if (!doc) return null;
  return {
    ...doc,
    filledData: doc.filledData || {},
    validationErrors: doc.validationErrors || []
  };
}
async function updateFormSubmissionDocumentData(documentId, filledData, templateFields) {
  const validation = validateFormSubmissionDocument(templateFields, filledData);
  const now = /* @__PURE__ */ new Date();
  await db.update(formSubmissionDocuments).set({
    filledData,
    isComplete: validation.isValid,
    validationErrors: validation.errors,
    updatedAt: now
  }).where((table) => table.id === documentId);
  const updated = await getFormSubmissionDocument(documentId);
  if (!updated) throw new Error("Document not found after update");
  return updated;
}
async function areAllSubmissionDocumentsComplete(submissionId) {
  const docs = await getFormSubmissionDocuments(submissionId);
  if (docs.length === 0) return true;
  return docs.every((doc) => doc.isComplete);
}
async function getSubmissionDocumentValidationErrors(submissionId) {
  const docs = await getFormSubmissionDocuments(submissionId);
  return docs.filter((doc) => doc.validationErrors && doc.validationErrors.length > 0).map((doc) => ({
    documentId: doc.id,
    errors: doc.validationErrors
  }));
}
var init_documentFields = __esm({
  "server/documentFields.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_documentFieldMapping();
  }
});

// server/excelWorkbook.ts
var excelWorkbook_exports = {};
__export(excelWorkbook_exports, {
  convertValueForExcel: () => convertValueForExcel,
  generateMappedWorkbook: () => generateMappedWorkbook,
  generateOutputFilename: () => generateOutputFilename,
  inspectWorkbook: () => inspectWorkbook,
  looksLikeFormula: () => looksLikeFormula,
  sanitizeFilename: () => sanitizeFilename,
  validateMappings: () => validateMappings
});
import ExcelJS from "exceljs";
function definedNameModels(workbook) {
  return (workbook.definedNames.model || []).slice(
    0,
    INSPECTION_LIMITS.maxDefinedNames
  );
}
function parseNamedRange(range) {
  const match = range.match(
    /^(?:'((?:[^']|'')+)'|([^!]+))!\$?([A-Z]+)\$?(\d+)$/i
  );
  if (!match) return null;
  return {
    sheetName: (match[1] || match[2]).replace(/''/g, "'"),
    cellAddress: `${match[3].toUpperCase()}${match[4]}`
  };
}
function readableCellValue(value) {
  if (value === null || value === void 0) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("formula" in value) return `=${value.formula}`;
    return JSON.stringify(value);
  }
  return String(value);
}
function valueAtPath(value, path) {
  if (!path) return value;
  return path.split(".").reduce((current, segment) => {
    if (current === null || current === void 0) return void 0;
    if (Array.isArray(current) && /^\d+$/.test(segment)) {
      return current[Number(segment)];
    }
    if (typeof current === "object") {
      return current[segment];
    }
    return void 0;
  }, value);
}
function writeCell(cell, value, valueType = "auto") {
  cell.value = convertValueForExcel(value, valueType);
  if (valueType === "text") cell.numFmt = "@";
}
async function inspectWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheets = workbook.worksheets.slice(
    0,
    INSPECTION_LIMITS.maxWorksheets
  );
  const worksheetNames = worksheets.map((worksheet) => worksheet.name);
  const worksheetDimensions = {};
  const sampleCells = [];
  const tables = [];
  for (const worksheet of worksheets) {
    worksheetDimensions[worksheet.name] = {
      rows: worksheet.rowCount,
      columns: worksheet.columnCount
    };
    const maxRows = Math.min(
      worksheet.rowCount,
      INSPECTION_LIMITS.maxRowsPerSheet
    );
    const maxColumns = Math.min(
      worksheet.columnCount,
      INSPECTION_LIMITS.maxColumnsPerSheet
    );
    for (let row = 1; row <= maxRows; row += 1) {
      for (let column = 1; column <= maxColumns; column += 1) {
        if (sampleCells.length >= INSPECTION_LIMITS.maxSampleCells) break;
        const cell = worksheet.getCell(row, column);
        if (cell.value !== null && cell.value !== void 0) {
          sampleCells.push({
            sheetName: worksheet.name,
            cellAddress: cell.address,
            value: readableCellValue(cell.value),
            type: String(cell.type)
          });
        }
      }
      if (sampleCells.length >= INSPECTION_LIMITS.maxSampleCells) break;
    }
    const worksheetTables = Object.values(
      worksheet.tables || {}
    );
    for (const table of worksheetTables) {
      if (tables.length >= INSPECTION_LIMITS.maxTables) break;
      const model = table.table;
      tables.push({
        sheetName: worksheet.name,
        tableName: table.name,
        displayName: table.displayName || table.name,
        columns: (model.columns || []).map(
          (column) => column.name
        ),
        ref: model.ref || model.tableRef
      });
    }
  }
  return {
    worksheetNames,
    worksheetDimensions,
    definedNames: definedNameModels(workbook).map((item) => ({
      name: item.name,
      formula: item.ranges.join(",")
    })),
    tables,
    sampleCells
  };
}
async function generateMappedWorkbook(input) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(input.templateBuffer);
  const values = /* @__PURE__ */ new Map();
  for (const field of input.formTemplate.fields || []) {
    if (field.mappingKey) {
      values.set(field.mappingKey, input.submission.formData?.[field.id]);
    }
  }
  const builtinContext = {
    workflowNumber: input.workflow?.workflowNumber,
    workflowTitle: input.workflow?.title,
    workflowStatus: input.workflow?.status,
    department: input.workflow?.department,
    submitterName: input.submitter?.name,
    submitterEmail: input.submitter?.email,
    submittedAt: input.submittedAt,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  };
  for (const key of BUILTIN_MAPPING_KEYS) {
    values.set(key, getBuiltinValue(key, builtinContext));
  }
  const namedRanges = new Map(
    definedNameModels(workbook).map((item) => [item.name, item.ranges])
  );
  const tableGroups = /* @__PURE__ */ new Map();
  for (const mapping of input.mappings) {
    if (mapping.targetType === "table_column") {
      const groupKey = `${mapping.sheetName}\0${mapping.tableName}`;
      tableGroups.set(groupKey, [
        ...tableGroups.get(groupKey) || [],
        mapping
      ]);
      continue;
    }
    const value = values.get(mapping.mappingKey);
    if (value === void 0 || value === null) continue;
    if (mapping.targetType === "cell") {
      const worksheet2 = workbook.getWorksheet(mapping.sheetName);
      if (!worksheet2) throw new Error(`Sheet "${mapping.sheetName}" not found`);
      writeCell(
        worksheet2.getCell(mapping.cellAddress),
        value,
        mapping.valueType
      );
      continue;
    }
    const range = namedRanges.get(mapping.namedRange)?.[0];
    const target = range ? parseNamedRange(range) : null;
    if (!target)
      throw new Error(`Named range "${mapping.namedRange}" is invalid`);
    const worksheet = workbook.getWorksheet(target.sheetName);
    if (!worksheet) throw new Error(`Sheet "${target.sheetName}" not found`);
    writeCell(worksheet.getCell(target.cellAddress), value, mapping.valueType);
  }
  for (const [groupKey, mappings] of Array.from(tableGroups.entries())) {
    const [sheetName, tableName] = groupKey.split("\0");
    const worksheet = workbook.getWorksheet(sheetName);
    const table = worksheet?.getTable(tableName);
    if (!worksheet || !table) throw new Error(`Table "${tableName}" not found`);
    const model = table.table;
    const columnNames = (model.columns || []).map(
      (column) => column.name
    );
    const sourceRows = mappings.map(
      (mapping) => {
        const raw = values.get(mapping.mappingKey);
        return Array.isArray(raw) ? raw : raw === void 0 || raw === null ? [] : [raw];
      }
    );
    const rowCount = Math.max(
      0,
      ...sourceRows.map((rows) => rows.length)
    );
    const appendedRows = [];
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const row = Array(columnNames.length).fill(null);
      mappings.forEach(
        (mapping, mappingIndex) => {
          if (mapping.targetType !== "table_column") return;
          const columnIndex = columnNames.indexOf(mapping.columnName);
          if (columnIndex < 0) return;
          const sourceValue = valueAtPath(
            sourceRows[mappingIndex][rowIndex],
            mapping.sourcePath
          );
          row[columnIndex] = convertValueForExcel(
            sourceValue,
            mapping.valueType
          );
        }
      );
      appendedRows.push(row);
    }
    if (appendedRows.length > 0) {
      const range = String(model.ref || model.tableRef || "");
      const [startAddress, endAddress] = range.split(":");
      if (!startAddress || !endAddress) {
        throw new Error(`Table "${tableName}" has an invalid range`);
      }
      const start = worksheet.getCell(startAddress.replace(/\$/g, ""));
      const end = worksheet.getCell(endAddress.replace(/\$/g, ""));
      const firstDataRow = Number(start.row) + (model.headerRow === false ? 0 : 1);
      const lastDataRow = Number(end.row) - (model.totalsRow ? 1 : 0);
      const existingRows = [];
      for (let rowNumber = firstDataRow; rowNumber <= lastDataRow; rowNumber += 1) {
        existingRows.push(
          columnNames.map(
            (_, index2) => worksheet.getCell(rowNumber, Number(start.col) + index2).value
          )
        );
      }
      worksheet.removeTable(tableName);
      worksheet.addTable({
        name: model.name,
        displayName: model.displayName || model.name,
        ref: startAddress.replace(/\$/g, ""),
        headerRow: model.headerRow !== false,
        totalsRow: Boolean(model.totalsRow),
        style: model.style,
        columns: model.columns,
        rows: [...existingRows, ...appendedRows]
      });
    }
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
async function validateMappings(buffer, mappings) {
  const errors = [];
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const namedRanges = new Map(
      definedNameModels(workbook).map((item) => [item.name, item.ranges])
    );
    const targets = /* @__PURE__ */ new Set();
    for (const mapping of mappings) {
      let targetKey;
      if (mapping.targetType === "cell") {
        targetKey = `cell:${mapping.sheetName}:${mapping.cellAddress}`;
        if (!workbook.getWorksheet(mapping.sheetName)) {
          errors.push(`Sheet "${mapping.sheetName}" not found`);
        }
      } else if (mapping.targetType === "named_range") {
        targetKey = `name:${mapping.namedRange}`;
        if (!namedRanges.has(mapping.namedRange)) {
          errors.push(`Named range "${mapping.namedRange}" not found`);
        }
      } else {
        targetKey = `table:${mapping.sheetName}:${mapping.tableName}:${mapping.columnName}`;
        const table = workbook.getWorksheet(mapping.sheetName)?.getTable(mapping.tableName);
        if (!table) {
          errors.push(
            `Table "${mapping.tableName}" not found in sheet "${mapping.sheetName}"`
          );
        } else {
          const columns = (table.table.columns || []).map(
            (column) => column.name
          );
          if (!columns.includes(mapping.columnName)) {
            errors.push(
              `Column "${mapping.columnName}" not found in table "${mapping.tableName}"`
            );
          }
        }
      }
      if (targets.has(targetKey))
        errors.push(`Target "${targetKey}" is mapped twice`);
      targets.add(targetKey);
    }
  } catch (error) {
    errors.push(
      `Failed to validate workbook: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
  return { valid: errors.length === 0, errors };
}
function generateOutputFilename(pattern, context) {
  let filename = pattern || "{templateName}_{workflowNumber}_{timestamp}.xlsx";
  const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const replacements = {
    "{templateName}": context.templateName || "export",
    "{workflowNumber}": context.workflowNumber || "",
    "{timestamp}": timestamp2,
    "{date}": (context.submittedAt || /* @__PURE__ */ new Date()).toISOString().slice(0, 10)
  };
  for (const [token, value] of Object.entries(replacements)) {
    filename = filename.replaceAll(token, value);
  }
  filename = sanitizeFilename(filename) || `export_${timestamp2}`;
  return filename.toLowerCase().endsWith(".xlsx") ? filename : `${filename}.xlsx`;
}
var INSPECTION_LIMITS;
var init_excelWorkbook = __esm({
  "server/excelWorkbook.ts"() {
    "use strict";
    init_excelMapping();
    INSPECTION_LIMITS = {
      maxWorksheets: 30,
      maxRowsPerSheet: 1e3,
      maxColumnsPerSheet: 100,
      maxSampleCells: 200,
      maxTables: 50,
      maxDefinedNames: 100
    };
  }
});

// server/hellodoc.ts
var hellodoc_exports = {};
__export(hellodoc_exports, {
  cancelSignatureRequest: () => cancelSignatureRequest,
  checkSignatureStatus: () => checkSignatureStatus,
  downloadSignedDocument: () => downloadSignedDocument,
  getAccountInfo: () => getAccountInfo
});
async function checkSignatureStatus(signatureRequestId) {
  const response = await fetch(`${DROPBOX_SIGN_API_URL}/signature_request/${signatureRequestId}`, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${Buffer.from(HELLODOC_API_KEY + ":").toString("base64")}`
    }
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dropbox Sign API error: ${response.status} - ${error}`);
  }
  const data = await response.json();
  const signatureRequest = data.signature_request;
  let status = "pending";
  if (signatureRequest.is_complete) {
    status = "signed";
  } else if (signatureRequest.is_declined) {
    status = "rejected";
  } else if (signatureRequest.has_error) {
    status = "expired";
  }
  return {
    status,
    signedAt: signatureRequest.is_complete ? /* @__PURE__ */ new Date() : null,
    signedDocumentUrl: signatureRequest.is_complete ? signatureRequest.files_url : null,
    signerInfo: signatureRequest.signatures?.[0] || null
  };
}
async function downloadSignedDocument(signatureRequestId) {
  const response = await fetch(`${DROPBOX_SIGN_API_URL}/signature_request/files/${signatureRequestId}`, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${Buffer.from(HELLODOC_API_KEY + ":").toString("base64")}`
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to download signed document: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
async function getAccountInfo() {
  const response = await fetch(`${DROPBOX_SIGN_API_URL}/account`, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${Buffer.from(HELLODOC_API_KEY + ":").toString("base64")}`
    }
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dropbox Sign API error: ${response.status} - ${error}`);
  }
  const data = await response.json();
  return data.account;
}
async function cancelSignatureRequest(signatureRequestId) {
  const response = await fetch(`${DROPBOX_SIGN_API_URL}/signature_request/cancel/${signatureRequestId}`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(HELLODOC_API_KEY + ":").toString("base64")}`
    }
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dropbox Sign API error: ${response.status} - ${error}`);
  }
  return { success: true };
}
var DROPBOX_SIGN_API_URL, HELLODOC_API_KEY;
var init_hellodoc = __esm({
  "server/hellodoc.ts"() {
    "use strict";
    DROPBOX_SIGN_API_URL = "https://api.hellosign.com/v3";
    HELLODOC_API_KEY = process.env.HELLODOC_API_KEY;
    if (!HELLODOC_API_KEY) {
      throw new Error("HELLODOC_API_KEY environment variable is not set");
    }
  }
});

// server/_core/app.ts
import express from "express";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers.ts
import { z as z6 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError as TRPCError2 } from "@trpc/server";

// server/_core/env.ts
var ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};
var env = {
  VITE_API_URL: process.env.VITE_API_URL,
  VITE_APP_URL: process.env.VITE_APP_URL,
  VITE_ENTRA_TENANT_ID: process.env.VITE_ENTRA_TENANT_ID,
  VITE_ENTRA_CLIENT_ID: process.env.VITE_ENTRA_CLIENT_ID
};

// server/_core/notification.ts
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError2({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError2({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError2({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError2({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError2({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError2({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db();
init_schema();
import { eq as eq4 } from "drizzle-orm";

// server/storage.ts
import { BlobSASPermissions, BlobServiceClient } from "@azure/storage-blob";
var containerName = process.env.AZURE_STORAGE_CONTAINER || "finance-attachments";
var SAS_CLOCK_SKEW_MS = 5 * 60 * 1e3;
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function storageKeyFromUrl(url) {
  try {
    const path = new URL(url).pathname;
    const prefix = `/${encodeURIComponent(containerName)}/`;
    if (!path.startsWith(prefix)) return null;
    return normalizeKey(decodeURIComponent(path.slice(prefix.length)));
  } catch {
    return null;
  }
}
function getContainerClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error(
      "Azure Blob Storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING."
    );
  }
  return BlobServiceClient.fromConnectionString(
    connectionString
  ).getContainerClient(containerName);
}
async function signedReadUrl(key, expiresIn) {
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error("Azure Blob SAS expiry must be a positive number of seconds.");
  }
  const blob = getContainerClient().getBlobClient(key);
  const now = Date.now();
  return blob.generateSasUrl({
    permissions: BlobSASPermissions.parse("r"),
    // Allow a small clock-skew window between Vercel and Azure. Without it,
    // Azure can reject a freshly issued SAS when their clocks differ slightly.
    startsOn: new Date(now - SAS_CLOCK_SKEW_MS),
    expiresOn: new Date(now + expiresIn * 1e3)
  });
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const key = normalizeKey(relKey);
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  try {
    const blob = getContainerClient().getBlockBlobClient(key);
    await blob.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: contentType }
    });
    return { key, url: await signedReadUrl(key, 3600) };
  } catch (error) {
    console.error("Azure Blob upload failed", error);
    throw new Error(
      `Failed to upload file to Azure Blob Storage: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
async function storageGet(relKey, expiresIn = 3600) {
  const key = normalizeKey(relKey);
  try {
    return { key, url: await signedReadUrl(key, expiresIn) };
  } catch (error) {
    console.error("Azure Blob signed URL failed", error);
    throw new Error(
      `Failed to access Azure Blob Storage: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
async function storageDownload(relKey) {
  const key = normalizeKey(relKey);
  try {
    const blob = getContainerClient().getBlobClient(key);
    const downloadBlockBlobResponse = await blob.download();
    if (!downloadBlockBlobResponse.readableStreamBody) {
      throw new Error("No stream body in download response");
    }
    const chunks = [];
    for await (const chunk of downloadBlockBlobResponse.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Azure Blob download failed", error);
    throw new Error(
      `Failed to download file from Azure Blob Storage: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// server/routers.ts
import { randomUUID as randomUUID3 } from "crypto";

// server/analyticsCache.ts
var AnalyticsCache = class {
  cache = /* @__PURE__ */ new Map();
  /**
   * Get cached data if it exists and hasn't expired
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    const now = Date.now();
    const age = now - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
  /**
   * Set cache data with TTL
   */
  set(key, data, ttl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  /**
   * Invalidate specific cache key
   */
  invalidate(key) {
    this.cache.delete(key);
  }
  /**
   * Invalidate all cache keys matching a pattern
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }
  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
};
var analyticsCache = new AnalyticsCache();
var CACHE_TTL = {
  OVERVIEW: 5 * 60 * 1e3,
  // 5 minutes
  BY_TYPE: 5 * 60 * 1e3,
  BY_DEPARTMENT: 5 * 60 * 1e3,
  BY_STATUS: 5 * 60 * 1e3,
  AVG_TIME: 10 * 60 * 1e3,
  // 10 minutes
  COMPLETION_TREND: 5 * 60 * 1e3,
  TIMELINE: 5 * 60 * 1e3,
  DEPARTMENT_METRICS: 3 * 60 * 1e3,
  // 3 minutes - more dynamic
  COST_BREAKDOWN: 3 * 60 * 1e3
};
async function withCache(cacheKey, ttl, fn) {
  const cached = analyticsCache.get(cacheKey);
  if (cached !== null) {
    console.log(`\u{1F4E6} Cache HIT: ${cacheKey}`);
    return cached;
  }
  console.log(`\u{1F504} Cache MISS: ${cacheKey} - fetching from database`);
  const result = await fn();
  analyticsCache.set(cacheKey, result, ttl);
  return result;
}
function invalidateAnalyticsCache() {
  console.log("\u{1F5D1}\uFE0F  Invalidating all analytics cache");
  analyticsCache.invalidatePattern("analytics:.*");
}

// server/reminderScheduler.ts
init_db();
import cron from "node-cron";

// server/emailService.ts
init_microsoft_graph();
async function sendEmail(options) {
  try {
    await sendGraphEmail({
      to: options.to,
      subject: options.subject,
      htmlBody: options.htmlBody,
      replyTo: options.from
    });
    console.log(`\u2705 Microsoft Graph email accepted:`, {
      replyTo: options.from,
      to: options.to,
      subject: options.subject
    });
    return true;
  } catch (error) {
    console.error(`\u274C Failed to send email:`, error);
    return false;
  }
}
async function sendWorkflowReminder(params) {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .workflow-details {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      min-width: 140px;
      color: #6b7280;
    }
    .detail-value {
      color: #111827;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .alert {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 24px;">Workflow Reminder</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Action Required</p>
  </div>
  
  <div class="content">
    <p>Hello,</p>
    
    <p>This is a reminder that the following workflow requires your attention:</p>
    
    <div class="workflow-details">
      <div class="detail-row">
        <div class="detail-label">Workflow Title:</div>
        <div class="detail-value"><strong>${params.workflowTitle}</strong></div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Workflow Type:</div>
        <div class="detail-value">${params.workflowType}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Current Stage:</div>
        <div class="detail-value">${params.currentStage}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Action Required:</div>
        <div class="detail-value"><strong>${params.actionRequired}</strong></div>
      </div>
    </div>
    
    <div class="alert">
      <strong>\u23F0 Daily Reminder</strong><br>
      This workflow is pending your review or approval. Please take action at your earliest convenience.
    </div>
    
    <div style="text-align: center;">
      <a href="${params.workflowUrl}" class="button">View Workflow</a>
    </div>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      If you have any questions, please contact the workflow requester or your supervisor.
    </p>
  </div>
  
  <div class="footer">
    <p>This is an automated reminder from the Approval Workflow System.</p>
    <p style="margin-top: 10px;">
      Sent by ${params.fromName} via Approval Workflow System<br>
      \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Compawnion. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;
  const textBody = `
Workflow Reminder - Action Required

Hello,

This is a reminder that the following workflow requires your attention:

Workflow Title: ${params.workflowTitle}
Workflow Type: ${params.workflowType}
Current Stage: ${params.currentStage}
Action Required: ${params.actionRequired}

View Workflow: ${params.workflowUrl}

This workflow is pending your review or approval. Please take action at your earliest convenience.

If you have any questions, please contact the workflow requester or your supervisor.

---
This is an automated reminder from the Approval Workflow System.
Sent by ${params.fromName} via Approval Workflow System
\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Compawnion. All rights reserved.
  `;
  return await sendEmail({
    from: `${params.fromName} <${params.fromEmail}>`,
    to: params.toEmails,
    subject: `Workflow Reminder: ${params.workflowTitle} - Action Required`,
    htmlBody,
    textBody
  });
}
function getWorkflowUrl(workflowId) {
  const baseUrl = process.env.VITE_APP_URL || "https://approval-workflow-system.manus.space";
  return `${baseUrl}/workflows/${workflowId}`;
}

// server/reminderScheduler.ts
async function getPendingWorkflows() {
  const workflows2 = await getAllWorkflows();
  return workflows2.filter((w) => w.overallStatus === "in_progress");
}
async function getLastActor(workflowId) {
  const approvals = await getApprovalsByWorkflow(workflowId);
  if (approvals.length === 0) {
    return null;
  }
  const sortedApprovals = approvals.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const lastApproval = sortedApprovals[0];
  const user = await getUserById(lastApproval.approverId);
  return user;
}
async function getPendingStageInfo(workflowId) {
  const stages = await getStagesByWorkflow(workflowId);
  const pendingStage = stages.find((s) => s.status === "pending");
  if (!pendingStage) {
    return null;
  }
  const users2 = await getAllUsers();
  const approvers = users2.filter((u) => u.role === pendingStage.requiredRole);
  return {
    stage: pendingStage,
    approvers
  };
}
async function sendDailyReminders() {
  console.log("\u{1F4E7} Starting daily workflow reminders...");
  try {
    const pendingWorkflows = await getPendingWorkflows();
    console.log(`Found ${pendingWorkflows.length} pending workflows`);
    let sentCount = 0;
    let failedCount = 0;
    for (const workflow of pendingWorkflows) {
      try {
        const lastActor = await getLastActor(workflow.id);
        if (!lastActor) {
          console.log(`\u26A0\uFE0F  No last actor found for workflow ${workflow.id}, skipping`);
          continue;
        }
        const pendingInfo = await getPendingStageInfo(workflow.id);
        if (!pendingInfo || pendingInfo.approvers.length === 0) {
          console.log(`\u26A0\uFE0F  No pending approvers for workflow ${workflow.id}, skipping`);
          continue;
        }
        const recipientEmails = pendingInfo.approvers.map((u) => u.email);
        const success = await sendWorkflowReminder({
          fromEmail: lastActor.email,
          fromName: lastActor.fullName,
          toEmails: recipientEmails,
          workflowTitle: workflow.title,
          workflowId: workflow.id,
          workflowType: workflow.workflowType,
          currentStage: pendingInfo.stage.stageName,
          actionRequired: pendingInfo.stage.stageType === "approval" ? "Approval Required" : "Review Required",
          workflowUrl: getWorkflowUrl(workflow.id)
        });
        if (success) {
          sentCount++;
          console.log(`\u2705 Reminder sent for workflow: ${workflow.title}`);
        } else {
          failedCount++;
          console.log(`\u274C Failed to send reminder for workflow: ${workflow.title}`);
        }
      } catch (error) {
        failedCount++;
        console.error(`\u274C Error processing workflow ${workflow.id}:`, error);
      }
    }
    console.log(`\u{1F4CA} Daily reminders complete: ${sentCount} sent, ${failedCount} failed`);
  } catch (error) {
    console.error("\u274C Error in daily reminders:", error);
  }
}
async function triggerRemindersNow() {
  console.log("\u{1F527} Manual trigger: Sending reminders now");
  await sendDailyReminders();
}

// server/routers.ts
init_email();

// server/routers/documentSequence.ts
init_schema();
init_db();
import { and as and2, desc as desc2, eq as eq2, like, or, sql as sql2 } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z as z2 } from "zod";
var DOCUMENT_TYPES = [
  "SOP",
  "IK",
  "FORM",
  "SC",
  "SPK",
  "NDA",
  "JPB",
  "BA",
  "SK",
  "RET",
  "SPG"
];
var COMPANIES = ["CJB", "CBB", "PJB"];
var DIVISIONS = [
  "MKT",
  "SAL",
  "OPS",
  "PRO",
  "RND",
  "HRD",
  "COR",
  "LOG",
  "PUR",
  "FIN",
  "ACC",
  "ITS",
  "PRC"
];
var DOCUMENT_STATUSES = [
  "draft",
  "review",
  "approved",
  "effective",
  "superseded",
  "obsolete"
];
var MONTHS_ROMAN = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII"
];
function getMonthRoman(monthNum) {
  if (monthNum < 1 || monthNum > 12) throw new Error("Invalid month number");
  return MONTHS_ROMAN[monthNum - 1];
}
async function getNextSequenceNumber(documentType, company, division, year, monthNumeric) {
  const counterId = `${documentType}-${company}-${division}-${year}-${monthNumeric}`;
  const connection2 = await mysqlPool.getConnection();
  try {
    await connection2.beginTransaction();
    const [rows] = await connection2.execute(
      "SELECT current_value FROM document_sequence_counters WHERE id = ? FOR UPDATE",
      [counterId]
    );
    let nextValue;
    if (rows.length > 0) {
      nextValue = Number(rows[0].current_value) + 1;
      await connection2.execute(
        "UPDATE document_sequence_counters SET current_value = ?, updated_at = NOW() WHERE id = ?",
        [nextValue, counterId]
      );
    } else {
      nextValue = 1;
      await connection2.execute(
        `INSERT INTO document_sequence_counters
          (id, prefix, department, document_type, current_value, format_pattern,
           reset_period, last_reset_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, 'monthly', NOW(), NOW(), NOW())`,
        [
          counterId,
          `${company}-${division}`,
          division,
          documentType,
          `XXXX.${documentType}/${company}/${division}/MM/YYYY`
        ]
      );
    }
    await connection2.commit();
    return nextValue;
  } catch (error) {
    await connection2.rollback();
    throw error;
  } finally {
    connection2.release();
  }
}
function formatDocumentNumber(sequenceNum, documentType, company, division, monthRoman, year) {
  return `${String(sequenceNum).padStart(4, "0")}.${documentType}/${company}/${division}/${monthRoman}/${year}`;
}
var documentSequenceRouter = router({
  generateDocumentNumber: protectedProcedure.input(
    z2.object({
      documentType: z2.enum(DOCUMENT_TYPES),
      company: z2.enum(COMPANIES),
      division: z2.enum(DIVISIONS),
      documentTitle: z2.string().min(1).max(255),
      documentDescription: z2.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear();
    const monthNumeric = now.getMonth() + 1;
    const monthRoman = getMonthRoman(monthNumeric);
    const sequenceCounter = await getNextSequenceNumber(
      input.documentType,
      input.company,
      input.division,
      year,
      monthNumeric
    );
    const documentNumber = formatDocumentNumber(
      sequenceCounter,
      input.documentType,
      input.company,
      input.division,
      monthRoman,
      year
    );
    const id = uuidv4();
    const userId = ctx.user.id.toString();
    await db.insert(documentSequences).values({
      id,
      documentNumber,
      sequenceCounter,
      documentType: input.documentType,
      company: input.company,
      division: input.division,
      monthRoman,
      monthNumeric,
      year,
      revisionNumber: 0,
      documentTitle: input.documentTitle,
      documentDescription: input.documentDescription || null,
      status: "draft",
      createdBy: userId,
      changeHistory: [
        {
          action: "created",
          timestamp: now.toISOString(),
          userId,
          changes: "Document sequence generated"
        }
      ]
    });
    return {
      id,
      documentNumber,
      sequenceCounter,
      documentType: input.documentType,
      company: input.company,
      division: input.division,
      monthRoman,
      monthNumeric,
      year,
      documentTitle: input.documentTitle,
      status: "draft",
      createdAt: now
    };
  }),
  listDocumentSequences: protectedProcedure.input(
    z2.object({
      company: z2.enum(COMPANIES).optional(),
      division: z2.enum(DIVISIONS).optional(),
      documentType: z2.enum(DOCUMENT_TYPES).optional(),
      status: z2.enum(DOCUMENT_STATUSES).optional(),
      year: z2.number().optional(),
      limit: z2.number().min(1).max(100).default(50),
      offset: z2.number().min(0).default(0)
    })
  ).query(async ({ input }) => {
    const conditions = [
      input.company ? eq2(documentSequences.company, input.company) : void 0,
      input.division ? eq2(documentSequences.division, input.division) : void 0,
      input.documentType ? eq2(documentSequences.documentType, input.documentType) : void 0,
      input.status ? eq2(documentSequences.status, input.status) : void 0,
      input.year ? eq2(documentSequences.year, input.year) : void 0
    ].filter(
      (condition) => Boolean(condition)
    );
    const where = conditions.length > 0 ? and2(...conditions) : void 0;
    const [countRows, data] = await Promise.all([
      db.select({ total: sql2`count(*)` }).from(documentSequences).where(where),
      db.select().from(documentSequences).where(where).orderBy(desc2(documentSequences.createdAt)).limit(input.limit).offset(input.offset)
    ]);
    return {
      data,
      total: Number(countRows[0]?.total ?? 0),
      limit: input.limit,
      offset: input.offset
    };
  }),
  searchDocumentSequences: protectedProcedure.input(
    z2.object({
      query: z2.string().min(1),
      limit: z2.number().min(1).max(100).default(20)
    })
  ).query(async ({ input }) => {
    const pattern = `%${input.query}%`;
    return db.select().from(documentSequences).where(
      or(
        like(documentSequences.documentNumber, pattern),
        like(documentSequences.documentTitle, pattern)
      )
    ).orderBy(desc2(documentSequences.createdAt)).limit(input.limit);
  }),
  getDocumentSequence: protectedProcedure.input(z2.object({ id: z2.string() })).query(async ({ input }) => {
    const [document] = await db.select().from(documentSequences).where(eq2(documentSequences.id, input.id)).limit(1);
    if (!document) throw new Error("Document sequence not found");
    return document;
  }),
  updateDocumentStatus: protectedProcedure.input(
    z2.object({
      id: z2.string(),
      status: z2.enum(DOCUMENT_STATUSES),
      notes: z2.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const [existing] = await db.select().from(documentSequences).where(eq2(documentSequences.id, input.id)).limit(1);
    if (!existing) throw new Error("Document sequence not found");
    const now = /* @__PURE__ */ new Date();
    const userId = ctx.user.id.toString();
    await db.update(documentSequences).set({
      status: input.status,
      updatedBy: userId,
      changeHistory: [
        ...existing.changeHistory ?? [],
        {
          action: "status_updated",
          timestamp: now.toISOString(),
          userId,
          oldStatus: existing.status,
          newStatus: input.status,
          notes: input.notes
        }
      ]
    }).where(eq2(documentSequences.id, input.id));
    return { success: true };
  }),
  getCounterStats: protectedProcedure.input(
    z2.object({
      company: z2.enum(COMPANIES).optional(),
      division: z2.enum(DIVISIONS).optional(),
      year: z2.number().optional()
    })
  ).query(async ({ input }) => {
    const counters = await db.select().from(documentSequenceCounters).orderBy(desc2(documentSequenceCounters.createdAt));
    return counters.filter((counter) => {
      if (input.company && !counter.prefix.includes(input.company))
        return false;
      if (input.division && !counter.prefix.includes(input.division))
        return false;
      if (input.year && !counter.id.includes(`-${input.year}-`))
        return false;
      return true;
    }).map((counter) => ({
      id: counter.id,
      prefix: counter.prefix,
      documentType: counter.documentType,
      currentValue: counter.currentValue,
      lastReset: counter.lastResetAt
    }));
  }),
  getConstants: protectedProcedure.query(() => ({
    documentTypes: DOCUMENT_TYPES,
    companies: COMPANIES,
    divisions: DIVISIONS,
    documentStatuses: DOCUMENT_STATUSES,
    monthsRoman: MONTHS_ROMAN
  }))
});

// server/routers/skuGenerator.ts
init_db();
init_schema();
import { z as z3 } from "zod";
import { v4 as uuidv42 } from "uuid";
import { eq as eq3, and as and3, like as like2, desc as desc3 } from "drizzle-orm";
var skuGeneratorRouter = router({
  /**
   * Get all SKU categories
   */
  getCategories: publicProcedure.query(async () => {
    try {
      const categories = await db.select().from(skuCategories).where(eq3(skuCategories.isActive, true)).orderBy(skuCategories.prefix);
      return categories;
    } catch (error) {
      console.error("Error fetching SKU categories:", error);
      throw new Error("Failed to fetch SKU categories");
    }
  }),
  /**
   * Generate a new SKU for a given category
   */
  generateSku: publicProcedure.input(
    z3.object({
      categoryId: z3.string(),
      productName: z3.string().optional(),
      description: z3.string().optional(),
      userId: z3.number()
    })
  ).mutation(async ({ input }) => {
    try {
      const category = await db.select().from(skuCategories).where(eq3(skuCategories.id, input.categoryId)).limit(1);
      if (!category || category.length === 0) {
        throw new Error("Category not found");
      }
      const categoryData = category[0];
      const counterResult = await db.select().from(skuCounters).where(eq3(skuCounters.categoryId, input.categoryId)).limit(1);
      if (!counterResult || counterResult.length === 0) {
        throw new Error("Counter not initialized for this category");
      }
      const counter = counterResult[0];
      const nextSequence = counter.currentCounter + 1;
      const sequenceStr = String(nextSequence).padStart(9, "0");
      const skuCode = `${categoryData.prefix}${sequenceStr}`;
      const skuId = uuidv42();
      const now = /* @__PURE__ */ new Date();
      await db.insert(skus).values({
        id: skuId,
        skuCode,
        categoryId: input.categoryId,
        prefix: categoryData.prefix,
        sequenceNumber: nextSequence,
        productName: input.productName || null,
        description: input.description || null,
        status: "active",
        createdBy: input.userId,
        createdAt: now,
        updatedAt: now
      });
      await db.update(skuCounters).set({
        currentCounter: nextSequence,
        updatedAt: now
      }).where(eq3(skuCounters.id, counter.id));
      return {
        success: true,
        skuId,
        skuCode,
        sequenceNumber: nextSequence,
        categoryName: categoryData.name,
        prefix: categoryData.prefix
      };
    } catch (error) {
      console.error("Error generating SKU:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to generate SKU"
      );
    }
  }),
  /**
   * Search SKUs by code or product name
   */
  searchSkus: publicProcedure.input(
    z3.object({
      query: z3.string().optional(),
      categoryId: z3.string().optional(),
      status: z3.string().optional(),
      limit: z3.number().default(20),
      offset: z3.number().default(0)
    })
  ).query(async ({ input }) => {
    try {
      let query = db.select().from(skus);
      const conditions = [];
      if (input.query) {
        conditions.push(
          like2(skus.skuCode, `%${input.query}%`)
        );
      }
      if (input.categoryId) {
        conditions.push(eq3(skus.categoryId, input.categoryId));
      }
      if (input.status) {
        conditions.push(eq3(skus.status, input.status));
      }
      if (conditions.length > 0) {
        query = query.where(and3(...conditions));
      }
      const countResult = await db.select({ count: skus.id }).from(skus).where(conditions.length > 0 ? and3(...conditions) : void 0);
      const total = countResult.length > 0 ? 1 : 0;
      const results = await query.orderBy(desc3(skus.createdAt)).limit(input.limit).offset(input.offset);
      return {
        data: results,
        total: results.length,
        limit: input.limit,
        offset: input.offset
      };
    } catch (error) {
      console.error("Error searching SKUs:", error);
      throw new Error("Failed to search SKUs");
    }
  }),
  /**
   * Get SKU details by ID
   */
  getSkuDetails: publicProcedure.input(z3.object({ skuId: z3.string() })).query(async ({ input }) => {
    try {
      const sku = await db.select().from(skus).where(eq3(skus.id, input.skuId)).limit(1);
      if (!sku || sku.length === 0) {
        throw new Error("SKU not found");
      }
      const category = await db.select().from(skuCategories).where(eq3(skuCategories.id, sku[0].categoryId)).limit(1);
      return {
        sku: sku[0],
        category: category?.[0] || null
      };
    } catch (error) {
      console.error("Error fetching SKU details:", error);
      throw new Error("Failed to fetch SKU details");
    }
  }),
  /**
   * Get all SKUs for a category (for export/listing)
   */
  getSkusByCategory: publicProcedure.input(
    z3.object({
      categoryId: z3.string(),
      limit: z3.number().default(100),
      offset: z3.number().default(0)
    })
  ).query(async ({ input }) => {
    try {
      const results = await db.select().from(skus).where(eq3(skus.categoryId, input.categoryId)).orderBy(desc3(skus.sequenceNumber)).limit(input.limit).offset(input.offset);
      return {
        data: results,
        total: results.length,
        limit: input.limit,
        offset: input.offset
      };
    } catch (error) {
      console.error("Error fetching SKUs by category:", error);
      throw new Error("Failed to fetch SKUs");
    }
  }),
  /**
   * Get counter information for a category
   */
  getCategoryCounter: publicProcedure.input(z3.object({ categoryId: z3.string() })).query(async ({ input }) => {
    try {
      const counter = await db.select().from(skuCounters).where(eq3(skuCounters.categoryId, input.categoryId)).limit(1);
      if (!counter || counter.length === 0) {
        throw new Error("Counter not found");
      }
      return counter[0];
    } catch (error) {
      console.error("Error fetching counter:", error);
      throw new Error("Failed to fetch counter");
    }
  }),
  /**
   * Export SKUs as CSV data
   */
  exportSkus: publicProcedure.input(
    z3.object({
      categoryId: z3.string().optional(),
      status: z3.string().optional()
    })
  ).query(async ({ input }) => {
    try {
      let query = db.select().from(skus);
      const conditions = [];
      if (input.categoryId) {
        conditions.push(eq3(skus.categoryId, input.categoryId));
      }
      if (input.status) {
        conditions.push(eq3(skus.status, input.status));
      }
      if (conditions.length > 0) {
        query = query.where(and3(...conditions));
      }
      const results = await query.orderBy(desc3(skus.createdAt));
      const csvData = results.map((sku) => ({
        "SKU Code": sku.skuCode,
        "Product Name": sku.productName || "-",
        "Category": sku.categoryId,
        "Prefix": sku.prefix,
        "Sequence": sku.sequenceNumber,
        "Status": sku.status,
        "Created At": new Date(sku.createdAt).toISOString()
      }));
      return csvData;
    } catch (error) {
      console.error("Error exporting SKUs:", error);
      throw new Error("Failed to export SKUs");
    }
  })
});

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/routers.ts
init_microsoft_graph();

// server/formProcessing.ts
function isMissingFormValue(value) {
  return value === void 0 || value === null || value === "" || Array.isArray(value) && value.length === 0;
}
function buildProcessingFields(fields, formData) {
  const missingFields = fields.filter((field) => field.required && isMissingFormValue(formData[field.id])).map((field) => ({ id: field.id, label: field.label }));
  const mappedFields = fields.filter((field) => field.mappingKey && field.showInTable).map((field) => ({
    key: field.mappingKey,
    label: field.tableLabel || field.label,
    order: field.tableOrder ?? 0,
    value: formData[field.id]
  })).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  return { missingFields, mappedFields };
}
function deriveProcessingStatus(input) {
  if (input.workflowCompleted) return "completed";
  if (input.submissionIsDraft) return "draft";
  if (input.missingFieldCount > 0) return "missing_info";
  if (input.hasWorkflowProgress) return "in_progress";
  return "ready";
}

// server/routers.ts
init_excelMapping();
var APP_BASE_URL = (process.env.VITE_APP_URL || "https://approval-workflow-system-nine.vercel.app").replace(/\/$/, "");
async function freshStorageUrl(key, legacyUrl) {
  const legacyKey = legacyUrl ? storageKeyFromUrl(legacyUrl) : null;
  const resolvedKey = key?.includes("/") ? key : legacyKey || key;
  if (!resolvedKey) {
    throw new TRPCError3({
      code: "BAD_REQUEST",
      message: "This file does not have a valid Azure Blob storage key."
    });
  }
  return (await storageGet(resolvedKey, 3600)).url;
}
async function withFreshS3Url(record) {
  if (!record.s3Key && !record.s3Url) return record;
  try {
    return { ...record, s3Url: await freshStorageUrl(record.s3Key, record.s3Url) };
  } catch (error) {
    console.warn("Unable to refresh Azure Blob URL for record", error);
    return record;
  }
}
async function withFreshFileUrl(record) {
  if (!record.fileKey && !record.fileUrl) return record;
  try {
    return { ...record, fileUrl: await freshStorageUrl(record.fileKey, record.fileUrl) };
  } catch (error) {
    console.warn("Unable to refresh Azure Blob URL for template", error);
    return record;
  }
}
function validateFieldMappings(fields) {
  const mappingKeys = fields.map((field) => field.mappingKey?.trim()).filter((key) => Boolean(key));
  if (new Set(mappingKeys).size !== mappingKeys.length) {
    throw new TRPCError3({
      code: "BAD_REQUEST",
      message: "Mapping keys must be unique within a form template"
    });
  }
  if (fields.some((field) => field.showInTable && !field.mappingKey?.trim())) {
    throw new TRPCError3({
      code: "BAD_REQUEST",
      message: "Fields shown in the processing inbox require a mapping key"
    });
  }
}
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError3({
      code: "FORBIDDEN",
      message: "Admin access required"
    });
  }
  return next({ ctx });
});
var assignmentsRouter = router({
  create: protectedProcedure.input(
    z6.object({
      workflowId: z6.string(),
      assignedTo: z6.number()
    })
  ).mutation(async ({ ctx, input }) => {
    const deptHeadRoles = [
      "PPIC",
      "Purchasing",
      "Finance",
      "Sales",
      "GA",
      "Brand Manager",
      "PR Manager"
    ];
    if (!deptHeadRoles.includes(ctx.user.role)) {
      throw new TRPCError3({
        code: "FORBIDDEN",
        message: "Only department heads can assign tasks"
      });
    }
    return await createTaskAssignment({
      workflowId: input.workflowId,
      assignedTo: input.assignedTo,
      assignedBy: ctx.user.id
    });
  }),
  getByUser: protectedProcedure.input(z6.object({ userId: z6.number() })).query(async ({ input }) => {
    return await getTaskAssignmentsByUser(input.userId);
  }),
  getTeamAssignments: protectedProcedure.query(async ({ ctx }) => {
    return await getTeamAssignments(ctx.user.id);
  })
});
var metricsRouter = router({
  calculateUserMetrics: protectedProcedure.input(z6.object({ userId: z6.number() })).mutation(async ({ input }) => {
    return await calculateUserMetrics(input.userId);
  }),
  getUserMetrics: protectedProcedure.input(z6.object({ userId: z6.number() })).query(async ({ input }) => {
    return await getUserMetrics(input.userId);
  }),
  recalculateAll: adminProcedure2.mutation(async () => {
    return await recalculateAllMetrics();
  })
});
var salaryRouter = router({
  syncFromQapita: adminProcedure2.input(
    z6.object({
      userId: z6.number(),
      salaryAmount: z6.number(),
      currency: z6.string().optional()
    })
  ).mutation(async ({ input }) => {
    return await upsertSalaryCache(input);
  }),
  getUserSalary: protectedProcedure.input(z6.object({ userId: z6.number() })).query(async ({ ctx, input }) => {
    const allowedRoles = ["admin", "CEO", "CFO", "COO"];
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError3({
        code: "FORBIDDEN",
        message: "Not authorized to view salary data"
      });
    }
    return await getUserSalary(input.userId);
  }),
  syncAll: adminProcedure2.mutation(async () => {
    return { success: true, message: "Qapita API integration pending" };
  })
});
var capacityRouter = router({
  getUserList: protectedProcedure.input(
    z6.object({
      page: z6.number().default(1),
      pageSize: z6.number().default(20),
      department: z6.string().optional()
    })
  ).query(async ({ ctx, input }) => {
    const allowedRoles = ["admin", "CEO", "CFO", "COO", "Exec Asst"];
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError3({
        code: "FORBIDDEN",
        message: "Not authorized to access capacity management"
      });
    }
    return await getUserListPaginated({
      ...input,
      managerId: input.department === "My Team" ? ctx.user.id : void 0
    });
  }),
  getUserDetails: protectedProcedure.input(z6.object({ userId: z6.number() })).query(async ({ ctx, input }) => {
    let metrics = await getUserMetrics(input.userId);
    if (!metrics) {
      metrics = await calculateUserMetrics(input.userId);
    }
    const allowedRoles = ["admin", "CEO", "CFO", "COO"];
    const salary = allowedRoles.includes(ctx.user.role) ? await getUserSalary(input.userId) : null;
    return { metrics, salary };
  })
});
var templatesRouter = router({
  // Create new template
  create: protectedProcedure.input(
    z6.object({
      name: z6.string(),
      description: z6.string().optional(),
      workflowType: z6.string(),
      isDefault: z6.boolean().optional(),
      stages: z6.array(
        z6.object({
          stageOrder: z6.number(),
          stageName: z6.string(),
          stageDescription: z6.string().optional(),
          department: z6.string().optional(),
          requiredRole: z6.string().optional(),
          requiresOneOf: z6.array(z6.string()).optional(),
          approvalRequired: z6.boolean(),
          fileUploadRequired: z6.boolean(),
          notificationEmails: z6.array(z6.string()).optional(),
          visibleToDepartments: z6.array(z6.string()).optional(),
          approvalThreshold: z6.number().optional()
        })
      )
    })
  ).mutation(async ({ ctx, input }) => {
    return await createWorkflowTemplate({
      ...input,
      createdBy: ctx.user.id
    });
  }),
  // Get all templates
  getAll: protectedProcedure.input(
    z6.object({
      workflowType: z6.string().optional(),
      isActive: z6.boolean().optional()
    }).optional()
  ).query(async ({ input }) => {
    return await getWorkflowTemplates(input || {});
  }),
  // Get template by ID with stages
  getById: protectedProcedure.input(z6.object({ id: z6.string() })).query(async ({ input }) => {
    const template = await getWorkflowTemplateById(input.id);
    if (!template) {
      throw new TRPCError3({
        code: "NOT_FOUND",
        message: "Template not found"
      });
    }
    return template;
  }),
  // Get default template for workflow type
  getDefault: protectedProcedure.input(z6.object({ workflowType: z6.string() })).query(async ({ input }) => {
    return await getDefaultTemplate(input.workflowType);
  }),
  // Update template
  update: protectedProcedure.input(
    z6.object({
      id: z6.string(),
      name: z6.string().optional(),
      description: z6.string().optional(),
      isDefault: z6.boolean().optional(),
      isActive: z6.boolean().optional(),
      stages: z6.array(
        z6.object({
          id: z6.string().optional(),
          stageOrder: z6.number(),
          stageName: z6.string(),
          stageDescription: z6.string().optional(),
          department: z6.string().optional(),
          requiredRole: z6.string().optional(),
          requiresOneOf: z6.array(z6.string()).optional(),
          approvalRequired: z6.boolean(),
          fileUploadRequired: z6.boolean(),
          notificationEmails: z6.array(z6.string()).optional(),
          visibleToDepartments: z6.array(z6.string()).optional(),
          approvalThreshold: z6.number().optional()
        })
      ).optional()
    })
  ).mutation(async ({ input }) => {
    const { id, ...updates } = input;
    return await updateWorkflowTemplate(id, updates);
  }),
  // Delete template
  delete: protectedProcedure.input(z6.object({ id: z6.string() })).mutation(async ({ input }) => {
    return await deleteWorkflowTemplate(input.id);
  }),
  // Toggle quick assign for template
  toggleQuickAssign: protectedProcedure.input(
    z6.object({
      id: z6.string(),
      isQuickAssignEnabled: z6.boolean()
    })
  ).mutation(async ({ input }) => {
    return await updateWorkflowTemplate(input.id, {
      isQuickAssignEnabled: input.isQuickAssignEnabled
    });
  }),
  // Get templates enabled for quick assign
  getQuickAssignTemplates: protectedProcedure.query(async () => {
    return await getWorkflowTemplates({
      isActive: true,
      isQuickAssignEnabled: true
    });
  })
});
var appRouter = router({
  system: systemRouter,
  // ============================================
  // Authentication
  // ============================================
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: -1
      });
      return { success: true };
    })
  }),
  // ============================================
  // User Management
  // ============================================
  users: router({
    // Get current user's profile with role
    me: protectedProcedure.query(async ({ ctx }) => {
      return ctx.user;
    }),
    getAll: protectedProcedure.query(async () => {
      return await getAllUsers();
    }),
    getById: protectedProcedure.input(z6.object({ id: z6.number() })).query(async ({ input }) => {
      return await getUserById(input.id);
    }),
    updateRole: adminProcedure2.input(
      z6.object({
        userId: z6.number(),
        role: z6.enum([
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
          "R&D",
          "Sales",
          "Marketing",
          "Operations",
          "Staff",
          "admin"
        ])
      })
    ).mutation(async ({ input, ctx }) => {
      await updateUserRole(input.userId, input.role);
      await createAuditLog({
        entityType: "user",
        entityId: input.userId.toString(),
        action: "role_updated",
        actionDescription: `Role updated to ${input.role}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    updateStatus: adminProcedure2.input(
      z6.object({
        userId: z6.number(),
        isActive: z6.boolean()
      })
    ).mutation(async ({ input, ctx }) => {
      await updateUserStatus(input.userId, input.isActive);
      await createAuditLog({
        entityType: "user",
        entityId: input.userId.toString(),
        action: "status_updated",
        actionDescription: `Status updated to ${input.isActive ? "active" : "inactive"}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    // Pin workflow
    pinWorkflow: protectedProcedure.input(z6.object({ workflowId: z6.string() })).mutation(async ({ input, ctx }) => {
      const currentPinned = ctx.user.pinnedWorkflows || [];
      if (currentPinned.includes(input.workflowId)) {
        return { success: true, message: "Already pinned" };
      }
      await updateUserPinnedWorkflows(ctx.user.id, [
        ...currentPinned,
        input.workflowId
      ]);
      return { success: true };
    }),
    // Unpin workflow
    unpinWorkflow: protectedProcedure.input(z6.object({ workflowId: z6.string() })).mutation(async ({ input, ctx }) => {
      const currentPinned = ctx.user.pinnedWorkflows || [];
      const updated = currentPinned.filter((id) => id !== input.workflowId);
      await updateUserPinnedWorkflows(ctx.user.id, updated);
      return { success: true };
    }),
    // Switch role for test user only
    switchRole: protectedProcedure.input(
      z6.object({
        role: z6.enum([
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
          "R&D",
          "Sales",
          "Marketing",
          "Operations",
          "Staff",
          "admin"
        ])
      })
    ).mutation(async ({ input, ctx }) => {
      if (ctx.user.email !== "test@compawnion.co") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Role switching is only available for test user"
        });
      }
      await updateUserRole(ctx.user.id, input.role);
      await createAuditLog({
        entityType: "user",
        entityId: ctx.user.id.toString(),
        action: "role_switched",
        actionDescription: `Test user switched role to ${input.role}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: input.role
      });
      return { success: true };
    }),
    // Bulk sync active @compawnion.co users from Microsoft Entra ID.
    syncFromMicrosoft: adminProcedure2.mutation(async ({ ctx }) => {
      let syncedCount = 0;
      try {
        const directoryUsers = await listMicrosoftDirectoryUsers();
        for (const directoryUser of directoryUsers) {
          const email = (directoryUser.mail || directoryUser.userPrincipalName || "").toLowerCase();
          if (!directoryUser.id || directoryUser.accountEnabled === false || !email.endsWith("@compawnion.co")) {
            continue;
          }
          await upsertUser({
            // Retained for database compatibility until the column is renamed.
            cognitoSub: directoryUser.id,
            openId: directoryUser.id,
            email,
            fullName: directoryUser.displayName || email.split("@")[0],
            role: email === "eddie.amintohir@compawnion.co" ? "admin" : "PPIC"
          });
          syncedCount++;
        }
        await createAuditLog({
          entityType: "user",
          entityId: "bulk",
          action: "bulk_sync",
          actionDescription: `Synced ${syncedCount} users from Microsoft Entra ID`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role
        });
        return { success: true, syncedCount };
      } catch (error) {
        console.error("Microsoft Entra sync error:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to sync users from Microsoft Entra ID: ${error.message}`
        });
      }
    })
  }),
  // ============================================
  // Workflow Management
  // ============================================
  workflows: router({
    create: protectedProcedure.input(
      z6.object({
        workflowType: z6.string(),
        title: z6.string(),
        description: z6.string().optional(),
        department: z6.string(),
        estimatedAmount: z6.number().optional(),
        currency: z6.string().optional(),
        requiresGa: z6.boolean().optional(),
        requiresPpic: z6.boolean().optional(),
        contingencyWorkflowIds: z6.array(z6.string()).optional(),
        templateId: z6.string().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const workflow = await createWorkflow({
        ...input,
        requesterId: ctx.user.id
      });
      if (input.templateId) {
        const template = await getWorkflowTemplateById(input.templateId);
        if (template && template.stages) {
          for (const stage of template.stages) {
            await createWorkflowStage({
              workflowId: workflow.id,
              stageOrder: stage.stageOrder,
              stageName: stage.stageName,
              stageType: stage.approvalRequired ? "approval" : "review",
              requiredRole: stage.requiredRole,
              requiresOneOf: stage.requiresOneOf,
              fileUploadRequired: stage.fileUploadRequired,
              notificationEmails: stage.notificationEmails,
              visibleToDepartments: stage.visibleToDepartments,
              approvalThreshold: stage.approvalThreshold
            });
          }
        }
      } else {
        await createInitialStages(
          workflow.id,
          input.workflowType,
          input.estimatedAmount
        );
      }
      await createAuditLog({
        entityType: "workflow",
        entityId: workflow.id,
        action: "created",
        actionDescription: `${input.workflowType} workflow created: ${input.title}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      invalidateAnalyticsCache();
      return workflow;
    }),
    createFromTemplate: protectedProcedure.input(
      z6.object({
        templateId: z6.string(),
        assignToUserId: z6.number().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const template = await getWorkflowTemplateById(input.templateId);
      if (!template) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Template not found"
        });
      }
      const workflow = await createWorkflow({
        workflowType: template.workflowType,
        title: `${template.name} - ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
        description: template.description || "",
        department: ctx.user.role,
        requesterId: ctx.user.id,
        templateId: input.templateId
      });
      if (template.stages) {
        for (const stage of template.stages) {
          await createWorkflowStage({
            workflowId: workflow.id,
            stageOrder: stage.stageOrder,
            stageName: stage.stageName,
            stageType: stage.approvalRequired ? "approval" : "review",
            requiredRole: stage.requiredRole,
            requiresOneOf: stage.requiresOneOf,
            requiresFileUpload: stage.requiresFileUpload,
            visibleToDepartments: stage.visibleToDepartments
          });
        }
      }
      return workflow;
    }),
    search: protectedProcedure.input(
      z6.object({
        query: z6.string(),
        limit: z6.number().optional()
      })
    ).query(async ({ input, ctx }) => {
      const limit = input.limit || 20;
      const workflows2 = ctx.user.role === "admin" ? await getAllWorkflows() : await getWorkflowsByRequester(ctx.user.id);
      const filtered = workflows2.filter(
        (w) => w.title.toLowerCase().includes(input.query.toLowerCase()) || w.workflowNumber.toLowerCase().includes(input.query.toLowerCase())
      );
      return filtered.slice(0, limit);
    }),
    getByIds: protectedProcedure.input(z6.object({ ids: z6.array(z6.string()) })).query(async ({ input }) => {
      return await Promise.all(input.ids.map((id) => getWorkflowById(id)));
    }),
    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") {
        return await getAllWorkflows();
      } else {
        return await getWorkflowsByRequester(ctx.user.id);
      }
    }),
    getById: protectedProcedure.input(z6.object({ id: z6.string() })).query(async ({ input, ctx }) => {
      const workflow = await getWorkflowById(input.id);
      if (!workflow) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Workflow not found"
        });
      }
      const accessCheck = await checkWorkflowAccess(
        input.id,
        ctx.user.id,
        ctx.user.role,
        ctx.user.department
      );
      if (!accessCheck.hasAccess) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: `Access denied: ${accessCheck.reason}`
        });
      }
      return workflow;
    }),
    getWithDetails: protectedProcedure.input(z6.object({ id: z6.string() })).query(async ({ input }) => {
      const workflow = await getWorkflowById(input.id);
      if (!workflow) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Workflow not found"
        });
      }
      const stages = await getStagesByWorkflow(input.id);
      const approvals = await getApprovalsByWorkflow(input.id);
      const files = await getFilesByWorkflow(input.id);
      const comments = await getCommentsByWorkflow(input.id);
      return {
        workflow,
        stages,
        approvals,
        files,
        comments
      };
    }),
    submit: protectedProcedure.input(z6.object({ id: z6.string() })).mutation(async ({ input, ctx }) => {
      const workflow = await getWorkflowById(input.id);
      if (!workflow) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Workflow not found"
        });
      }
      if (workflow.requesterId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Not authorized" });
      }
      await submitWorkflow(input.id);
      const stages = await getStagesByWorkflow(input.id);
      if (stages.length > 0) {
        await updateStageStatus(stages[0].id, "in_progress");
      }
      await createAuditLog({
        entityType: "workflow",
        entityId: input.id,
        action: "submitted",
        actionDescription: "Workflow submitted for approval",
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    discontinue: protectedProcedure.input(
      z6.object({
        id: z6.string(),
        reason: z6.string().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const workflow = await getWorkflowById(input.id);
      if (!workflow) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Workflow not found"
        });
      }
      if (workflow.requesterId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Not authorized to discontinue this workflow"
        });
      }
      if (["completed", "discontinued", "archived"].includes(
        workflow.overallStatus
      )) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: `Cannot discontinue ${workflow.overallStatus} workflow`
        });
      }
      await discontinueWorkflow(input.id, input.reason);
      await createAuditLog({
        entityType: "workflow",
        entityId: input.id,
        action: "discontinued",
        actionDescription: `Workflow discontinued${input.reason ? `: ${input.reason}` : ""}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    archive: protectedProcedure.input(z6.object({ id: z6.string() })).mutation(async ({ input, ctx }) => {
      const workflow = await getWorkflowById(input.id);
      if (!workflow) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Workflow not found"
        });
      }
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Only admins can archive workflows"
        });
      }
      await archiveWorkflow(input.id);
      await createAuditLog({
        entityType: "workflow",
        entityId: input.id,
        action: "archived",
        actionDescription: "Workflow archived",
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    delete: protectedProcedure.input(z6.object({ id: z6.string() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Only admins can delete workflows"
        });
      }
      const workflow = await getWorkflowById(input.id);
      if (!workflow) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Workflow not found"
        });
      }
      await deleteWorkflow(input.id);
      await createAuditLog({
        entityType: "workflow",
        entityId: input.id,
        action: "deleted",
        actionDescription: `Workflow permanently deleted: ${workflow.title}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      invalidateAnalyticsCache();
      return { success: true };
    }),
    updateStatus: protectedProcedure.input(
      z6.object({
        id: z6.string(),
        status: z6.enum([
          "draft",
          "in_progress",
          "completed",
          "rejected",
          "cancelled"
        ])
      })
    ).mutation(async ({ input, ctx }) => {
      await updateWorkflowStatus(input.id, input.status);
      await createAuditLog({
        entityType: "workflow",
        entityId: input.id,
        action: "status_updated",
        actionDescription: `Status updated to ${input.status}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    uploadFile: protectedProcedure.input(
      z6.object({
        workflowId: z6.string(),
        stageId: z6.string().optional(),
        // Which stage this file belongs to
        filename: z6.string(),
        fileData: z6.string(),
        // base64 encoded
        mimeType: z6.string(),
        fileSize: z6.number()
      })
    ).mutation(async ({ input, ctx }) => {
      const fileBuffer = Buffer.from(input.fileData, "base64");
      const fileKey = `workflows/${input.workflowId}/${Date.now()}-${input.filename}`;
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
      await createWorkflowFile({
        workflowId: input.workflowId,
        stageId: input.stageId,
        fileName: input.filename,
        fileType: "attachment",
        s3Bucket: "manus-storage",
        s3Key: fileKey,
        s3Url: url,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        uploadedBy: ctx.user.id
      });
      await createAuditLog({
        entityType: "workflow",
        entityId: input.workflowId.toString(),
        action: "file_uploaded",
        actionDescription: `File uploaded: ${input.filename}${input.stageId ? ` for stage ${input.stageId}` : ""}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true, url };
    }),
    getFiles: protectedProcedure.input(z6.object({ workflowId: z6.string() })).query(async ({ input }) => {
      return await Promise.all((await getFilesByWorkflow(input.workflowId)).map(withFreshS3Url));
    }),
    deleteFile: protectedProcedure.input(z6.object({ fileId: z6.string() })).mutation(async ({ input, ctx }) => {
      const file = await getWorkflowFileById(input.fileId);
      if (!file) {
        throw new TRPCError3({ code: "NOT_FOUND", message: "File not found" });
      }
      await deleteWorkflowFile(input.fileId);
      await createAuditLog({
        entityType: "workflow",
        entityId: file.workflowId.toString(),
        action: "file_deleted",
        actionDescription: `File deleted: ${file.fileName}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    })
  }),
  // ============================================
  // Workflow Stage Management
  // ============================================
  stages: router({
    getByWorkflow: protectedProcedure.input(z6.object({ workflowId: z6.string() })).query(async ({ input }) => {
      return await getStagesByWorkflow(input.workflowId);
    }),
    approve: protectedProcedure.input(
      z6.object({
        stageId: z6.string(),
        workflowId: z6.string(),
        comments: z6.string().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const stage = await getStageById(input.stageId);
      if (!stage) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Stage not found"
        });
      }
      if (stage.requiredRole && ctx.user.role !== stage.requiredRole && ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Not authorized to approve this stage"
        });
      }
      if (ctx.user.role !== "CEO" && ctx.user.role !== "CFO" && ctx.user.role !== "admin") {
        const stageFiles = await getFilesByStage(input.stageId);
        const userUploadedFile = stageFiles.find(
          (f) => f.uploadedBy === ctx.user.id
        );
        if (!userUploadedFile) {
          throw new TRPCError3({
            code: "PRECONDITION_FAILED",
            message: "You must upload a form before approving this stage"
          });
        }
      }
      await createApproval({
        workflowId: input.workflowId,
        stageId: input.stageId,
        approverId: ctx.user.id,
        approverRole: ctx.user.role,
        action: "approved",
        comments: input.comments
      });
      await updateStageStatus(input.stageId, "completed");
      const workflow = await getWorkflowById(input.workflowId);
      if (!workflow) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Workflow not found"
        });
      }
      const stages = await getStagesByWorkflow(input.workflowId);
      const currentStageIndex = stages.findIndex((s) => s.id === input.stageId);
      if (currentStageIndex < stages.length - 1) {
        const nextStage = stages[currentStageIndex + 1];
        await updateStageStatus(nextStage.id, "in_progress");
        if (nextStage.requiredRole) {
          const nextApprovers = await getUsersByRole(
            nextStage.requiredRole
          );
          for (const approver of nextApprovers) {
            try {
              await sendMilestoneCompletionEmail(
                {
                  workflowNumber: workflow.workflowNumber,
                  workflowTitle: workflow.title,
                  milestoneName: nextStage.stageName,
                  approverName: approver.fullName,
                  approverEmail: approver.email,
                  workflowUrl: `${APP_BASE_URL}/workflows/${workflow.id}`,
                  completedBy: ctx.user.fullName
                },
                workflow.id,
                ctx.user.email
              );
            } catch (emailError) {
              console.error(
                `Failed to send email to ${approver.email}:`,
                emailError
              );
            }
          }
        }
      } else {
        const workflow2 = await getWorkflowById(input.workflowId);
        if (workflow2?.contingencyWorkflowIds && workflow2.contingencyWorkflowIds.length > 0) {
          const contingencyWorkflows = await Promise.all(
            workflow2.contingencyWorkflowIds.map((id) => getWorkflowById(id))
          );
          const incompleteContingencies = contingencyWorkflows.filter(
            (w) => w && w.overallStatus !== "completed"
          );
          if (incompleteContingencies.length > 0) {
            const names = incompleteContingencies.map((w) => w?.title || "Unknown").join(", ");
            throw new TRPCError3({
              code: "PRECONDITION_FAILED",
              message: `Cannot complete workflow. The following contingency workflows must be completed first: ${names}`
            });
          }
        }
        await updateWorkflowStatus(input.workflowId, "completed");
        const creator = await getUserById(workflow2.requesterId);
        if (creator) {
          try {
            await sendCompletionEmail(
              {
                workflowNumber: workflow2.workflowNumber,
                workflowTitle: workflow2.title,
                completedAt: (/* @__PURE__ */ new Date()).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Jakarta"
                }),
                recipientName: creator.fullName,
                recipientEmail: creator.email,
                workflowUrl: `${APP_BASE_URL}/workflows/${workflow2.id}`
              },
              workflow2.id,
              ctx.user.email
            );
          } catch (emailError) {
            console.error(
              `Failed to send completion email to ${creator.email}:`,
              emailError
            );
          }
        }
      }
      await createAuditLog({
        entityType: "stage",
        entityId: input.stageId,
        action: "approved",
        actionDescription: `Stage approved: ${stage.stageName}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    reject: protectedProcedure.input(
      z6.object({
        stageId: z6.string(),
        workflowId: z6.string(),
        comments: z6.string()
      })
    ).mutation(async ({ input, ctx }) => {
      const stage = await getStageById(input.stageId);
      if (!stage) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Stage not found"
        });
      }
      if (stage.requiredRole && ctx.user.role !== stage.requiredRole && ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Not authorized to reject this stage"
        });
      }
      await createApproval({
        workflowId: input.workflowId,
        stageId: input.stageId,
        approverId: ctx.user.id,
        approverRole: ctx.user.role,
        action: "rejected",
        comments: input.comments
      });
      await updateStageStatus(input.stageId, "rejected");
      await updateWorkflowStatus(input.workflowId, "rejected");
      const workflow = await getWorkflowById(input.workflowId);
      if (workflow) {
        const creator = await getUserById(workflow.requesterId);
        if (creator) {
          try {
            await sendRejectionEmail(
              {
                workflowNumber: workflow.workflowNumber,
                workflowTitle: workflow.title,
                milestoneName: stage.stageName,
                rejectedBy: ctx.user.fullName,
                rejectionReason: input.comments,
                creatorName: creator.fullName,
                creatorEmail: creator.email,
                workflowUrl: `${APP_BASE_URL}/workflows/${workflow.id}`
              },
              workflow.id,
              ctx.user.email
            );
          } catch (emailError) {
            console.error(
              `Failed to send rejection email to ${creator.email}:`,
              emailError
            );
          }
        }
      }
      await createAuditLog({
        entityType: "stage",
        entityId: input.stageId,
        action: "rejected",
        actionDescription: `Stage rejected: ${stage.stageName}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    })
  }),
  // ============================================
  // File Management
  // ============================================
  files: router({
    upload: protectedProcedure.input(
      z6.object({
        workflowId: z6.string(),
        stageId: z6.string().optional(),
        fileName: z6.string(),
        fileType: z6.string(),
        fileCategory: z6.string().optional(),
        fileData: z6.string(),
        // base64 encoded
        mimeType: z6.string()
      })
    ).mutation(async ({ input, ctx }) => {
      const fileBuffer = Buffer.from(input.fileData, "base64");
      const storageKey = `workflows/${input.workflowId}/${randomUUID3()}-${input.fileName}`;
      const { url } = await storagePut(
        storageKey,
        fileBuffer,
        input.mimeType
      );
      const file = await createWorkflowFile({
        workflowId: input.workflowId,
        stageId: input.stageId,
        fileName: input.fileName,
        fileType: input.fileType,
        fileCategory: input.fileCategory,
        // Legacy database column names retained until the storage schema migration.
        s3Bucket: process.env.AZURE_STORAGE_CONTAINER || "finance-attachments",
        s3Key: storageKey,
        s3Url: url,
        fileSize: fileBuffer.length,
        mimeType: input.mimeType,
        uploadedBy: ctx.user.id
      });
      await createAuditLog({
        entityType: "file",
        entityId: file.id,
        action: "uploaded",
        actionDescription: `File uploaded: ${input.fileName}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return file;
    }),
    getByWorkflow: protectedProcedure.input(z6.object({ workflowId: z6.string() })).query(async ({ input }) => {
      return await Promise.all((await getFilesByWorkflow(input.workflowId)).map(withFreshS3Url));
    }),
    getByStage: protectedProcedure.input(z6.object({ stageId: z6.string() })).query(async ({ input }) => {
      return await Promise.all((await getFilesByStage(input.stageId)).map(withFreshS3Url));
    })
  }),
  // ============================================
  // Comment Management
  // ============================================
  comments: router({
    create: protectedProcedure.input(
      z6.object({
        workflowId: z6.string(),
        stageId: z6.string().optional(),
        commentText: z6.string(),
        commentType: z6.string().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const comment = await createComment({
        ...input,
        authorId: ctx.user.id,
        authorRole: ctx.user.role
      });
      await createAuditLog({
        entityType: "comment",
        entityId: comment.id,
        action: "created",
        actionDescription: "Comment added",
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return comment;
    }),
    getByWorkflow: protectedProcedure.input(z6.object({ workflowId: z6.string() })).query(async ({ input }) => {
      return await getCommentsByWorkflow(input.workflowId);
    }),
    getByStage: protectedProcedure.input(z6.object({ stageId: z6.string() })).query(async ({ input }) => {
      return await getCommentsByStage(input.stageId);
    })
  }),
  // ============================================
  // Audit Logs
  // ============================================
  auditLogs: router({
    getByEntity: protectedProcedure.input(
      z6.object({
        entityType: z6.string(),
        entityId: z6.string()
      })
    ).query(async ({ input }) => {
      return await getAuditLogsByEntity(input.entityType, input.entityId);
    })
  }),
  // ============================================
  // Email Recipients
  // ============================================
  emailRecipients: router({
    getByGroup: adminProcedure2.input(z6.object({ group: z6.string() })).query(async ({ input }) => {
      return await getEmailRecipientsByGroup(input.group);
    }),
    getAll: adminProcedure2.query(async () => {
      return await getAllEmailRecipients();
    })
  }),
  // ============================================
  // Form Templates Management
  // ============================================
  formTemplates: router({
    create: adminProcedure2.input(
      z6.object({
        templateName: z6.string(),
        templateCode: z6.string(),
        description: z6.string().optional(),
        fields: z6.array(
          z6.object({
            id: z6.string(),
            type: z6.enum([
              "text",
              "number",
              "date",
              "dropdown",
              "textarea",
              "file",
              "checkbox",
              "email"
            ]),
            label: z6.string(),
            placeholder: z6.string().optional(),
            required: z6.boolean(),
            options: z6.array(z6.string()).optional(),
            validation: z6.object({
              min: z6.number().optional(),
              max: z6.number().optional(),
              pattern: z6.string().optional(),
              message: z6.string().optional()
            }).optional(),
            defaultValue: z6.any().optional(),
            mappingKey: z6.string().optional(),
            showInTable: z6.boolean().optional(),
            tableLabel: z6.string().optional(),
            tableOrder: z6.number().int().optional()
          })
        )
      })
    ).mutation(async ({ input, ctx }) => {
      validateFieldMappings(input.fields);
      const template = await createFormTemplate({
        templateName: input.templateName,
        templateCode: input.templateCode,
        description: input.description,
        fields: input.fields,
        createdBy: ctx.user.id
      });
      await createAuditLog({
        entityType: "form_template",
        entityId: template.id,
        action: "created",
        actionDescription: `Form template created: ${input.templateName}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return template;
    }),
    getAll: protectedProcedure.query(async () => {
      return await getAllFormTemplates();
    }),
    getActive: protectedProcedure.query(async () => {
      return await getActiveFormTemplates();
    }),
    getById: protectedProcedure.input(z6.object({ id: z6.string() })).query(async ({ input }) => {
      const template = await getFormTemplateById(input.id);
      if (!template) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Form template not found"
        });
      }
      return template;
    }),
    update: adminProcedure2.input(
      z6.object({
        id: z6.string(),
        templateName: z6.string().optional(),
        description: z6.string().optional(),
        fields: z6.array(
          z6.object({
            id: z6.string(),
            type: z6.enum([
              "text",
              "number",
              "date",
              "dropdown",
              "textarea",
              "file",
              "checkbox",
              "email"
            ]),
            label: z6.string(),
            placeholder: z6.string().optional(),
            required: z6.boolean(),
            options: z6.array(z6.string()).optional(),
            validation: z6.object({
              min: z6.number().optional(),
              max: z6.number().optional(),
              pattern: z6.string().optional(),
              message: z6.string().optional()
            }).optional(),
            defaultValue: z6.any().optional(),
            mappingKey: z6.string().optional(),
            showInTable: z6.boolean().optional(),
            tableLabel: z6.string().optional(),
            tableOrder: z6.number().int().optional()
          })
        ).optional(),
        isActive: z6.boolean().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      if (input.fields) validateFieldMappings(input.fields);
      const existingTemplate = await getFormTemplateById(input.id);
      if (!existingTemplate) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Form template not found"
        });
      }
      await updateFormTemplate(input.id, {
        templateName: input.templateName,
        description: input.description,
        fields: input.fields,
        isActive: input.isActive,
        version: existingTemplate.version + 1
      });
      await createAuditLog({
        entityType: "form_template",
        entityId: input.id,
        action: "updated",
        actionDescription: `Form template updated`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    delete: adminProcedure2.input(z6.object({ id: z6.string() })).mutation(async ({ input, ctx }) => {
      await deleteFormTemplate(input.id);
      await createAuditLog({
        entityType: "form_template",
        entityId: input.id,
        action: "deleted",
        actionDescription: `Form template deleted`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    uploadDocument: adminProcedure2.input(
      z6.object({
        formTemplateId: z6.string(),
        documentName: z6.string(),
        filename: z6.string(),
        fileData: z6.string(),
        // base64
        fileSize: z6.number(),
        fields: z6.array(
          z6.object({
            id: z6.string(),
            name: z6.string(),
            label: z6.string(),
            type: z6.enum(["text", "number", "date", "email", "signature", "checkbox"]),
            required: z6.boolean(),
            placeholder: z6.string().optional(),
            validation: z6.object({
              min: z6.number().optional(),
              max: z6.number().optional(),
              pattern: z6.string().optional(),
              message: z6.string().optional()
            }).optional(),
            position: z6.object({
              page: z6.number().optional(),
              x: z6.number().optional(),
              y: z6.number().optional(),
              width: z6.number().optional(),
              height: z6.number().optional()
            }).optional()
          })
        )
      })
    ).mutation(async ({ input, ctx }) => {
      if (ctx.user.email !== "eddie.amintohir@compawnion.co") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Only super admin can upload documents"
        });
      }
      const buffer = Buffer.from(input.fileData, "base64");
      const documentType = input.filename.toLowerCase().endsWith(".pdf") ? "pdf" : "excel";
      const storageUrl = await storagePut(
        `form-templates/${input.formTemplateId}/${input.filename}`,
        buffer,
        `application/${documentType === "pdf" ? "pdf" : "vnd.openxmlformats-officedocument.spreadsheetml.sheet"}`
      );
      const { DocumentFields } = await Promise.resolve().then(() => (init_documentFields(), documentFields_exports));
      const doc = await DocumentFields.createFormTemplateDocument(
        input.formTemplateId,
        input.documentName,
        documentType,
        input.fileSize,
        storageUrl,
        input.fields,
        ctx.user.id
      );
      await createAuditLog({
        entityType: "form_template_document",
        entityId: doc.id,
        action: "created",
        actionDescription: `Document uploaded: ${input.documentName}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return doc;
    }),
    getDocuments: protectedProcedure.input(z6.object({ formTemplateId: z6.string() })).query(async ({ input }) => {
      const { DocumentFields } = await Promise.resolve().then(() => (init_documentFields(), documentFields_exports));
      return await DocumentFields.getFormTemplateDocuments(input.formTemplateId);
    }),
    deleteDocument: adminProcedure2.input(z6.object({ documentId: z6.string() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.email !== "eddie.amintohir@compawnion.co") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Only super admin can delete documents"
        });
      }
      const { DocumentFields } = await Promise.resolve().then(() => (init_documentFields(), documentFields_exports));
      await DocumentFields.deleteFormTemplateDocument(input.documentId);
      await createAuditLog({
        entityType: "form_template_document",
        entityId: input.documentId,
        action: "deleted",
        actionDescription: `Document deleted`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    })
  }),
  // ============================================
  // Form Submissions
  // ============================================
  formSubmissions: router({
    create: protectedProcedure.input(
      z6.object({
        templateId: z6.union([z6.string(), z6.number()]).transform((val) => String(val)),
        workflowId: z6.string().optional(),
        stageId: z6.string().optional(),
        formData: z6.record(z6.any()),
        submissionStatus: z6.enum(["draft", "submitted", "approved", "rejected"]).optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const submission = await createFormSubmission({
        templateId: String(input.templateId),
        workflowId: input.workflowId,
        stageId: input.stageId,
        formData: input.formData,
        submittedBy: ctx.user.id,
        submissionStatus: input.submissionStatus || "draft",
        submittedAt: input.submissionStatus === "submitted" ? /* @__PURE__ */ new Date() : void 0
      });
      await createAuditLog({
        entityType: "form_submission",
        entityId: submission.id,
        action: "created",
        actionDescription: `Form submission created`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return submission;
    }),
    getById: protectedProcedure.input(z6.object({ id: z6.string() })).query(async ({ input }) => {
      const submission = await getFormSubmissionById(input.id);
      if (!submission) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Form submission not found"
        });
      }
      return submission;
    }),
    getByWorkflow: protectedProcedure.input(z6.object({ workflowId: z6.string() })).query(async ({ input }) => {
      const submissions = await getFormSubmissionsByWorkflow(
        input.workflowId
      );
      const submissionsWithTemplates = await Promise.all(
        submissions.map(async (submission) => {
          const template = await getFormTemplateById(
            submission.templateId
          );
          return {
            ...submission,
            template
          };
        })
      );
      return submissionsWithTemplates;
    }),
    getProcessingInbox: adminProcedure2.query(async () => {
      const rows = await getFormSubmissionsForProcessing();
      const workflowIds = rows.flatMap(
        (row) => row.workflow ? [row.workflow.id] : []
      );
      const allStages = await getStagesByWorkflowIds(workflowIds);
      const stagesByWorkflow = /* @__PURE__ */ new Map();
      allStages.forEach((stage) => {
        const stages = stagesByWorkflow.get(stage.workflowId) || [];
        stages.push(stage);
        stagesByWorkflow.set(stage.workflowId, stages);
      });
      return rows.map(({ submission, template, workflow, submitter }) => {
        const fields = template.fields || [];
        const { missingFields, mappedFields } = buildProcessingFields(
          fields,
          submission.formData
        );
        const stages = workflow ? stagesByWorkflow.get(workflow.id) || [] : [];
        const activeStage = stages.find(
          (stage) => ["pending", "in_progress"].includes(stage.status)
        );
        const hasProgress = stages.some(
          (stage) => ["in_progress", "completed"].includes(stage.status)
        );
        const processingStatus = deriveProcessingStatus({
          workflowCompleted: workflow?.overallStatus === "completed",
          missingFieldCount: missingFields.length,
          submissionIsDraft: submission.submissionStatus === "draft",
          hasWorkflowProgress: hasProgress
        });
        return {
          submissionId: submission.id,
          workflowId: workflow?.id || null,
          workflowNumber: workflow?.workflowNumber || null,
          workflowTitle: workflow?.title || null,
          templateId: template.id,
          templateName: template.templateName,
          submitterName: submitter?.fullName || "Unknown user",
          submitterEmail: submitter?.email || null,
          processingStatus,
          missingFields,
          mappedFields,
          activeStage: activeStage ? {
            id: activeStage.id,
            name: activeStage.stageName,
            requiredRole: activeStage.requiredRole,
            isFinal: stages.at(-1)?.id === activeStage.id
          } : null,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          completedAt: workflow?.completedAt || null
        };
      });
    }),
    update: protectedProcedure.input(
      z6.object({
        id: z6.string(),
        formData: z6.record(z6.any()).optional(),
        submissionStatus: z6.enum(["draft", "submitted", "approved", "rejected"]).optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const submission = await getFormSubmissionById(input.id);
      if (!submission) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Form submission not found"
        });
      }
      if (submission.submittedBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "You can only update your own form submissions"
        });
      }
      await updateFormSubmission(input.id, {
        formData: input.formData,
        submissionStatus: input.submissionStatus,
        submittedAt: input.submissionStatus === "submitted" ? /* @__PURE__ */ new Date() : void 0
      });
      await createAuditLog({
        entityType: "form_submission",
        entityId: input.id,
        action: "updated",
        actionDescription: `Form submission updated`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    delete: protectedProcedure.input(z6.object({ id: z6.string() })).mutation(async ({ input, ctx }) => {
      await deleteFormSubmission(input.id);
      await createAuditLog({
        entityType: "form_submission",
        entityId: input.id,
        action: "deleted",
        actionDescription: `Form submission deleted`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    })
  }),
  // ============================================
  // Sequence Generators
  // ============================================
  sequences: router({
    getAll: adminProcedure2.query(async () => {
      return await getAllSequenceCounters();
    }),
    getByType: adminProcedure2.input(z6.object({ type: z6.enum(["MAF", "PR", "CATTO", "SKU", "PAF"]) })).query(async ({ input }) => {
      return await getSequenceCountersByType(input.type);
    }),
    generate: protectedProcedure.input(z6.object({ type: z6.enum(["MAF", "PR", "CATTO", "SKU", "PAF"]) })).mutation(async ({ input, ctx }) => {
      const sequenceNumber = await generateSequenceNumber(input.type);
      await createAuditLog({
        entityType: "sequence",
        entityId: sequenceNumber,
        action: "generated",
        actionDescription: `${input.type} sequence number generated: ${sequenceNumber}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { sequenceNumber };
    }),
    reset: adminProcedure2.input(
      z6.object({
        type: z6.enum(["MAF", "PR", "CATTO", "SKU", "PAF"]),
        date: z6.string()
      })
    ).mutation(async ({ input, ctx }) => {
      await resetSequenceCounter(input.type, input.date);
      await createAuditLog({
        entityType: "sequence",
        entityId: `${input.type}-${input.date}`,
        action: "reset",
        actionDescription: `${input.type} sequence counter reset for ${input.date}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    })
  }),
  // ============================================
  // Analytics
  // ============================================
  analytics: router({
    overview: protectedProcedure.query(async () => {
      return await withCache(
        "analytics:overview",
        CACHE_TTL.OVERVIEW,
        () => getWorkflowAnalytics()
      );
    }),
    byType: protectedProcedure.query(async () => {
      return await withCache(
        "analytics:byType",
        CACHE_TTL.BY_TYPE,
        () => getWorkflowsByType()
      );
    }),
    byDepartment: protectedProcedure.query(async () => {
      return await withCache(
        "analytics:byDepartment",
        CACHE_TTL.BY_DEPARTMENT,
        () => getWorkflowsByDepartment()
      );
    }),
    byStatus: protectedProcedure.query(async () => {
      return await withCache(
        "analytics:byStatus",
        CACHE_TTL.BY_STATUS,
        () => getWorkflowsByStatus()
      );
    }),
    avgTimeByType: protectedProcedure.query(async () => {
      return await withCache(
        "analytics:avgTimeByType",
        CACHE_TTL.AVG_TIME,
        () => getAvgApprovalTimeByType()
      );
    }),
    completionTrend: protectedProcedure.input(z6.object({ days: z6.number().optional().default(30) })).query(async ({ input }) => {
      return await withCache(
        `analytics:completionTrend:${input.days}`,
        CACHE_TTL.COMPLETION_TREND,
        () => getWorkflowCompletionTrend(input.days)
      );
    }),
    timeline: protectedProcedure.query(async () => {
      return await withCache(
        "analytics:timeline",
        CACHE_TTL.TIMELINE,
        () => getWorkflowTimeline()
      );
    }),
    // Department-specific analytics with per-department caching
    departmentMetrics: protectedProcedure.input(z6.object({ department: z6.string() })).query(async ({ input }) => {
      return await withCache(
        `analytics:departmentMetrics:${input.department}`,
        CACHE_TTL.DEPARTMENT_METRICS,
        () => getDepartmentMetrics(input.department)
      );
    }),
    departmentCostBreakdown: protectedProcedure.input(
      z6.object({
        department: z6.string(),
        period: z6.enum(["monthly", "yearly"]).default("monthly")
      })
    ).query(async ({ input }) => {
      return await withCache(
        `analytics:costBreakdown:${input.department}:${input.period}`,
        CACHE_TTL.COST_BREAKDOWN,
        () => getDepartmentCostBreakdown(input.department, input.period)
      );
    })
  }),
  // ============================================
  // Budget Management
  // ============================================
  budgets: router({
    create: protectedProcedure.input(
      z6.object({
        department: z6.string(),
        year: z6.number(),
        month: z6.number().optional(),
        quarter: z6.number().optional(),
        allocatedAmount: z6.number(),
        period: z6.enum(["monthly", "quarterly", "yearly"])
      })
    ).mutation(async ({ input }) => {
      return await createBudget(input);
    }),
    getByDepartment: protectedProcedure.input(
      z6.object({
        department: z6.string(),
        year: z6.number()
      })
    ).query(async ({ input }) => {
      return await getBudgetsByDepartment(input.department, input.year);
    }),
    getAll: protectedProcedure.input(z6.object({ year: z6.number() })).query(async ({ input }) => {
      return await getAllBudgets(input.year);
    }),
    update: protectedProcedure.input(
      z6.object({
        id: z6.string(),
        allocatedAmount: z6.number()
      })
    ).mutation(async ({ input }) => {
      return await updateBudget(input.id, input.allocatedAmount);
    }),
    delete: protectedProcedure.input(z6.object({ id: z6.string() })).mutation(async ({ input }) => {
      await deleteBudget(input.id);
      return { success: true };
    }),
    analytics: protectedProcedure.input(
      z6.object({
        department: z6.string(),
        year: z6.number(),
        period: z6.enum(["monthly", "quarterly", "yearly"])
      })
    ).query(async ({ input }) => {
      return await getDepartmentBudgetAnalytics(
        input.department,
        input.year,
        input.period
      );
    })
  }),
  // ============================================
  // Workflow Templates
  // ============================================
  templates: templatesRouter,
  // ============================================
  // Email Reminders
  // ============================================
  reminders: router({
    // Manual trigger for testing (admin only)
    sendNow: adminProcedure2.mutation(async () => {
      await triggerRemindersNow();
      return { success: true, message: "Reminders sent successfully" };
    })
  }),
  // ============================================
  // Excel Template Management
  // ============================================
  excelTemplates: router({
    create: adminProcedure2.input(
      z6.object({
        workflowType: z6.string(),
        templateName: z6.string(),
        description: z6.string().optional(),
        fileUrl: z6.string(),
        fileKey: z6.string(),
        fileName: z6.string(),
        fileSize: z6.number().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError3({ code: "UNAUTHORIZED" });
      const result = await createExcelTemplate({
        ...input,
        uploadedBy: ctx.user.id
      });
      await createAuditLog({
        entityType: "excel_template",
        entityId: result.insertId?.toString() || "unknown",
        action: "created",
        actionDescription: `Excel template created: ${input.templateName}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return result;
    }),
    getAll: adminProcedure2.query(async () => {
      await ensureExcelMappingSchema();
      return await Promise.all((await getAllExcelTemplates()).map(withFreshFileUrl));
    }),
    getActive: protectedProcedure.query(async () => {
      await ensureExcelMappingSchema();
      return await getActiveExcelTemplates();
    }),
    getForFormTemplate: protectedProcedure.input(z6.object({ formTemplateId: z6.string().uuid() })).query(async ({ input }) => {
      await ensureExcelMappingSchema();
      return await getExcelTemplatesByFormTemplate(input.formTemplateId);
    }),
    getByWorkflowType: protectedProcedure.input(z6.object({ workflowType: z6.string() })).query(async ({ input }) => {
      await ensureExcelMappingSchema();
      return await getExcelTemplateByWorkflowType(input.workflowType);
    }),
    getDownloadUrl: protectedProcedure.input(z6.object({ id: z6.number() })).query(async ({ input }) => {
      await ensureExcelMappingSchema();
      const template = await getExcelTemplateById(input.id);
      if (!template) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Template not found"
        });
      }
      const { url } = await storageGet(template.fileKey, 3600);
      return { url, fileName: template.fileName };
    }),
    update: adminProcedure2.input(
      z6.object({
        id: z6.number(),
        templateName: z6.string().optional(),
        description: z6.string().optional(),
        isActive: z6.boolean().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;
      await updateExcelTemplate(id, updates);
      await createAuditLog({
        entityType: "excel_template",
        entityId: id.toString(),
        action: "updated",
        actionDescription: `Excel template updated`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    delete: adminProcedure2.input(z6.object({ id: z6.number() })).mutation(async ({ input, ctx }) => {
      await deleteExcelTemplate(input.id);
      await createAuditLog({
        entityType: "excel_template",
        entityId: input.id.toString(),
        action: "deleted",
        actionDescription: `Excel template deleted`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    uploadFile: adminProcedure2.input(
      z6.object({
        workflowType: z6.string(),
        templateName: z6.string(),
        description: z6.string().optional(),
        filename: z6.string().min(1).max(255),
        fileData: z6.string().min(1).max(14e6),
        fileSize: z6.number().int().positive().max(10 * 1024 * 1024)
      })
    ).mutation(async ({ input, ctx }) => {
      const safeFilename = input.filename.split(/[\\/]/).pop() || "";
      if (!safeFilename.toLowerCase().endsWith(".xlsx")) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "Only .xlsx workbooks are supported"
        });
      }
      const fileBuffer = Buffer.from(input.fileData, "base64");
      if (fileBuffer.length !== input.fileSize || fileBuffer[0] !== 80 || fileBuffer[1] !== 75) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "The uploaded file is not a valid .xlsx workbook"
        });
      }
      const { inspectWorkbook: inspectWorkbook2 } = await Promise.resolve().then(() => (init_excelWorkbook(), excelWorkbook_exports));
      await inspectWorkbook2(fileBuffer);
      const workflowKey = input.workflowType.replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileKey = `excel-templates/${workflowKey}/${Date.now()}-${safeFilename}`;
      const { url } = await storagePut(
        fileKey,
        fileBuffer,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      const result = await createExcelTemplate({
        workflowType: input.workflowType,
        templateName: input.templateName,
        description: input.description,
        fileUrl: url,
        fileKey,
        fileName: safeFilename,
        fileSize: input.fileSize,
        uploadedBy: ctx.user.id
      });
      await createAuditLog({
        entityType: "excel_template",
        entityId: result.insertId?.toString() || "unknown",
        action: "uploaded",
        actionDescription: `Excel template uploaded: ${input.templateName}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true, url };
    }),
    // Inspect workbook and extract metadata
    inspectWorkbook: adminProcedure2.input(z6.object({ id: z6.number() })).query(async ({ input, ctx }) => {
      await ensureExcelMappingSchema();
      const template = await getExcelTemplateById(input.id);
      if (!template) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Template not found"
        });
      }
      const buffer = await storageDownload(template.fileKey);
      const { inspectWorkbook: inspectWorkbook2 } = await Promise.resolve().then(() => (init_excelWorkbook(), excelWorkbook_exports));
      const metadata = await inspectWorkbook2(buffer);
      await updateExcelTemplate(input.id, { workbookMetadata: metadata });
      await createAuditLog({
        entityType: "excel_template",
        entityId: input.id.toString(),
        action: "inspected",
        actionDescription: `Excel template inspected: ${template.templateName}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return metadata;
    }),
    // Save mapping configuration
    saveMapping: adminProcedure2.input(
      z6.object({
        id: z6.number(),
        formTemplateId: z6.string().uuid(),
        mappings: excelWorkbookMappingsSchema,
        outputFileNamePattern: z6.string().max(255).optional()
      })
    ).mutation(async ({ input, ctx }) => {
      await ensureExcelMappingSchema();
      const template = await getExcelTemplateById(input.id);
      if (!template) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Template not found"
        });
      }
      const formTemplate = await getFormTemplateById(input.formTemplateId);
      if (!formTemplate) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Form template not found"
        });
      }
      const allowedKeys = /* @__PURE__ */ new Set([
        ...BUILTIN_MAPPING_KEYS,
        ...formTemplate.fields.map((field) => field.mappingKey?.trim()).filter((key) => Boolean(key))
      ]);
      const invalidKeys = input.mappings.map((mapping) => mapping.mappingKey).filter((key) => !allowedKeys.has(key));
      if (invalidKeys.length > 0) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: `Unknown mapping keys: ${Array.from(new Set(invalidKeys)).join(", ")}`
        });
      }
      const buffer = await storageDownload(template.fileKey);
      const { validateMappings: validateMappings2 } = await Promise.resolve().then(() => (init_excelWorkbook(), excelWorkbook_exports));
      const validation = await validateMappings2(buffer, input.mappings);
      if (!validation.valid) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: `Invalid mappings: ${validation.errors.join(", ")}`
        });
      }
      await updateExcelTemplate(input.id, {
        formTemplateId: input.formTemplateId,
        workbookMappings: input.mappings,
        workbookMetadata: await (await Promise.resolve().then(() => (init_excelWorkbook(), excelWorkbook_exports))).inspectWorkbook(buffer),
        outputFileNamePattern: input.outputFileNamePattern || ""
      });
      await createAuditLog({
        entityType: "excel_template",
        entityId: input.id.toString(),
        action: "mapping_saved",
        actionDescription: `Excel template mapping saved for form template ${input.formTemplateId}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    // Generate Excel for a submission
    generateForSubmission: protectedProcedure.input(
      z6.object({
        excelTemplateId: z6.number(),
        submissionId: z6.string()
      })
    ).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError3({ code: "UNAUTHORIZED" });
      await ensureExcelMappingSchema();
      const template = await getExcelTemplateById(input.excelTemplateId);
      if (!template) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Excel template not found"
        });
      }
      if (!template.formTemplateId) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "Excel template has no form mapping"
        });
      }
      const submission = await getFormSubmissionById(input.submissionId);
      if (!submission) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Submission not found"
        });
      }
      if (submission.templateId !== template.formTemplateId) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "Excel template is not linked to this form template"
        });
      }
      const formTemplate = await getFormTemplateById(
        template.formTemplateId
      );
      if (!formTemplate) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Form template not found"
        });
      }
      const isSubmitter = submission.submittedBy === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";
      if (!isSubmitter && !isAdmin) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Not authorized to generate Excel for this submission"
        });
      }
      const templateBuffer = await storageDownload(template.fileKey);
      const { generateMappedWorkbook: generateMappedWorkbook2, generateOutputFilename: generateOutputFilename2 } = await Promise.resolve().then(() => (init_excelWorkbook(), excelWorkbook_exports));
      const mappings = Array.isArray(
        template.workbookMappings
      ) ? template.workbookMappings : typeof template.workbookMappings === "string" ? JSON.parse(template.workbookMappings) : [];
      let workflow = null;
      if (submission.workflowId) {
        workflow = await getWorkflowById(submission.workflowId);
      }
      const generatedBuffer = await generateMappedWorkbook2({
        templateBuffer,
        mappings,
        formTemplate,
        submission: { formData: submission.formData },
        workflow: workflow ? {
          workflowNumber: workflow.workflowNumber,
          title: workflow.title,
          status: workflow.overallStatus || "draft",
          department: workflow.department
        } : void 0,
        submitter: await (async () => {
          const user = await getUserById(submission.submittedBy);
          return { name: user?.fullName || "", email: user?.email || "" };
        })(),
        submittedAt: submission.submittedAt || void 0,
        createdAt: submission.createdAt || void 0,
        updatedAt: submission.updatedAt || void 0
      });
      const filename = generateOutputFilename2(
        template.outputFileNamePattern || "",
        {
          templateName: template.templateName,
          workflowNumber: workflow?.workflowNumber,
          submittedAt: submission.submittedAt || void 0
        }
      );
      const fileKey = `generated-workbooks/${Date.now()}-${filename}`;
      const { url } = await storagePut(
        fileKey,
        generatedBuffer,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      await createAuditLog({
        entityType: "excel_generation",
        entityId: input.submissionId,
        action: "generated",
        actionDescription: `Excel workbook generated for submission ${input.submissionId}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { url, filename };
    })
  }),
  // ============================================
  // Task Assignments
  // ============================================
  assignments: assignmentsRouter,
  // ============================================
  // Performance Metrics
  // ============================================
  metrics: metricsRouter,
  // ============================================
  // Salary Integration
  // ============================================
  salary: salaryRouter,
  // ============================================
  // Capacity Management
  // ============================================
  capacity: capacityRouter,
  // ============================================
  // Recurring Workflows
  // ============================================
  recurringWorkflows: router({
    // Create new recurring workflow
    create: protectedProcedure.input(
      z6.object({
        templateId: z6.string(),
        title: z6.string(),
        description: z6.string().optional(),
        department: z6.string(),
        frequency: z6.enum(["daily", "weekly", "monthly"]),
        dayOfMonth: z6.number().min(1).max(31).optional(),
        dayOfWeek: z6.number().min(0).max(6).optional(),
        startDate: z6.date(),
        endDate: z6.date().optional(),
        assignedTo: z6.array(z6.number()).optional(),
        assigneePresets: z6.record(z6.array(z6.number())).optional(),
        // { "stage_name": [userId1, userId2] }
        formTemplateId: z6.string().optional(),
        formData: z6.record(z6.any()).optional(),
        contingencyWorkflowIds: z6.array(z6.string()).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const recurring = await createRecurringWorkflow({
        ...input,
        createdBy: ctx.user.id
      });
      await createAuditLog({
        entityType: "recurring_workflow",
        entityId: recurring.id,
        action: "created",
        actionDescription: `Created recurring workflow: ${input.title}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return recurring;
    }),
    // Get user's recurring workflows
    getMyRecurringWorkflows: protectedProcedure.query(async ({ ctx }) => {
      return await getRecurringWorkflowsByUser(ctx.user.id);
    }),
    // Get specific recurring workflow
    getById: protectedProcedure.input(z6.object({ id: z6.string() })).query(async ({ input }) => {
      return await getRecurringWorkflowById(input.id);
    }),
    // Update recurring workflow
    update: protectedProcedure.input(
      z6.object({
        id: z6.string(),
        title: z6.string().optional(),
        description: z6.string().optional(),
        department: z6.string().optional(),
        frequency: z6.enum(["daily", "weekly", "monthly"]).optional(),
        dayOfMonth: z6.number().min(1).max(31).optional(),
        dayOfWeek: z6.number().min(0).max(6).optional(),
        startDate: z6.date().optional(),
        endDate: z6.date().optional(),
        assignedTo: z6.array(z6.number()).optional(),
        assigneePresets: z6.record(z6.array(z6.number())).optional(),
        formData: z6.record(z6.any()).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      const existing = await getRecurringWorkflowById(id);
      if (!existing) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Recurring workflow not found"
        });
      }
      if (existing.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Not authorized to update this recurring workflow"
        });
      }
      const updated = await updateRecurringWorkflow(id, updateData);
      await createAuditLog({
        entityType: "recurring_workflow",
        entityId: id,
        action: "updated",
        actionDescription: `Updated recurring workflow: ${updated.title}`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return updated;
    }),
    // Pause recurring workflow
    pause: protectedProcedure.input(z6.object({ id: z6.string() })).mutation(async ({ ctx, input }) => {
      const existing = await getRecurringWorkflowById(input.id);
      if (!existing) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Recurring workflow not found"
        });
      }
      if (existing.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Not authorized" });
      }
      await pauseRecurringWorkflow(input.id);
      await createAuditLog({
        entityType: "recurring_workflow",
        entityId: input.id,
        action: "paused",
        actionDescription: `Paused recurring workflow`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    // Resume recurring workflow
    resume: protectedProcedure.input(z6.object({ id: z6.string() })).mutation(async ({ ctx, input }) => {
      const existing = await getRecurringWorkflowById(input.id);
      if (!existing) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Recurring workflow not found"
        });
      }
      if (existing.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Not authorized" });
      }
      await resumeRecurringWorkflow(input.id);
      await createAuditLog({
        entityType: "recurring_workflow",
        entityId: input.id,
        action: "resumed",
        actionDescription: `Resumed recurring workflow`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    // Delete recurring workflow
    delete: protectedProcedure.input(z6.object({ id: z6.string() })).mutation(async ({ ctx, input }) => {
      const existing = await getRecurringWorkflowById(input.id);
      if (!existing) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Recurring workflow not found"
        });
      }
      if (existing.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Not authorized" });
      }
      await deleteRecurringWorkflow(input.id);
      await createAuditLog({
        entityType: "recurring_workflow",
        entityId: input.id,
        action: "deleted",
        actionDescription: `Deleted recurring workflow`,
        actorId: ctx.user.id,
        actorEmail: ctx.user.email,
        actorRole: ctx.user.role
      });
      return { success: true };
    }),
    // Get history of generated workflows
    getHistory: protectedProcedure.input(z6.object({ id: z6.string() })).query(async ({ input }) => {
      return await getRecurringWorkflowHistory(input.id);
    })
  }),
  // ============================================
  // E-Signature (HelloDoc Integration)
  // ============================================
  eSignature: router({
    // Create document record (upload only, no API send)
    createDocument: protectedProcedure.input(
      z6.object({
        workflowId: z6.string().optional(),
        documentName: z6.string(),
        documentUrl: z6.string(),
        documentKey: z6.string().optional(),
        signerEmail: z6.string().email(),
        signerName: z6.string()
      })
    ).mutation(async ({ ctx, input }) => {
      const documentKey = input.documentKey || storageKeyFromUrl(input.documentUrl);
      if (!documentKey) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "The uploaded document is missing its Azure Blob storage key."
        });
      }
      const docId = await createSignedDocument({
        workflowId: input.workflowId || "standalone",
        documentName: input.documentName,
        s3Key: null,
        s3Url: null,
        uploadedS3Key: documentKey,
        uploadedS3Url: input.documentUrl,
        helloDocDocumentId: null,
        signerId: ctx.user.id,
        signerEmail: input.signerEmail,
        signerName: input.signerName
      });
      return { documentId: docId };
    }),
    // Update document with HelloDoc ID (entered manually after sending from HelloDoc)
    updateHelloDocId: protectedProcedure.input(
      z6.object({
        documentId: z6.string(),
        helloDocDocumentId: z6.string()
      })
    ).mutation(async ({ input }) => {
      await updateSignedDocumentHelloDocId(
        input.documentId,
        input.helloDocDocumentId
      );
      return { success: true };
    }),
    // Legacy sendForSignature (kept for backward compatibility but not used in hybrid workflow)
    sendForSignature: protectedProcedure.input(
      z6.object({
        workflowId: z6.string().optional(),
        // Optional for standalone usage
        documentName: z6.string(),
        documentUrl: z6.string(),
        documentKey: z6.string().optional(),
        signerEmail: z6.string().email(),
        signerName: z6.string()
      })
    ).mutation(async ({ ctx, input }) => {
      const { sendDocumentForSignature } = await Promise.resolve().then(() => (init_hellodoc(), hellodoc_exports));
      const documentKey = input.documentKey || storageKeyFromUrl(input.documentUrl);
      const documentUrl = await freshStorageUrl(documentKey, input.documentUrl);
      const result = await sendDocumentForSignature({
        documentUrl,
        documentName: input.documentName,
        signerEmail: input.signerEmail,
        signerName: input.signerName,
        workflowId: input.workflowId || "standalone"
      });
      const docId = await createSignedDocument({
        workflowId: input.workflowId || "standalone",
        documentName: input.documentName,
        s3Key: null,
        s3Url: null,
        uploadedS3Key: documentKey || "",
        uploadedS3Url: documentUrl,
        helloDocDocumentId: result.documentId,
        signerId: ctx.user.id,
        signerEmail: input.signerEmail,
        signerName: input.signerName
      });
      return {
        documentId: docId,
        signatureUrl: result.signatureUrl,
        helloDocDocumentId: result.documentId
      };
    }),
    checkStatus: protectedProcedure.input(z6.object({ helloDocDocumentId: z6.string() })).query(async ({ input }) => {
      const { checkSignatureStatus: checkSignatureStatus2 } = await Promise.resolve().then(() => (init_hellodoc(), hellodoc_exports));
      return await checkSignatureStatus2(input.helloDocDocumentId);
    }),
    getByWorkflow: protectedProcedure.input(z6.object({ workflowId: z6.string() })).query(async ({ input }) => {
      return await Promise.all((await getSignedDocumentsByWorkflow(input.workflowId)).map(withFreshS3Url));
    }),
    // Get all signed documents (for standalone e-signature page)
    getAll: protectedProcedure.input(
      z6.object({
        status: z6.enum(["all", "pending", "signed", "rejected", "expired"]).optional(),
        search: z6.string().optional()
      })
    ).query(async ({ ctx, input }) => {
      return await Promise.all((await getAllSignedDocuments(
        ctx.user.id,
        input.status,
        input.search
      )).map(withFreshS3Url));
    }),
    // Get documents sent by current user
    getBySender: protectedProcedure.query(async ({ ctx }) => {
      return await Promise.all((await getSignedDocumentsBySender(ctx.user.id)).map(withFreshS3Url));
    }),
    handleSignedDocument: protectedProcedure.input(z6.object({ helloDocDocumentId: z6.string() })).mutation(async ({ input }) => {
      const { checkSignatureStatus: checkSignatureStatus2, downloadSignedDocument: downloadSignedDocument2 } = await Promise.resolve().then(() => (init_hellodoc(), hellodoc_exports));
      const status = await checkSignatureStatus2(input.helloDocDocumentId);
      if (status.status !== "signed" || !status.signedDocumentUrl) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: `Document not signed yet. Status: ${status.status}`
        });
      }
      const signedPdfBuffer = await downloadSignedDocument2(
        status.signedDocumentUrl
      );
      const doc = await getSignedDocumentByHelloDocId(
        input.helloDocDocumentId
      );
      if (!doc) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Document not found"
        });
      }
      const signedStorageKey = `signed-docs/${doc.workflowId}/${Date.now()}-${doc.documentName}`;
      const { key: s3Key, url: s3Url } = await storagePut(
        signedStorageKey,
        signedPdfBuffer,
        "application/pdf"
      );
      await updateSignedDocumentStatus(
        doc.id,
        "signed",
        status.signedAt || void 0
      );
      await db.update(signedDocuments).set({ s3Key, s3Url }).where(eq4(signedDocuments.id, doc.id));
      const { sendSignedDocumentEmail: sendSignedDocumentEmail2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      await sendSignedDocumentEmail2(
        doc.signerEmail,
        doc.signerName,
        doc.documentName,
        s3Url,
        doc.workflowId
      );
      return {
        success: true,
        s3Url,
        signedAt: status.signedAt
      };
    })
  }),
  // ============================================
  // CFO Document Queue Router
  // ============================================
  cfoDocumentQueue: router({
    // Get all uploaded documents for CFO review
    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "cfo") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Only CFO can access document queue"
        });
      }
      return getAllSignedDocumentsForCFO();
    })
  }),
  // ============================================
  // Document Templates Router
  // ============================================
  documentTemplates: router({
    // Create new template
    create: protectedProcedure.input(
      z6.object({
        name: z6.string(),
        description: z6.string().optional(),
        category: z6.string().optional(),
        fileUrl: z6.string(),
        fileKey: z6.string().optional(),
        fileType: z6.string()
      })
    ).mutation(async ({ ctx, input }) => {
      const templateId = randomUUID3();
      const fileKey = input.fileKey || storageKeyFromUrl(input.fileUrl);
      if (!fileKey) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "The uploaded template is missing its Azure Blob storage key."
        });
      }
      await createDocumentTemplate({
        id: templateId,
        name: input.name,
        description: input.description,
        category: input.category,
        s3Key: fileKey,
        s3Url: input.fileUrl,
        fileType: input.fileType,
        createdBy: ctx.user.id
      });
      return { templateId };
    }),
    // Get all templates
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await Promise.all((await getAllDocumentTemplates()).map(withFreshS3Url));
    }),
    // Get template by ID
    getById: protectedProcedure.input(z6.object({ id: z6.string() })).query(async ({ input }) => {
      const template = await getDocumentTemplateById(input.id);
      return template ? await withFreshS3Url(template) : template;
    }),
    // Update template
    update: protectedProcedure.input(
      z6.object({
        id: z6.string(),
        name: z6.string().optional(),
        description: z6.string().optional(),
        category: z6.string().optional()
      })
    ).mutation(async ({ input }) => {
      await updateDocumentTemplate(input.id, {
        name: input.name,
        description: input.description,
        category: input.category
      });
      return { success: true };
    }),
    // Delete template (soft delete)
    delete: protectedProcedure.input(z6.object({ id: z6.string() })).mutation(async ({ input }) => {
      await deleteDocumentTemplate(input.id);
      return { success: true };
    })
  }),
  // ============================================
  // Document Sequence Generator
  // ============================================
  documentSequence: documentSequenceRouter,
  // ============================================
  // SKU Generator
  // ============================================
  skuGenerator: skuGeneratorRouter
});
async function createInitialStages(workflowId, workflowType, estimatedAmount) {
  if (workflowType === "MAF") {
    const stages = [
      { order: 1, name: "PPIC Review", type: "approval", role: "PPIC" },
      {
        order: 2,
        name: "Purchasing Review",
        type: "approval",
        role: "Purchasing"
      }
    ];
    if (estimatedAmount && estimatedAmount > 5e6) {
      stages.push({
        order: 3,
        name: "CFO Approval",
        type: "approval",
        role: "CFO"
      });
      stages.push({
        order: 4,
        name: "CEO/COO Approval",
        type: "approval",
        role: "CEO"
      });
    } else if (estimatedAmount && estimatedAmount > 1e6) {
      stages.push({
        order: 3,
        name: "CFO Approval",
        type: "approval",
        role: "CFO"
      });
    }
    for (const stage of stages) {
      await createWorkflowStage({
        workflowId,
        stageOrder: stage.order,
        stageName: stage.name,
        stageType: stage.type,
        requiredRole: stage.role
      });
    }
  } else if (workflowType === "PR") {
    const stages = [
      {
        order: 1,
        name: "Department Head Review",
        type: "approval",
        role: "admin"
      },
      { order: 2, name: "Finance Review", type: "approval", role: "Finance" },
      { order: 3, name: "CFO Approval", type: "approval", role: "CFO" }
    ];
    for (const stage of stages) {
      await createWorkflowStage({
        workflowId,
        stageOrder: stage.order,
        stageName: stage.name,
        stageType: stage.type,
        requiredRole: stage.role
      });
    }
  } else if (workflowType === "CATTO") {
    const stages = [
      { order: 1, name: "Finance Review", type: "approval", role: "Finance" },
      { order: 2, name: "CFO Approval", type: "approval", role: "CFO" },
      { order: 3, name: "CEO Approval", type: "approval", role: "CEO" }
    ];
    for (const stage of stages) {
      await createWorkflowStage({
        workflowId,
        stageOrder: stage.order,
        stageName: stage.name,
        stageType: stage.type,
        requiredRole: stage.role
      });
    }
  }
}

// server/entra-auth.ts
import { createRemoteJWKSet, jwtVerify } from "jose";

// shared/microsoft.ts
var MICROSOFT_ENTRA = {
  tenantId: "5de33f3d-7a65-45f5-980d-5ccea9e9f19e",
  clientId: "c55858ed-a55c-44f7-95c5-7c0e882c73df",
  allowedDomain: "compawnion.co"
};

// server/entra-auth.ts
var tenantId = process.env.ENTRA_TENANT_ID || process.env.VITE_ENTRA_TENANT_ID || MICROSOFT_ENTRA.tenantId;
var clientId = process.env.ENTRA_CLIENT_ID || process.env.VITE_ENTRA_CLIENT_ID || MICROSOFT_ENTRA.clientId;
var allowedEmailSuffix = `@${MICROSOFT_ENTRA.allowedDomain}`;
var jwks = null;
var entraServerConfiguration = {
  tenantId,
  clientId,
  configured: Boolean(tenantId && clientId)
};
async function verifyEntraToken(token) {
  if (!tenantId || !clientId) {
    console.error("[Auth] Microsoft Entra server configuration is missing");
    return null;
  }
  try {
    jwks ||= createRemoteJWKSet(
      new URL(
        `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
      )
    );
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ["RS256"],
      audience: [clientId, `api://${clientId}`],
      issuer: [
        `https://login.microsoftonline.com/${tenantId}/v2.0`,
        `https://sts.windows.net/${tenantId}/`
      ]
    });
    if (payload.tid !== tenantId) {
      throw new Error("Token was issued by a different Microsoft tenant");
    }
    const scopes = typeof payload.scp === "string" ? payload.scp.split(" ") : [];
    if (!scopes.includes("access_as_user")) {
      throw new Error("Token is missing the access_as_user API scope");
    }
    const email = String(
      payload.email || payload.preferred_username || payload.upn || ""
    ).toLowerCase();
    if (!email.endsWith(allowedEmailSuffix)) {
      throw new Error("Only @compawnion.co Microsoft accounts are allowed");
    }
    return {
      sub: String(payload.sub),
      oid: String(payload.oid || payload.sub),
      tenantId: String(payload.tid),
      email,
      name: String(payload.name || email)
    };
  } catch (error) {
    console.error(
      "[Auth] Microsoft Entra token verification failed",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

// server/_core/context.ts
init_db();
async function authenticateEntraRequest(req) {
  const authHeader = req.headers.authorization;
  console.log(
    "\u{1F510} Auth header:",
    authHeader ? "Bearer token present" : "No auth header"
  );
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    console.log("\u{1F50D} Verifying Microsoft Entra token...");
    const payload = await verifyEntraToken(token);
    if (!payload) {
      console.log("\u274C Token verification failed");
      return null;
    }
    console.log("\u2705 Token verified for user:", payload.email);
    console.log("\u{1F50E} Looking up user by Microsoft object ID:", payload.oid);
    const existingUser = await getUserByOpenId(payload.oid);
    if (existingUser) {
      await upsertUser({
        cognitoSub: payload.oid,
        openId: existingUser.openId,
        email: payload.email,
        fullName: existingUser.fullName || payload.name,
        department: existingUser.department || void 0,
        role: existingUser.role,
        cognitoGroups: void 0
      });
      return existingUser;
    }
    await upsertUser({
      cognitoSub: payload.oid,
      openId: payload.oid,
      email: payload.email,
      fullName: payload.name,
      department: void 0,
      role: "PPIC",
      // Default role
      cognitoGroups: void 0
    });
    const newUser = await getUserByOpenId(payload.oid);
    console.log("\u2705 New user created:", newUser?.email);
    return newUser || null;
  } catch (error) {
    console.error("\u274C Error authenticating Microsoft request:", error);
    return null;
  }
}
async function createContext(opts) {
  let user = null;
  try {
    user = await authenticateEntraRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/app.ts
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }
});
function createApiApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "4mb" }));
  app.use(express.urlencoded({ limit: "4mb", extended: true }));
  app.get("/api/health", (_req, res) => {
    const requiredConfiguration = {
      database: Boolean(process.env.DATABASE_URL),
      microsoftEntra: Boolean(
        (process.env.ENTRA_TENANT_ID || process.env.VITE_ENTRA_TENANT_ID) && (process.env.ENTRA_CLIENT_ID || process.env.VITE_ENTRA_CLIENT_ID)
      ),
      azureBlobStorage: Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING),
      microsoftGraphEmail: Boolean(
        process.env.GRAPH_TENANT_ID && process.env.GRAPH_CLIENT_ID && process.env.GRAPH_CLIENT_SECRET && process.env.GRAPH_SENDER_MAILBOX
      )
    };
    res.json({
      status: "ok",
      platform: "microsoft-365",
      configured: requiredConfiguration
    });
  });
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
      const fileKey = `esignature-uploads/${Date.now()}-${safeName}`;
      const { key, url } = await storagePut(
        fileKey,
        req.file.buffer,
        req.file.mimetype
      );
      return res.json({ key, url });
    } catch (error) {
      console.error("File upload error:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to upload file"
      });
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app;
}

// server/_core/vercel.ts
var vercel_default = createApiApp();
export {
  vercel_default as default
};
