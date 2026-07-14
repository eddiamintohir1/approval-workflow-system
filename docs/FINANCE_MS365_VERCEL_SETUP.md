# Finance Approval Web App — Microsoft 365 + Vercel Setup

This project should be deployed as a dedicated finance approval web app connected to Microsoft services.

The current repository is a Vite React app with an Express/tRPC backend, not a Next.js app yet. For the fastest stable first deployment, use Vercel for the frontend and point it to the existing backend with `VITE_API_URL`.

## Target architecture

- Frontend hosting: Vercel
- Auth: Microsoft Entra ID
- Backend/API: existing backend service
- Database: existing connected database
- File storage: Azure Blob Storage
- Notifications: Microsoft Graph email and optional Teams
- Not used as core workflow: Power Automate, Sanity, Lovable, Manus

## What Eddie needs to prepare

### 1. GitHub

- Confirm the repo to deploy: `eddiamintohir1/approval-workflow-system`
- Confirm target branch for deployment, usually `main`
- Give Codex/GitHub editor access if you want automated commits/pull requests

### 2. Vercel project

Create a new Vercel project from GitHub:

- Framework preset: Vite
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output directory: `dist/public`
- Root directory: repository root

This repository includes `vercel.json` so Vercel should pick up these settings automatically.

### 3. Existing backend URL

Provide the backend/API base URL.

Set this in Vercel:

```env
VITE_API_URL=https://your-existing-backend.example.com
```

The frontend calls:

```text
{VITE_API_URL}/api/trpc
```

### 4. Microsoft Entra app registration

Create or provide an Entra app registration for the finance app.

Needed values:

```env
VITE_ENTRA_TENANT_ID=
VITE_ENTRA_CLIENT_ID=
ENTRA_TENANT_ID=
ENTRA_CLIENT_ID=
```

Recommended redirect URIs:

```text
http://localhost:3000/auth/callback
http://localhost:5173/auth/callback
https://your-vercel-project.vercel.app/auth/callback
https://your-final-subdomain/auth/callback
```

Recommended logout redirect URIs:

```text
http://localhost:3000/login
http://localhost:5173/login
https://your-vercel-project.vercel.app/login
https://your-final-subdomain/login
```

Use Microsoft Entra ID as identity only. Application roles and finance permissions should stay in the app database.

### 5. Azure Blob Storage

Prepare private containers:

```text
finance-templates
finance-submissions
finance-attachments
```

Backend needs one of:

- `AZURE_STORAGE_CONNECTION_STRING`, or
- managed identity / workload identity configuration if the backend host supports it

Vercel frontend must not receive Azure storage secrets.

### 6. Microsoft Graph email / Teams

Prepare a system sender mailbox, for example:

```text
finance-system@compawnion.co
```

Backend needs Graph app credentials or another approved Microsoft email channel:

```env
GRAPH_TENANT_ID=
GRAPH_CLIENT_ID=
GRAPH_CLIENT_SECRET=
GRAPH_SENDER_MAILBOX=finance-system@compawnion.co
```

Minimum expected Graph permission:

```text
Mail.Send
```

Optional Teams notification can be added later.

### 7. Initial app admin

Set:

```env
INITIAL_ADMIN_EMAIL=eddie.amintohir@compawnion.co
```

## Recommended implementation order

1. Make current app deploy cleanly to Vercel as frontend.
2. Replace Cognito frontend auth with Microsoft Entra login.
3. Replace backend Cognito JWT validation with Entra token validation.
4. Replace S3 storage helper with Azure Blob Storage helper.
5. Replace SES/WorkMail email with Microsoft Graph sender.
6. Add Finance Forms module:
   - template upload
   - Excel field mapping
   - draft/submission validation
   - manager/finance dashboard
   - CSV export
   - generated Excel output
7. Add role/access hardening and tests.

## Important guardrails

- Do not store file secrets in the frontend.
- Do not use Power Automate as the source of truth for approvals.
- Do not use Sanity for finance workflow records.
- Do not physically delete users with historical activity; deactivate them.
- Keep approval actions and audit logs append-only.
- Published template versions should be immutable.
