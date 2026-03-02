---
title: Tech Stack
tags: [architecture, tech, stack]
---

# Tech Stack

## Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| TypeScript | Latest | Type safety |
| Vite | 7.1.9 | Build tool / dev server |
| Tailwind CSS | 4.1.14 | Utility-first styling |
| shadcn/ui | Latest | Component library |
| Wouter | Latest | Client-side routing |
| i18next | Latest | Internationalization (EN/ID) |

## Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 22.13.0 | Runtime |
| Express | 4 | HTTP server |
| tRPC | 11 | Type-safe API layer |
| Drizzle ORM | Latest | Database ORM |
| Multer | Latest | File upload middleware |

## Database

| Technology | Details |
|-----------|---------|
| PostgreSQL | Via Supabase |
| Drizzle ORM | Schema in `drizzle/schema.ts` |
| Migrations | Generated via `pnpm drizzle-kit generate`, applied via `webdev_execute_sql` |

## Infrastructure & Services

| Service | Purpose | Key |
|---------|---------|-----|
| AWS S3 | File storage (documents, uploads) | Via `server/storage.ts` helpers |
| Supabase | Auth (OAuth) + Database | Restricted to @compawnion.co |
| Dropbox Sign (HelloSign) | E-signature tracking | API Key: stored in env |
| OnlinePajak | E-Materai (Indonesian e-stamp) | API Key: stored in env — PAUSED |
| Resend | Email notifications | Configured |

## Key File Structure

```
approval_workflow_system/
├── client/
│   ├── index.html              ← Google Fonts (Lexend + Source Sans 3)
│   └── src/
│       ├── App.tsx             ← Routes & layout
│       ├── index.css           ← Global styles, CSS variables, Teal design system
│       ├── components/
│       │   └── DashboardLayout.tsx   ← Sidebar nav with section headers
│       ├── pages/
│       │   ├── Home.tsx              ← Login page
│       │   ├── Dashboard.tsx         ← Workflow list
│       │   ├── ESignature.tsx        ← E-sign + E-Materai tabs
│       │   ├── DocumentQueue.tsx     ← CFO/Admin document view
│       │   ├── DocumentTemplates.tsx ← Template library
│       │   ├── Users.tsx             ← User management
│       │   ├── Capacity.tsx          ← Team capacity view
│       │   └── Analytics.tsx         ← Analytics dashboard
│       ├── locales/
│       │   ├── en.json         ← English translations
│       │   └── id.json         ← Indonesian translations
│       └── contexts/
│           └── UserRoleContext.tsx   ← Role-based access
├── server/
│   ├── routers.ts              ← Main tRPC router (imports sub-routers)
│   ├── db.ts                   ← Database query helpers
│   ├── storage.ts              ← AWS S3 helpers (storagePut, storageGet)
│   ├── hellodoc.ts             ← Dropbox Sign API integration
│   ├── routers/
│   │   └── signedDocuments.ts  ← E-signature tRPC procedures
│   └── _core/
│       ├── index.ts            ← Express server + /api/upload endpoint
│       ├── context.ts          ← tRPC context (auth)
│       └── env.ts              ← Environment variable definitions
├── drizzle/
│   └── schema.ts               ← Database schema (source of truth)
└── shared/                     ← Shared types/constants
```

## Environment Variables

All secrets are injected automatically via Manus platform. Key ones:

| Variable | Purpose |
|----------|---------|
| `CUSTOM_DATABASE_URL` | PostgreSQL connection |
| `JWT_SECRET` | Session signing |
| `AWS_ACCESS_KEY_ID` | S3 access |
| `AWS_SECRET_ACCESS_KEY` | S3 secret |
| `AWS_S3_BUCKET` | S3 bucket name |
| `AWS_REGION` | S3 region |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `HELLODOC_API_KEY` | Dropbox Sign API key |
| `VITE_COGNITO_USER_POOL_ID` | Cognito user pool |
| `VITE_COGNITO_CLIENT_ID` | Cognito client |
| `VITE_COGNITO_REGION` | Cognito region |

## Design System

- **Style**: Flat Design + Micro-interactions (50–100ms animations)
- **Primary**: `#0D9488` Teal (oklch: `0.545 0.097 189`)
- **Secondary**: `#14B8A6` Light Teal
- **CTA/Accent**: `#F97316` Orange
- **Background**: `#F0FDFA` Soft Teal White
- **Text**: `#134E4A` Dark Teal
- **Heading Font**: Lexend (Google Fonts)
- **Body Font**: Source Sans 3 (Google Fonts)
- **Border Radius**: 4px (flat design)
- **No shadows, no gradients**

## Navigation Structure (Sidebar)

```
OVERVIEW
  ├── Dashboard
  └── Start Guide

WORKFLOWS
  ├── My Personalized WF
  └── Capacity

DOCUMENTS
  ├── E-Signature
  ├── Document Queue  [Admin/CFO only]
  └── Document Templates

ANALYTICS  [Admin/CEO/CFO/COO/Exec Asst only]
  └── Analytics

ADMINISTRATION  [Role-restricted]
  ├── User Management
  ├── Workflow Templates
  ├── Form Templates
  ├── Excel Templates
  └── Sequence Generator
```
