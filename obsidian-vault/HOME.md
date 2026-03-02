---
title: WFMT - Compawnion Jadi Berkat Workflow Management System
tags:
  - project
  - wfmt
  - compawnion
aliases:
  - WFMT
  - Workflow Hub
status: active
last_updated: 2026-03-02
ai_handoff: true
---

# 🐾 WFMT — Compawnion Jadi Berkat Workflow Management System

> [!info] AI Handoff Vault
> This vault is designed for **AI agent continuity**. A future Claude/AI agent should read this vault in full before starting any new task on the WFMT project. Start with this note, then follow the links.

## Quick Navigation

| Section | Description |
|---------|-------------|
| [[00-Project-Overview/Project Brief]] | What this system is, who it's for, business context |
| [[01-Architecture/Tech Stack]] | Full technical stack, infrastructure, key files |
| [[01-Architecture/Database Schema]] | All database tables, relationships, enums |
| [[02-Features/Feature Map]] | All implemented features with status |
| [[02-Features/E-Signature Workflow]] | Hybrid Dropbox Sign integration details |
| [[02-Features/Authentication & Roles]] | Supabase OAuth, role-based access |
| [[03-Progress/Changelog]] | Chronological build history, all checkpoints |
| [[04-Next-Steps/Backlog]] | Pending features, deferred work |
| [[05-Prompts/Developer Prompts]] | Ready-to-use prompts for next AI agent |
| [[06-Database/Migrations]] | SQL migration history |

## Project Identity

- **System Name**: CJB Workflow Hub (WFMT)
- **Company**: Compawnion Jadi Berkat (CJB)
- **Domain**: `wfmt.compawnion.id`
- **GitHub**: `https://github.com/eddiamintohir1/approval-workflow-system`
- **Manus Project ID**: `CpEi2h5S6ugwixFhxmPzAJ`
- **Owner**: eddie.amintohir@compawnion.co

## Current Version

- **Version**: v1.07
- **Last Checkpoint**: `282a2428`
- **Status**: Active development

## Critical Rules for Next AI Agent

> [!warning] Read Before Starting
> 1. **Never expose third-party service names in UI** — use "Compawnion's AWS Cloud" instead of S3, "Compawnion's Document Service" instead of Dropbox Sign
> 2. **Auth is Supabase OAuth restricted to @compawnion.co emails only** — do not change this
> 3. **E-signature is hybrid** — upload to S3, manual send via Dropbox Sign website, API tracking only (no API send calls — too expensive)
> 4. **E-Materai is paused** — OnlinePajak account not yet activated, do not implement until confirmed
> 5. **All file storage goes through AWS S3** via `server/storage.ts` helpers
> 6. **Database uses Drizzle ORM** — always update `drizzle/schema.ts` first, generate migration, then apply via `webdev_execute_sql`
