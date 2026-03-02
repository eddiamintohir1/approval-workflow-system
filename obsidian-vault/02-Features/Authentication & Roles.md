---
title: Authentication & Roles
tags: [feature, auth, roles, supabase, cognito]
status: implemented
---

# Authentication & Roles

## Authentication Provider

The system uses **AWS Cognito** (via Supabase OAuth) for authentication.

> [!important] Email Restriction
> Only `@compawnion.co` email addresses are allowed to log in. This is enforced at the Cognito level. Do not remove this restriction.

## Login Flow

1. User visits the app
2. If not authenticated → shown login page (`client/src/pages/Home.tsx`)
3. User enters `@compawnion.co` email + password
4. Cognito validates credentials
5. JWT token issued, stored in session cookie
6. User redirected to Dashboard

## Role System

Roles are stored in the `users` table (`role` column). They are **not** Cognito groups — they are application-level roles managed in the database.

### Role Hierarchy

```
admin          ← Full system access
  ├── CFO      ← Financial oversight + user management + document queue
  ├── CEO      ← Executive view + analytics
  ├── COO      ← Operations + capacity
  └── Exec Asst ← Analytics access

Manager        ← Department head, approves workflows in their dept
  ├── PPIC
  ├── Purchasing
  ├── Finance
  ├── Sales
  ├── Brand Manager
  ├── PR Manager
  ├── GA
  ├── R&D
  ├── Marketing
  └── Operations

Staff          ← Submit and view own workflows
Vendor         ← External, limited access
```

### Access Control Matrix

| Feature | Admin | CFO | CEO | COO | Exec Asst | Manager | Staff | Vendor |
|---------|-------|-----|-----|-----|-----------|---------|-------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| My Workflows | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Capacity | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| E-Signature | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Document Queue | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Document Templates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| User Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Workflow Templates | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Form Templates | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Sequence Generator | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Key Files

| File | Purpose |
|------|---------|
| `client/src/contexts/UserRoleContext.tsx` | React context for current user's role |
| `server/_core/context.ts` | tRPC context — builds `ctx.user` from JWT |
| `client/src/components/DashboardLayout.tsx` | Role-based nav item visibility |

## Test Mode

The sidebar footer has a **Test Mode** toggle that lets developers switch between roles without logging out. This is visible only in development mode.

## Adding a New User

1. The user must sign up via the Cognito login page with a `@compawnion.co` email
2. An admin or CFO then assigns them a role in **User Management** (`/users`)
3. Until a role is assigned, the user has `Staff` level access by default

## Adding a New Role

1. Update the role enum/list in `server/routers.ts` (validation)
2. Update `client/src/components/DashboardLayout.tsx` (nav visibility rules)
3. Update `client/src/contexts/UserRoleContext.tsx` if needed
4. Update access control checks across relevant pages
