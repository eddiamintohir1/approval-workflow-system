# Approval Workflow System

A comprehensive multi-layer approval workflow management system for manufacturing, purchase orders, and production tracking.

## 🚀 Features

- **Multi-layer Approval Workflows**: Support for MAF (Material Approval Form) and PR (Purchase Request) workflows
- **Microsoft Entra Authentication**: Passwordless Microsoft 365 sign-in restricted to @compawnion.co
- **Role-Based Access Control**: 8 user roles (Brand, PPIC, Production, Purchasing, Sales Manager, Director, Admin, Super Admin)
- **File Upload/Download**: Private Azure Blob Storage for templates and submissions
- **Email Notifications**: Microsoft Graph mail for approval requests and status updates
- **Sequence Generators**: Automatic SKU/PAF/MAF number generation
- **Audit Trail**: Complete logging of all workflow actions
- **Database**: PostgreSQL-compatible application database

## 🛠️ Tech Stack

**Frontend:**

- React 19
- TypeScript
- Tailwind CSS 4
- Microsoft Authentication Library (MSAL)

**Backend:**

- Node.js + Express
- TypeScript
- Microsoft Entra access-token verification
- PostgreSQL-compatible database

**Microsoft/Vercel Services:**

- Microsoft Entra ID (Authentication)
- Azure Blob Storage (File Storage)
- Microsoft Graph (Email and directory sync)
- Vercel (Hosting and Functions)

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- Microsoft 365 tenant with an Entra app registration
- Azure Storage account and private blob container
- Microsoft Graph application permissions for mail and directory sync
- A PostgreSQL-compatible database
- GitHub account for CI/CD

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Microsoft Entra ID
VITE_ENTRA_TENANT_ID=your-tenant-id
VITE_ENTRA_CLIENT_ID=your-client-id
ENTRA_TENANT_ID=your-tenant-id
ENTRA_CLIENT_ID=your-client-id

# Database
DATABASE_URL=postgresql://...

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_CONTAINER=finance-attachments

# Microsoft Graph
GRAPH_TENANT_ID=your-tenant-id
GRAPH_CLIENT_ID=your-server-app-client-id
GRAPH_CLIENT_SECRET=...
GRAPH_SENDER_MAILBOX=finance-system@compawnion.co

# Application
NODE_ENV=production
PORT=3000
```

## 🚀 Deployment to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Connect to Vercel

1. Import this GitHub repository in Vercel.
2. Keep the Vite settings from `vercel.json`.
3. Add the environment variables from `.env.example`.
4. Add the production `/auth/callback` URL to the Entra SPA registration.
5. Deploy from `main`.

### Step 3: Configure Microsoft Entra

Expose the delegated API scope `api://<client-id>/access_as_user`, then add:

- `https://approval-workflow-system-nine.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback`

## 📦 Local Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## 🗄️ Database Setup

The database schema is in `supabase_schema.sql`. Run this on your PostgreSQL database:

```bash
psql "$DATABASE_URL" -f supabase_schema.sql
```

## 👥 User Roles

1. **Brand** - Creates MAF and PR workflows
2. **PPIC** - Approves after Brand
3. **Production** - Handles production workflows
4. **Purchasing** - Manages purchase requests
5. **Sales Manager** - View-only access
6. **Director** - Can escalate and override
7. **Admin** - Full system access
8. **Super Admin** - User management

## 📧 Email Restriction

Only emails with `@compawnion.co` domain can register and use the system.

## 🔒 Security

- Microsoft Entra OAuth with tenant, audience, scope and domain validation
- Row-level security policies in PostgreSQL
- Secure file storage with time-limited Azure Blob SAS URLs
- Environment variables for sensitive data
- HTTPS enforced in production

## 📄 License

Proprietary - © Eddie Amintohir. All rights reserved.

## 🤝 Support

For issues or questions, contact: eddie.amintohir@compawnion.co
