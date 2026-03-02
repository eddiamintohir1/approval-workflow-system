---
title: Feature Map
tags: [features, status, overview]
---

# Feature Map

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented and working |
| 🔄 | In progress |
| ⏸️ | Paused / awaiting dependency |
| 📋 | Planned / backlog |

## Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| Supabase OAuth Login | ✅ | Restricted to @compawnion.co emails |
| Role-based access control | ✅ | 18 roles, see [[Authentication & Roles]] |
| Multi-layer approval workflows | ✅ | With stages, approvals, comments |
| Workflow templates | ✅ | 5 operational templates pre-loaded |
| Form templates | ✅ | PR, MAF, Budget, Leave, Expense |
| Sequence number generator | ✅ | Auto-increment per workflow type |
| Bilingual UI (EN/ID) | ✅ | Full translation in en.json / id.json |
| Flat Design + Teal palette | ✅ | v1.07 — Lexend + Source Sans 3 |
| Navigation section headers | ✅ | Overview / Workflows / Documents / Analytics |

## Document Management

| Feature | Status | Notes |
|---------|--------|-------|
| File upload to AWS S3 | ✅ | 50MB limit, PDF/Word/Excel |
| Document queue (CFO/Admin) | ✅ | All uploaded docs with download links |
| Document template library | ✅ | CRUD, categories, reusable templates |
| E-Signature (hybrid workflow) | ✅ | See [[E-Signature Workflow]] |
| E-Materai integration | ⏸️ | OnlinePajak account not yet activated |

## Administration

| Feature | Status | Notes |
|---------|--------|-------|
| User management | ✅ | Admin + CFO can manage users |
| Excel templates | ✅ | Upload/download Excel templates |
| Workflow templates | ✅ | Create/edit/enable workflow templates |
| Capacity view | ✅ | Team workload overview |
| Analytics dashboard | ✅ | Basic metrics |
| Recurring workflows | ✅ | Scheduled workflow automation |
| Email notifications | ✅ | Via Resend, on stage transitions |
| Audit logs | ✅ | Full action history |

## Pending / Backlog

| Feature | Priority | Notes |
|---------|----------|-------|
| E-Materai (OnlinePajak) | High | Waiting for account activation |
| Workflow visualization | Medium | Timeline, progress indicators |
| Dashboard analytics charts | Medium | Chart.js/D3.js widgets |
| Bulk e-signature send | Low | Multiple signers at once |
| Mobile responsive improvements | Low | Currently desktop-first |
