# Approval Workflow System

A comprehensive multi-layer approval workflow management system for manufacturing, purchase orders, and production tracking.

## 🚀 Features

- **Multi-layer Approval Workflows**: Support for MAF (Material Approval Form) and PR (Purchase Request) workflows
- **AWS Cognito Authentication**: Secure JWT-based authentication with @compawnion.co email restriction
- **Role-Based Access Control**: 8 user roles (Brand, PPIC, Production, Purchasing, Sales Manager, Director, Admin, Super Admin)
- **File Upload/Download**: AWS S3 integration for form templates and submissions
- **Email Notifications**: Amazon SES integration for approval requests and status updates
- **Sequence Generators**: Automatic SKU/PAF/MAF number generation
- **Audit Trail**: Complete logging of all workflow actions
- **PostgreSQL Database**: AWS RDS for data persistence

## 🛠️ Tech Stack

**Frontend:**
- React 19
- TypeScript
- Tailwind CSS 4
- AWS Amplify SDK

**Backend:**
- Node.js + Express
- TypeScript
- AWS Cognito (JWT verification)
- PostgreSQL (AWS RDS)

**AWS Services:**
- AWS Cognito (Authentication)
- AWS RDS (PostgreSQL Database)
- AWS S3 (File Storage)
- Amazon SES (Email Notifications)
- AWS Amplify (Hosting & CI/CD)

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- AWS Account with configured services:
  - Cognito User Pool
  - RDS PostgreSQL Database
  - S3 Bucket
  - SES Verified Domain
- GitHub account for CI/CD

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# AWS Cognito
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_REGION=ap-southeast-1
COGNITO_CLIENT_ID=your-client-id

# Database
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=workflow_db
DB_USER=postgres
DB_PASSWORD=your-db-password

# AWS S3
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=ap-southeast-1

# Amazon SES
AWS_SES_REGION=us-west-2
AWS_SES_FROM_EMAIL=noreply@yourdomain.com

# Application
NODE_ENV=production
PORT=3000
```

## 🚀 Deployment to AWS Amplify

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Connect to AWS Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Select "GitHub" and authorize
4. Select this repository and branch
5. Configure build settings (see `amplify.yml`)
6. Add environment variables from `.env`
7. Click "Save and deploy"

### Step 3: Update Cognito Callback URLs

After deployment, update your Cognito User Pool app client:
- Add Amplify URL to "Allowed callback URLs"
- Add Amplify URL to "Allowed sign-out URLs"

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
psql -h your-rds-endpoint -U postgres -d workflow_db -f supabase_schema.sql
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

- JWT-based authentication with AWS Cognito
- Row-level security policies in PostgreSQL
- Secure file storage with presigned S3 URLs
- Environment variables for sensitive data
- HTTPS enforced in production

## 📄 License

Proprietary - © Eddie Amintohir. All rights reserved.

## 🤝 Support

For issues or questions, contact: eddie.amintohir@compawnion.co
