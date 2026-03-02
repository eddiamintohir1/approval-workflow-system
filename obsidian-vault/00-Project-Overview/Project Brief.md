---
title: Project Brief
tags: [project, overview, compawnion]
status: active
---

# Project Brief — WFMT

## What Is This?

A **multi-layer approval workflow management system** (WFMT) built for **Compawnion Jadi Berkat (CJB)**, a manufacturing company in Indonesia. The system manages purchase orders, production tracking, and document approvals across multiple departments.

## Business Context

Compawnion Jadi Berkat is a pet food manufacturing company. Their operations require:
- Formal approval chains for Purchase Requests (PR) and Material Authorization Forms (MAF)
- Cross-department coordination: Brand → PPIC → Production, Purchasing, Sales
- Document signing for contracts, NDAs, purchase orders
- Indonesian regulatory compliance (e-Materai / electronic stamp)
- Bilingual interface (English + Bahasa Indonesia)

## Workflow Structure

```
Brand (PR & MAF)
    ↓
PPIC (Planning)
    ↓
Production & Purchasing & Sales
```

## Key Stakeholders

| Role | Access Level | Notes |
|------|-------------|-------|
| Admin | Full access | System configuration, user management |
| CFO | Financial oversight | Document queue, user management, approvals |
| CEO | Executive view | Analytics, high-level approvals |
| COO | Operations | Capacity, workflow oversight |
| Exec Asst | Admin support | Analytics access |
| Manager | Department head | Approve workflows in their dept |
| PPIC | Planning | Production planning workflows |
| Purchasing | Procurement | PO workflows |
| Finance | Financial | Budget/reimbursement workflows |
| Sales | Sales | Sales-related workflows |
| Brand Manager | Branding | PR/MAF initiation |
| PR Manager | PR | PR initiation |
| GA | General Affairs | GA workflows |
| R&D | Research | R&D workflows |
| Marketing | Marketing | Marketing workflows |
| Operations | Operations | Operations workflows |
| Staff | Basic | Submit and view own workflows |
| Vendor | External | Limited access |

## White-Labeling Policy

> [!important]
> The UI must **never** mention third-party service names. Use these substitutions:
> - AWS S3 → "Compawnion's AWS Cloud"
> - Dropbox Sign / HelloSign → "Compawnion's Document Service"
> - OnlinePajak → Do not mention directly

## Language

The system is fully bilingual. Translation files are at:
- `client/src/locales/en.json` — English
- `client/src/locales/id.json` — Bahasa Indonesia

The language switcher is in the sidebar footer.
