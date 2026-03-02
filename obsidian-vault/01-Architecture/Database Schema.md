---
title: Database Schema
tags: [database, schema, drizzle]
---

# Database Schema

All tables are defined in `drizzle/schema.ts`. The database is PostgreSQL via Supabase.

> [!warning] Schema Update Process
> 1. Edit `drizzle/schema.ts`
> 2. Run `pnpm drizzle-kit generate` to produce migration SQL
> 3. Read the generated `.sql` file
> 4. Apply via `webdev_execute_sql`
> 5. Never edit the database directly without updating the schema file first

## Tables Overview

| Table | Purpose |
|-------|---------|
| `users` | All system users with roles |
| `workflows` | Approval workflow instances |
| `workflow_stages` | Individual stages within a workflow |
| `workflow_approvals` | Approval decisions per stage |
| `workflow_files` | Files attached to workflows |
| `workflow_comments` | Comments on workflows |
| `audit_logs` | Full audit trail of all actions |
| `email_recipients` | Email notification recipients |
| `sequence_counters` | Auto-increment sequence generators |
| `form_templates` | Reusable form templates |
| `form_submissions` | Submitted form data |
| `workflow_templates` | Reusable workflow templates |
| `template_stages` | Stages within workflow templates |
| `department_budgets` | Department budget tracking |
| `excel_templates` | Excel template files |
| `task_assignments` | Task assignments to users |
| `user_performance_metrics` | Performance tracking |
| `salary_cache` | Cached salary data |
| `email_logs` | Email send history |
| `recurring_workflows` | Scheduled/recurring workflows |
| `recurring_workflow_history` | History of recurring workflow runs |
| `signed_documents` | E-signature document tracking |
| `document_templates` | Document template library |

## Key Table: `users`

```typescript
users = {
  id: varchar(255) PRIMARY KEY,
  email: varchar(255) UNIQUE NOT NULL,
  name: varchar(255),
  role: varchar(50),  // 'admin' | 'CFO' | 'CEO' | 'COO' | 'Exec Asst' | 
                      // 'Manager' | 'PPIC' | 'Purchasing' | 'Finance' | 
                      // 'Sales' | 'Brand Manager' | 'PR Manager' | 'GA' | 
                      // 'R&D' | 'Marketing' | 'Operations' | 'Staff' | 'Vendor'
  department: varchar(100),
  isActive: boolean DEFAULT true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Key Table: `signed_documents`

```typescript
signedDocuments = {
  id: varchar(255) PRIMARY KEY,
  documentName: varchar(500) NOT NULL,
  signerEmail: varchar(255) NOT NULL,
  signerName: varchar(255),
  senderEmail: varchar(255) NOT NULL,
  workflowId: varchar(255) NULLABLE,        // null = standalone document
  helloDocId: varchar(255) NULLABLE,        // Dropbox Sign document ID
  status: enum('awaiting_hellodoc_id' | 'pending' | 'signed' | 'rejected' | 'expired'),
  uploadedS3Key: varchar(500),              // Original uploaded file
  uploadedS3Url: text,                      // Public URL of uploaded file
  s3Key: varchar(500) NULLABLE,             // Signed document (after signing)
  s3Url: text NULLABLE,                     // Public URL of signed document
  sentAt: timestamp NULLABLE,
  signedAt: timestamp NULLABLE,
  createdAt: timestamp DEFAULT now()
}
```

## Key Table: `document_templates`

```typescript
documentTemplates = {
  id: varchar(255) PRIMARY KEY,
  name: varchar(500) NOT NULL,
  description: text,
  category: varchar(100),  // 'contract' | 'nda' | 'invoice' | 'purchase_order' | 'other'
  s3Key: varchar(500),
  s3Url: text,
  createdBy: varchar(255),
  createdAt: timestamp DEFAULT now(),
  updatedAt: timestamp
}
```

## Key Table: `workflows`

```typescript
workflows = {
  id: varchar(255) PRIMARY KEY,
  title: varchar(500) NOT NULL,
  type: varchar(100),           // 'PR' | 'MAF' | 'reimbursement' | 'budget' | etc.
  department: varchar(100),
  status: enum('draft' | 'in_progress' | 'completed' | 'rejected'),
  createdBy: varchar(255),
  assignedTo: varchar(255),
  currentStage: int,
  totalStages: int,
  isPinned: boolean DEFAULT false,
  sequenceNumber: varchar(100),
  templateId: varchar(255) NULLABLE,
  formData: json NULLABLE,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Roles Enum (in code, not DB enum)

```
admin, CFO, CEO, COO, Exec Asst, Manager, PPIC, Purchasing, 
Finance, Sales, Brand Manager, PR Manager, GA, R&D, Marketing, 
Operations, Staff, Vendor
```

## File: `drizzle/schema.ts`

This is the **single source of truth** for all database structure. Always edit this file before making any database changes.
