---
title: Changelog
tags: [progress, changelog, history]
---

# Changelog

## v1.07 — Navigation & Design System (2026-03-02)

**Checkpoint**: `282a2428`

- Applied Flat Design + Teal color palette design system
- Reorganized sidebar navigation with section headers (Overview / Workflows / Documents / Analytics / Administration)
- Fixed Tailwind CSS `font-body` utility error
- Added bilingual section header translations (EN/ID)
- Section headers hide when sidebar is collapsed
- Pushed to GitHub: `eddiamintohir1/approval-workflow-system`

## v1.06 — Hybrid E-Signature Workflow (2026-02-03)

**Checkpoint**: `76a5bfc4`

- Redesigned e-signature to hybrid approach (upload to S3, manual send via Dropbox Sign, API tracking)
- Added `awaiting_hellodoc_id` status to `signed_documents` table
- Added `uploaded_s3_key` and `uploaded_s3_url` fields
- Made `s3_key`, `s3_url`, `sentAt` nullable
- New `createDocument` procedure (upload-only)
- New `updateHelloDocId` procedure (manual ID entry)
- 3-step UI workflow with clear instructions

## v1.05 — HelloDoc E-Signature Standalone (2026-02-03)

**Checkpoint**: `6ae47424`

- Created standalone e-signature feature (not tied to workflows)
- `/api/upload` endpoint with multer (50MB limit)
- E-Signature page with send/track UI
- Status badges: Pending/Signed/Rejected/Expired
- Added to sidebar navigation
- Bilingual translations

## v1.04 — Document Queue & E-Materai Tab (2026-02-03)

**Checkpoint**: `c5ed5af6`

- CFO Document Queue page (`/cfo-document-queue`)
- Role-restricted to Admin + CFO
- E-Materai tab placeholder in E-Signature page
- Home buttons added to E-Signature and Document Queue pages
- White-labeling: "Compawnion's AWS Cloud" in UI text

## v1.03 — Dropbox Sign API + Document Templates (2026-02-03)

**Checkpoint**: `d439031b`

- Integrated Dropbox Sign API (key: `3b1bada3...`)
- Account verified: eddie.amintohir@compawnion.co
- Document template library (CRUD, categories)
- Template selection in e-signature workflow
- OnlinePajak API key stored (E-Materai — paused)

## v1.02 — Form Templates & Workflow Examples (2026-02-03)

**Checkpoint**: `e191fe5c`

- 5 operational form templates: Purchase Request, MAF, Budget Request, Leave Request, Expense Reimbursement
- 3 example workflows for reference
- Approval stages per template

## v1.01 — Role Fixes & Branding (2026-02-03)

**Checkpoints**: `84938c7c`, `3268fe3a`, `e74fafe7`

- Fixed tRPC validation for new roles (R&D, Sales, Marketing, Operations)
- Fixed footer logo (Compawnion branding)
- Fixed React imports in Capacity component

## v1.00 — Initial Build

**Checkpoint**: `ebedf080`

- Project scaffolded (React + TypeScript + Vite + tRPC + Drizzle + Supabase)
- Multi-layer approval workflow engine
- Role-based access control (18 roles)
- AWS S3 file storage
- Email notifications via Resend
- Sequence number generator
- Bilingual support (EN/ID)
- Recurring workflows
- Audit logs
