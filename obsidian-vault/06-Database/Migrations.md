---
title: Migrations
tags: [database, migrations, sql, critical]
---

# SQL Migration History

## ⚠️ CRITICAL: Correct Migration Workflow

**NEVER use `pnpm drizzle-kit generate` or `pnpm drizzle-kit push` interactively.**
The existing schema has many tables and running drizzle-kit interactively causes conflicts that require manually confirming hundreds of prompts.

### This project has TWO separate databases:

| Database | Env Var | Purpose | Access Method |
|----------|---------|---------|---------------|
| MySQL/TiDB | `DATABASE_URL` | Main tables (users, workflows, approvals) | Drizzle ORM via `server/db.ts` |
| PostgreSQL / AWS RDS | `CUSTOM_DATABASE_URL` | Document sequences | Raw `pg` Pool queries |

The PostgreSQL database is in a **private VPC** — only accessible from the deployed server, not from the sandbox shell. `pg` queries from the terminal will time out. Use `webdev_execute_sql` instead.

### How to Apply ANY Database Change:

```
1. Write the raw SQL (CREATE TABLE IF NOT EXISTS / ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
2. Apply it using the webdev_execute_sql tool in Manus
3. For MySQL tables: also update drizzle/schema.ts with the TypeScript definition
4. For PostgreSQL tables: write a raw pg Pool router in server/routers/
5. Document the migration below
```

---

## Migration History

### v1.00 — Initial Schema (MySQL/TiDB)
Tables: `users`, `workflows`, `workflow_stages`, `workflow_approvals`, `workflow_files`, `workflow_comments`, `audit_logs`, `email_recipients`.

### v1.01 — Workflow Templates
```sql
CREATE TABLE IF NOT EXISTS workflow_templates (...);
CREATE TABLE IF NOT EXISTS workflow_template_stages (...);
```

### v1.02 — Recurring Workflows
```sql
CREATE TABLE IF NOT EXISTS recurring_workflows (...);
CREATE TABLE IF NOT EXISTS recurring_workflow_history (...);
```

### v1.03 — Document Templates (MySQL)
```sql
CREATE TABLE IF NOT EXISTS document_templates (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  s3_key VARCHAR(500),
  s3_url TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

### v1.04 — Signed Documents (MySQL)
```sql
CREATE TABLE IF NOT EXISTS signed_documents (
  id VARCHAR(36) PRIMARY KEY,
  workflow_id VARCHAR(36),
  document_name VARCHAR(500) NOT NULL,
  ...
);
-- Nullable columns added:
ALTER TABLE signed_documents ADD COLUMN IF NOT EXISTS uploaded_s3_key VARCHAR(500);
ALTER TABLE signed_documents ADD COLUMN IF NOT EXISTS uploaded_s3_url TEXT;
ALTER TABLE signed_documents ALTER COLUMN s3_key DROP NOT NULL;
ALTER TABLE signed_documents ALTER COLUMN s3_url DROP NOT NULL;
ALTER TABLE signed_documents ALTER COLUMN sent_at DROP NOT NULL;
ALTER TABLE signed_documents ALTER COLUMN status TYPE VARCHAR(50);
ALTER TABLE signed_documents DROP CONSTRAINT IF EXISTS signed_documents_workflow_id_fkey;
ALTER TABLE signed_documents ALTER COLUMN workflow_id DROP NOT NULL;
```

### v1.05 — Sequence Counters (MySQL, for MAF/PR/CATTO workflow numbering)
```sql
CREATE TABLE IF NOT EXISTS sequence_counters (...);
```

### v1.06 — Performance Metrics & Salary Cache (MySQL)
```sql
CREATE TABLE IF NOT EXISTS user_performance_metrics (...);
CREATE TABLE IF NOT EXISTS salary_cache (...);
CREATE TABLE IF NOT EXISTS task_assignments (...);
```

### v1.07 — Document Sequence Generator (PostgreSQL / AWS RDS) — 2026-03-02
Applied via `webdev_execute_sql`.

```sql
CREATE TABLE IF NOT EXISTS document_sequences (
  id VARCHAR(36) PRIMARY KEY,
  document_number VARCHAR(100) NOT NULL UNIQUE,
  sequence_counter INT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  company VARCHAR(10) NOT NULL,
  division VARCHAR(10) NOT NULL,
  month_roman VARCHAR(4) NOT NULL,
  month_numeric INT NOT NULL,
  year INT NOT NULL,
  revision_number INT DEFAULT 0,
  revision_suffix VARCHAR(20),
  document_title VARCHAR(255) NOT NULL,
  document_description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_by VARCHAR(36),
  approved_at TIMESTAMP,
  updated_by VARCHAR(36),
  updated_at TIMESTAMP,
  change_history JSONB,
  CONSTRAINT valid_document_type CHECK (document_type IN ('SOP', 'IK', 'FORM', 'SC', 'SPK', 'NDA', 'JPB', 'BA', 'SK', 'RET', 'SPG')),
  CONSTRAINT valid_company CHECK (company IN ('CJB', 'CBB', 'PJB')),
  CONSTRAINT valid_division CHECK (division IN ('MKT', 'SAL', 'OPS', 'PRO', 'RND', 'HRD', 'COR', 'LOG', 'PUR', 'FIN', 'ACC', 'ITS', 'PRC')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'review', 'approved', 'effective', 'superseded', 'obsolete'))
);

CREATE TABLE IF NOT EXISTS sequence_counters (
  id VARCHAR(255) PRIMARY KEY,
  prefix VARCHAR(50) NOT NULL,
  department VARCHAR(100),
  document_type VARCHAR(100) NOT NULL,
  current_value INT NOT NULL DEFAULT 0,
  format_pattern VARCHAR(200),
  reset_period VARCHAR(50),
  last_reset_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_sequences_company_division ON document_sequences(company, division);
CREATE INDEX IF NOT EXISTS idx_document_sequences_document_type ON document_sequences(document_type);
CREATE INDEX IF NOT EXISTS idx_document_sequences_created_at ON document_sequences(created_at);
CREATE INDEX IF NOT EXISTS idx_sequence_counters_document_type ON sequence_counters(document_type);
```

**Router:** `server/routers/documentSequence.ts` — uses raw `pg` Pool (NOT Drizzle ORM)
**UI:** `client/src/pages/DocumentSequenceGenerator.tsx`
**Route:** `/document-sequence`
**Nav:** Documents section → "Doc Sequence Generator"

---

## Current Schema File

All MySQL/TiDB table definitions: `drizzle/schema.ts`
PostgreSQL tables: documented above (no Drizzle schema file for these)

See [[../01-Architecture/Database Schema]] for the full table overview.
