---
title: Developer Prompts
tags: [prompts, ai, developer, handoff]
---

# Developer Prompts for Next AI Agent

> [!info] How to Use
> These prompts are ready-to-use instructions for a developer AI (Claude, GPT-4, etc.) to implement specific features. Copy the prompt and paste it directly into the AI agent's context along with the project context from this vault.

---

## Prompt: Implement E-Materai Integration

```
You are implementing E-Materai (Indonesian electronic stamp) integration for the WFMT system (Compawnion Jadi Berkat Workflow Hub).

CONTEXT:
- Stack: React + TypeScript + Vite, tRPC, Drizzle ORM (PostgreSQL), AWS S3
- The E-Materai tab already exists in client/src/pages/ESignature.tsx as a placeholder
- OnlinePajak API key is stored in environment variable (check server/_core/env.ts)
- White-labeling rule: Do NOT mention "OnlinePajak" in the UI — use "Compawnion's E-Stamp Service"

TASKS:
1. Create a new database table `ematerai_documents` in drizzle/schema.ts with fields: id, documentName, recipientEmail, recipientName, senderEmail, workflowId (nullable), status (enum: pending|stamped|failed), uploadedS3Key, uploadedS3Url, stampedS3Key (nullable), stampedS3Url (nullable), onlinePajakId (nullable), createdAt
2. Generate and apply the migration
3. Create tRPC procedures in server/routers/emateraiDocuments.ts: createStampRequest, checkStatus, getAll, getBySender
4. Implement the E-Materai tab UI in client/src/pages/ESignature.tsx replacing the placeholder
5. Add webhook endpoint POST /api/ematerai/webhook in server/_core/index.ts
6. Add translations to client/src/locales/en.json and id.json

IMPORTANT: Follow the same pattern as the existing e-signature hybrid workflow in server/routers/signedDocuments.ts
```

---

## Prompt: Add Workflow Visualization

```
You are adding workflow visualization to the WFMT system (Compawnion Jadi Berkat Workflow Hub).

CONTEXT:
- Stack: React + TypeScript + Vite, tRPC, Drizzle ORM (PostgreSQL)
- Design system: Flat Design, Primary color #0D9488 (Teal), no shadows/gradients
- Existing tables: workflows, workflow_stages, workflow_approvals

TASKS:
1. Create a WorkflowTimeline component in client/src/components/WorkflowTimeline.tsx
   - Horizontal step indicator showing all stages
   - Current stage highlighted with teal (#0D9488)
   - Completed stages: green checkmark
   - Rejected stages: red X
   - Pending stages: gray circle
2. Add approval history section below the timeline
   - Show approver name, role, decision, timestamp, and comment for each stage
3. Integrate into the workflow detail page/modal
4. Use Chart.js or D3.js if any data visualization is needed
5. Ensure bilingual support (add keys to en.json and id.json)

IMPORTANT: Follow the flat design system — no card shadows, no gradients, use the teal color palette from client/src/index.css
```

---

## Prompt: Add Dashboard Analytics Charts

```
You are upgrading the Analytics page of the WFMT system (Compawnion Jadi Berkat Workflow Hub).

CONTEXT:
- Stack: React + TypeScript + Vite, tRPC, Drizzle ORM (PostgreSQL), Chart.js already available
- Design system: Flat Design, Primary #0D9488 (Teal), Accent #F97316 (Orange)
- Analytics page: client/src/pages/Analytics.tsx
- Access: Admin, CEO, CFO, COO, Exec Asst only

TASKS:
1. Add tRPC procedures in server/routers.ts for analytics data:
   - workflowsByStatus (count per status)
   - workflowsByDepartment (count per department)
   - workflowsOverTime (count per week for last 12 weeks)
   - avgApprovalTime (average days from creation to completion)
2. Implement Chart.js charts in Analytics.tsx:
   - Donut chart: workflow status distribution
   - Bar chart: workflows by department
   - Line chart: workflows created over time
   - KPI cards: total, in-progress, completed this month, avg approval time
3. Use the teal color palette for charts: #0D9488, #14B8A6, #F97316, #134E4A
4. Ensure bilingual support

IMPORTANT: Only use real data from the database. Never fabricate or hardcode numbers.
```

---

## Prompt: Fix or Extend Role-Based Access

```
You are modifying role-based access control in the WFMT system (Compawnion Jadi Berkat Workflow Hub).

CONTEXT:
- Roles are stored in the `users` table (role column), NOT in Cognito groups
- Current roles: admin, CFO, CEO, COO, Exec Asst, Manager, PPIC, Purchasing, Finance, Sales, Brand Manager, PR Manager, GA, R&D, Marketing, Operations, Staff, Vendor
- Role context: client/src/contexts/UserRoleContext.tsx
- Nav visibility: client/src/components/DashboardLayout.tsx
- Backend enforcement: use ctx.user in tRPC procedures

TO ADD A NEW ROLE:
1. Add to the role validation array in server/routers.ts
2. Update nav visibility rules in DashboardLayout.tsx
3. Update access control in relevant page components
4. Update the role list in client/src/pages/Users.tsx (user management dropdown)
5. Add to this documentation

TO RESTRICT A FEATURE TO SPECIFIC ROLES:
- Frontend: check userWithRole.role in the component
- Backend: add role check in the tRPC procedure using ctx.user
```

---

## Prompt: General Feature Addition

```
You are adding a new feature to the WFMT system (Compawnion Jadi Berkat Workflow Hub).

CONTEXT:
- GitHub: https://github.com/eddiamintohir1/approval-workflow-system
- Stack: React 19 + TypeScript, Vite, tRPC 11, Drizzle ORM, PostgreSQL (Supabase), AWS S3, Tailwind CSS 4, shadcn/ui
- Design: Flat Design, Primary #0D9488 Teal, no shadows/gradients, Lexend + Source Sans 3 fonts
- Auth: AWS Cognito, @compawnion.co emails only
- Bilingual: en.json + id.json in client/src/locales/
- White-labeling: Never mention AWS/S3/Dropbox Sign/OnlinePajak in UI

STANDARD WORKFLOW FOR NEW FEATURES:
1. Update drizzle/schema.ts if new tables needed
2. Run pnpm drizzle-kit generate, apply migration via webdev_execute_sql
3. Add query helpers to server/db.ts
4. Add tRPC procedures to server/routers/ (new file if large feature)
5. Import new router in server/routers.ts
6. Build UI in client/src/pages/FeatureName.tsx
7. Add route in client/src/App.tsx
8. Add nav item in client/src/components/DashboardLayout.tsx (with section property)
9. Add translations to en.json and id.json
10. Write vitest tests in server/*.test.ts
```
