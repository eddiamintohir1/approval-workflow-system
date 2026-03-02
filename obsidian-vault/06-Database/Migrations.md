---
title: Migrations
tags: [database, migrations, sql]
---

# SQL Migration History

This file documents all manual SQL migrations applied to the database. These were applied via `webdev_execute_sql` and correspond to changes in `drizzle/schema.ts`.

## Migration: signed_documents table updates

Applied during v1.06 (Hybrid E-Signature Workflow):

```sql
-- Add uploaded document fields
ALTER TABLE signed_documents 
ADD COLUMN IF NOT EXISTS uploaded_s3_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS uploaded_s3_url TEXT;

-- Make s3_key and s3_url nullable (signed doc fields, set after signing)
ALTER TABLE signed_documents 
ALTER COLUMN s3_key DROP NOT NULL,
ALTER COLUMN s3_url DROP NOT NULL;

-- Make sent_at nullable (set when HelloDoc ID is entered)
ALTER TABLE signed_documents 
ALTER COLUMN sent_at DROP NOT NULL;

-- Update status enum to include awaiting_hellodoc_id
ALTER TABLE signed_documents 
ALTER COLUMN status TYPE VARCHAR(50);
```

## Migration: Remove workflow_id foreign key constraint

Applied during v1.06 (to support standalone documents):

```sql
-- Remove foreign key constraint to allow standalone documents (workflow_id = null)
ALTER TABLE signed_documents 
DROP CONSTRAINT IF EXISTS signed_documents_workflow_id_fkey;

-- Make workflow_id nullable
ALTER TABLE signed_documents 
ALTER COLUMN workflow_id DROP NOT NULL;
```

## Migration: document_templates table

Applied during v1.03:

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

## How to Apply Future Migrations

1. Edit `drizzle/schema.ts` with the new table/column definitions
2. Run: `pnpm drizzle-kit generate`
3. Read the generated SQL file in `drizzle/migrations/`
4. Apply via `webdev_execute_sql` tool in Manus
5. Document the migration here

## Current Schema File

All current table definitions are in: `drizzle/schema.ts`

See [[../01-Architecture/Database Schema]] for the full table overview.
