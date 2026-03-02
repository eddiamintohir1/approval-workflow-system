---
title: Developer Prompts
tags: [prompts, ai, developer, handoff]
---

# Developer Prompts for Next AI Agent

> [!danger] CRITICAL — Read Before Anything Else
> **NEVER use `pnpm drizzle-kit generate` or `pnpm drizzle-kit push` interactively.**
> The existing schema has many tables. Running drizzle-kit interactively causes conflicts requiring hundreds of manual confirmations.
> **For ALL database changes: write raw SQL → apply via `webdev_execute_sql` tool in Manus.**
> See [[../06-Database/Migrations]] for the full guide.

---

## 🔴 Critical Rules Block (paste this at the start of every new chat)

```
CRITICAL DATABASE RULES FOR THIS PROJECT:

1. NEVER run `pnpm drizzle-kit generate` or `pnpm drizzle-kit push` interactively.
   The existing schema has conflicts that require hundreds of manual confirmations.

2. This project has TWO databases:
   - MySQL/TiDB (DATABASE_URL): Main Drizzle ORM tables → use server/db.ts
   - PostgreSQL/AWS RDS (CUSTOM_DATABASE_URL): Document sequences → raw pg Pool

3. For ALL database changes (both MySQL and PostgreSQL):
   a. Write the raw SQL manually (CREATE TABLE IF NOT EXISTS / ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
   b. Apply it using the webdev_execute_sql tool in Manus
   c. For MySQL: also update drizzle/schema.ts with the TypeScript definition
   d. For PostgreSQL: write a raw pg Pool router in server/routers/ (see documentSequence.ts)

4. The PostgreSQL database is in a private VPC. pg queries from the sandbox terminal
   will time out. Only webdev_execute_sql can reach it.

5. The project uses tRPC. All backend procedures are in server/routers.ts
   (or sub-routers in server/routers/*.ts). Never use REST endpoints.
```

---

## Prompt: General Context Handoff

```
You are continuing development of the WFMT (Workflow Management Tool) for Compawnion.

PROJECT: Multi-Layer Approval Workflow System
GITHUB: https://github.com/eddiamintohir1/approval-workflow-system
LIVE URL: https://wfmt.compawnion.id
MANUS PROJECT PATH: /home/ubuntu/approval_workflow_system

TECH STACK:
- Frontend: React 19 + Tailwind 4 + shadcn/ui + wouter routing
- Backend: Express 4 + tRPC 11 (procedures in server/routers.ts or server/routers/*.ts)
- Primary DB: MySQL/TiDB via Drizzle ORM (DATABASE_URL)
- Secondary DB: PostgreSQL/AWS RDS via raw pg Pool (CUSTOM_DATABASE_URL)
- Auth: AWS Cognito (@compawnion.co emails only)
- File Storage: AWS S3 (bucket: compawnion-approval-forms)
- E-Signature: Dropbox Sign / HelloDoc API

CRITICAL: Never use `pnpm drizzle-kit generate` interactively.
For ALL DB changes: write raw SQL → apply via webdev_execute_sql tool.
See obsidian-vault/06-Database/Migrations.md for the full migration guide.

Current version: v1.07
Last checkpoint: 282a2428

Please read obsidian-vault/HOME.md for full context before starting.
```

---

## Prompt: Add a New Feature

```
I need to add [FEATURE NAME] to the WFMT approval workflow system.

Context:
- tRPC + React + MySQL/TiDB project
- Backend procedures go in server/routers.ts (or server/routers/featureName.ts)
- Frontend pages go in client/src/pages/
- Navigation is in client/src/components/DashboardLayout.tsx

DATABASE RULE: NEVER use drizzle-kit interactively.
Write raw SQL → apply via webdev_execute_sql → update drizzle/schema.ts manually.

Standard workflow:
1. Write raw SQL for new tables/columns
2. Apply via webdev_execute_sql
3. Update drizzle/schema.ts with TypeScript definition (for MySQL tables)
4. Add tRPC procedures in server/routers/featureName.ts
5. Import and wire into server/routers.ts appRouter
6. Build UI in client/src/pages/FeatureName.tsx
7. Add route in client/src/App.tsx
8. Add nav item in DashboardLayout.tsx (with section property)
9. Add translations to en.json and id.json

Feature requirements:
[DESCRIBE YOUR FEATURE HERE]
```

---

## Prompt: Document Sequence Generator (v1.07)

```
The Document Sequence Generator feature was implemented in v1.07.

Files:
- server/routers/documentSequence.ts — tRPC router using raw pg Pool (PostgreSQL)
- client/src/pages/DocumentSequenceGenerator.tsx — React UI
- Route: /document-sequence
- Nav: Documents section → "Doc Sequence Generator" (Hash icon)

Database: PostgreSQL (CUSTOM_DATABASE_URL = AWS RDS)
Tables: document_sequences, sequence_counters
These tables are in PostgreSQL, NOT in the MySQL/TiDB Drizzle schema.

Format: XXXX.TYPE/COMPANY/DIVISION/MONTH_ROMAN/YEAR
Example: 0001.SOP/CJB/MKT/III/2026

Document types: SOP, IK, FORM, SC, SPK, NDA, JPB, BA, SK, RET, SPG
Companies: CJB (Compawnion Jadi Berkat), CBB (Compawnion Bersama Berkembang), PJB (PT Jadi Berkat)
Divisions: MKT, SAL, OPS, PRO, RND, HRD, COR, LOG, PUR, FIN, ACC, ITS, PRC
```

---

## Prompt: Implement E-Materai Integration

```
You are implementing E-Materai (Indonesian electronic stamp) integration for the WFMT system.

CONTEXT:
- Stack: React + TypeScript + Vite, tRPC, Drizzle ORM (MySQL), AWS S3
- The E-Materai tab already exists in client/src/pages/ESignature.tsx as a placeholder
- OnlinePajak API key: stored as ONLINEPAJAK_API_KEY env variable
- White-labeling rule: Do NOT mention "OnlinePajak" in the UI — use "Compawnion's E-Stamp Service"
- STATUS: Account not yet activated — implement only when account is confirmed active

DATABASE RULE: Write raw SQL → apply via webdev_execute_sql (NEVER drizzle-kit interactively)

TASKS:
1. Write SQL for new table `ematerai_documents`, apply via webdev_execute_sql
2. Update drizzle/schema.ts with the TypeScript definition
3. Create tRPC procedures in server/routers/emateraiDocuments.ts
4. Implement the E-Materai tab UI in client/src/pages/ESignature.tsx
5. Add webhook endpoint in server/_core/index.ts
6. Add translations to en.json and id.json
```

---

## Prompt: Fix a Bug

```
There is a bug in the WFMT system:

[DESCRIBE THE BUG]

Steps to reproduce:
1. [STEP 1]
2. [STEP 2]

Expected: [WHAT SHOULD HAPPEN]
Actual: [WHAT IS HAPPENING]

Project path: /home/ubuntu/approval_workflow_system
GitHub: https://github.com/eddiamintohir1/approval-workflow-system

DATABASE RULE: Do NOT use drizzle-kit interactively for any DB changes.
Use webdev_execute_sql for all SQL operations.
```

---

## Environment Variables Reference

```
# Auth (AWS Cognito)
VITE_COGNITO_REGION=ap-southeast-1
JWT_SECRET=6LYNmAg7rVQSkvsWGZUt3e

# Primary DB (MySQL/TiDB — Drizzle ORM)
DATABASE_URL=mysql://...

# Secondary DB (PostgreSQL — raw pg Pool only)
CUSTOM_DATABASE_URL=postgresql://cattodomain:...@corporate-database-1.cluster-...rds.amazonaws.com:5432/workflow_db

# AWS S3
AWS_REGION=us-west-2
AWS_S3_BUCKET=compawnion-approval-forms
AWS_ACCESS_KEY_ID=AKIAWLMXL64ZV5Q4XNLQ
AWS_SECRET_ACCESS_KEY=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

# E-Signature (Dropbox Sign / HelloDoc)
HELLODOC_API_KEY=3b1bada35cbb5e8d505571e191fc70ccd011a35d5dc8e9d94c257a6870732449

# E-Materai (OnlinePajak — NOT YET ACTIVE)
ONLINEPAJAK_API_KEY=AYYYZh6Q4nJU3sRPqeAGGVLDA8KzNrRw
```
