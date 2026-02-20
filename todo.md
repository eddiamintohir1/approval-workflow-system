# Multi-Layer Approval Workflow System - TODO

## Phase 1: Database Schema & Core Setup
- [x] Update database schema with all required tables (roles, projects, milestones, forms, form_templates, approvals, audit_trail, sequences)
- [x] Generate and apply database migrations
- [x] Create database query helpers in server/db.ts

## Phase 2: Authentication & User Management
- [x] Implement @compawnion.co email validation
- [x] Create user management page (admin only)
- [x] Build user activation/deactivation functionality
- [x] Implement role assignment system (Brand Manager, PPIC Manager, Production Manager, Purchasing Manager, Sales Manager, PR Manager, Director, Admin)
- [x] Create protected routes based on user roles

## Phase 3: Dashboard & Project Management
- [x] Design and implement dashboard layout
- [x] Create project listing with filtering and search
- [x] Build project creation form with OEM toggle
- [x] Implement project status tracking
- [x] Create quick statistics widgets
- [x] Build project details page with workflow timeline

## Phase 4: Workflow & Milestone Management
- [x] Implement standard workflow (Brand → PPIC → Production/Purchasing/Sales)
- [x] Implement OEM workflow (Brand PAF → PR → PPIC → Production/Sales)
- [x] Create milestone progression logic
- [ ] Build form upload interface
- [ ] Implement form download functionality
- [ ] Create greyed-out logic for locked stages
- [x] Build admin override functionality with audit logging
- [x] Implement approval/rejection interface
- [x] Add parallel approval logic (Production & Purchasing must both approve)
- [x] Implement Sales Manager view-only access

## Phase 5: Form Management & Templates
- [x] Build form template builder for admins
- [x] Create dynamic form renderer based on templates
- [x] Implement form validation system
- [x] Add file upload to AWS S3
- [x] Implement form download functionality

## Phase 6: Sequence Generators
- [x] Build SKU sequence generator with custom restrictions
- [x] Build PAF sequence generator with custom restrictions
- [x] Build MAF sequence generator with custom restrictions
- [x] Implement CSV export for sequences
- [x] Create sequence history tracking
- [x] Add auto-generation on workflow creation

## Phase 7: Email Notifications
- [ ] Set up Resend API integration
- [ ] Create milestone completion email template
- [ ] Create revision notification email template
- [ ] Create reminder email template
- [ ] Implement 48-hour reminder scheduling with intervals
- [ ] Add email logging and tracking

## Phase 8: Audit Trail & Logging
- [ ] Implement comprehensive audit trail for all actions
- [ ] Log all approvals/rejections with timestamps and comments
- [ ] Create audit trail viewer in project details page
- [ ] Add admin override logging

## Phase 9: Discontinue Project Flow
- [ ] Build discontinue project modal with warning
- [ ] Implement project archiving functionality
- [ ] Prevent modifications to discontinued projects

## Phase 10: Testing & Documentation
- [ ] Write unit tests for all tRPC procedures
- [ ] Test standard workflow end-to-end
- [ ] Test OEM workflow end-to-end
- [ ] Test parallel approval logic
- [ ] Test email notification triggers
- [ ] Test reminder scheduling
- [ ] Create user documentation
- [ ] Create admin documentation

## Future Enhancements (Post-MVP)
- [ ] Odoo integration for sales, inventory, manufacturing data sync
- [ ] Qontak integration for SMS and WhatsApp notifications
- [ ] Advanced analytics dashboard
- [ ] Bulk project operations
- [ ] Custom workflow builder

## Phase 5.5: Supabase Migration
- [x] Install Supabase client libraries
- [x] Configure Supabase environment variables
- [x] Convert database schema from MySQL to PostgreSQL
- [x] Create tables in Supabase
- [x] Update all database queries to use Supabase client
- [x] Implement Supabase Auth with @compawnion.co restriction
- [x] Set up Row Level Security (RLS) policies
- [x] Test authentication and database operations

## Phase 7: Supabase OAuth & Form Template Management
- [x] Replace Manus OAuth with Supabase OAuth
- [x] Configure Supabase Auth providers
- [x] Update authentication flow to use Supabase Auth
- [x] Implement @compawnion.co email restriction with Supabase Auth
- [ ] Upload form templates (PR, PAF, MAF) to system
- [ ] Create form template management interface
- [ ] Add form template preview functionality
- [ ] Implement form template download

## Phase 8: Form Upload & AWS S3 Integration
- [ ] Implement file upload to AWS S3
- [ ] Add form upload interface to project milestones
- [ ] Implement form download functionality
- [ ] Add form version control
- [ ] Display uploaded forms in project details

## Phase 8: AWS S3 Integration & Form Upload
- [x] Configure AWS S3 credentials (user's own bucket)
- [x] Update storage helpers to use user's S3 bucket
- [x] Test S3 upload and download functionality
- [ ] Upload form templates (PR, PAF, MAF) to S3
- [ ] Create form upload interface in project details
- [ ] Implement form download functionality
- [ ] Add form preview capability
- [ ] Create admin form template management page

## Phase 9: Fix Authentication Conflicts

- [ ] Remove Manus OAuth backend dependencies
- [ ] Update tRPC context to use Supabase session
- [ ] Fix auth.me endpoint to work with Supabase
- [ ] Remove getLoginUrl() redirects to Manus OAuth
- [ ] Test complete authentication flow end-to-end

## Phase 9.5: Additional Features

- [ ] Add form upload interface at each milestone step
- [ ] Add form download functionality for uploaded forms
- [ ] Add project deletion feature (admin only)
- [ ] Make eddie.amintohir@compawnion.co an admin user
- [ ] Add copyright notice "© Eddie Amintohir. All rights reserved."

## Phase 10: Immediate Feature Additions

- [x] Implement form upload/download backend endpoints with S3 integration
- [x] Build form upload/download UI at each milestone step in ProjectDetails page
- [x] Add project deletion functionality (admin only) with audit logging
- [x] Update eddie.amintohir@compawnion.co to admin role in database
- [x] Add copyright notice "© Eddie Amintohir. All rights reserved." to application footer

## Phase 10.1: Bug Fixes

- [x] Fix form queries implementation causing "Cannot read properties of undefined (reading 'length')" error in ProjectDetails

## Phase 10.2: OAuth Callback Bug Fix

- [ ] Fix magic link OAuth callback redirecting to /* (wildcard) causing 404 error

## Phase 10.3: Milestone Button Visibility Bug

- [x] Fix approve/reject buttons remaining visible after milestone is completed
- [x] Implement rejection cascade - disable all subsequent milestones when one is rejected

## Phase 10.4: Login Screen Preview & Live Link

- [x] Make login screen visible in preview panel for visual editing
- [x] Ensure login screen links to live deployment URL (not dev server)

## Phase 10.5: Button Visibility & Super Admin Login

- [x] Fix rejection cascade - buttons still showing on Stage 2+ after Stage 1 rejection
- [x] Add password-based login for super admin developer account (eddie.amintohir@compawnion.co)

## Phase 10.6: Password Login Redirect Bug

- [x] Fix password login not redirecting to dashboard after successful authentication

## Phase 10.7: Delete Project from Dashboard

- [x] Add delete button to project cards on dashboard (admin only)
- [x] Add confirmation dialog before deleting project
- [x] Ensure delete button is visible only to admin users

## Phase 10.8: Sequential Approval Validation Bug

- [x] Fix sequential approval logic - stages can be approved before previous stages are completed
- [x] Ensure all previous stages must be completed before current stage can be approved

## Phase 10.9: Form Template Download Feature

- [x] Create database schema for form templates (MAF, PR, CATTO)
- [x] Add backend endpoints for template upload and download
- [x] Add template download section in project details page
- [x] Add admin interface for uploading form templates
- [ ] Upload initial MAF, PR, and CATTO template files (user needs to upload via /templates page)

## Phase 10.10: Fix Template Query Undefined Error

- [x] Fix getByType endpoint to return null instead of undefined when no template exists


## Phase 11: Hybrid Deployment (Manus Frontend + EC2 Backend)

- [x] Remove Manus OAuth and Supabase dependencies from frontend
- [x] Install AWS Cognito SDK (`amazon-cognito-identity-js`)
- [x] Create Cognito authentication service for frontend
- [x] Update login/signup pages to use AWS Cognito
- [x] Configure tRPC client to point to EC2 backend API
- [x] Add Cognito JWT token to API requests
- [x] Update environment variables for Cognito configuration
- [ ] Add Manus frontend URL to EC2 backend CORS whitelist
- [ ] Add Manus hosting URL to Cognito callback URLs
- [ ] Add Manus hosting URL to Cognito logout URLs
- [ ] Test authentication flow end-to-end
- [ ] Verify workflow creation works with hybrid setup

## Phase 11.1: Fix Frontend Architecture for Hybrid Deployment

- [x] Remove direct Supabase client calls from frontend components
- [x] Update useUserRole hook to call EC2 backend API instead of Supabase
- [x] Ensure all database operations go through tRPC to EC2 backend
- [ ] Fix blank screen after login in preview environment
- [ ] Test dashboard loads correctly after Cognito authentication

## Phase 12: Migrate to Manus Backend with AWS Resources

- [ ] Update DATABASE_URL secret to point to AWS RDS PostgreSQL
- [ ] Install aws-jwt-verify package for Cognito JWT verification
- [ ] Update server context to verify Cognito tokens
- [ ] Update server/routers.ts to match AWS database schema (cognito_sub, full_name, etc.)
- [ ] Test authentication flow with Cognito on Manus backend
- [ ] Test CRUD operations with AWS RDS from Manus backend
- [ ] Verify S3 storage integration works with Manus backend

## Phase 13: Migrate Complete MAF PR Workflow Schema to Manus Database

- [x] Analyze PostgreSQL schema from AWS deployment
- [x] Convert PostgreSQL-specific features to TiDB-compatible format
- [x] Create Drizzle ORM schema for all MAF PR workflow tables:
  - [x] users table (with Cognito integration)
  - [x] workflows table (MAF, PR)
  - [x] workflow_stages table
  - [x] workflow_approvals table
  - [x] workflow_files table (S3 references)
  - [x] workflow_comments table
  - [x] audit_logs table
  - [x] email_recipients table
  - [x] sequence_counters table
- [x] Generate database migrations
- [x] Apply migrations to Manus TiDB database
- [x] Update backend db.ts with new query helpers
- [x] Update routers.ts with MAF PR workflow endpoints
- [ ] Test workflow creation and approval flow
- [ ] Verify S3 file upload integration
- [ ] Test email notification system

## Phase 14: Update Frontend for MAF PR Workflow

- [ ] Update Dashboard.tsx to display workflow statistics and list
- [ ] Create WorkflowCreate.tsx page for MAF/PR creation
- [ ] Create WorkflowDetail.tsx page to view workflow progress
- [ ] Create ApprovalInterface.tsx for approving/rejecting stages
- [ ] Update App.tsx routing for new pages
- [ ] Fix UserManagement.tsx to use new API
- [x] Test complete workflow flowtion and approval flow

## Phase 15: Add Downloadable Form Templates
- [x] Upload MAF02.2026.xlsx to S3 storage
- [x] Upload PR02.2026.xlsx to S3 storage
- [x] Update WorkflowCreate.tsx to show download buttons for form templates
- [x] Test form download functionality

## Phase 16: Fix tRPC API Error (ECONNRESET)
- [x] Diagnose database connection reset error
- [x] Update MySQL connection pool with proper configuration (connection limit, keep-alive, wait for connections)
- [x] Restart dev server and verify fix
- [x] Test dashboard loads without API errors

## Phase 17: Workflow Creation Revisions
- [x] Remove "Estimated Amount" and "Currency" fields from WorkflowCreate form
- [x] Update workflow schema to make price fields optional (added later by GA)
- [x] Add role switcher UI component for test user
- [x] Create backend endpoint to switch user role temporarily
- [x] Test role switching functionality for all roles (admin, Finance, CFO, PPIC, Purchasing, GA, etc.)
- [x] Verify approval permissions work correctly for each role

## Phase 18: Complete Phase 4 - Workflow & Milestone Management
- [x] Build file upload interface for attaching documents to workflows
  - [x] Add file upload component to WorkflowDetail page
  - [x] Implement drag-and-drop file upload
  - [x] Upload files to S3 storage
  - [x] Save file metadata to workflow_files table
  - [x] Display uploaded files list with download links
- [x] Implement greyed-out logic for locked approval stages
  - [x] Disable approval buttons for stages that haven't been unlocked
  - [x] Show visual indication (greyed out) for locked stages
  - [x] Only allow approval for current active stage
- [x] Test file upload and stage locking functionality

## Phase 19: Fix Missing workflows.getFiles Endpoint
- [x] Fix missing workflows.getFiles tRPC endpoint error on workflow detail page

## Phase 20: Stage-Based Form Upload Requirements
- [x] Add signature image storage to users table (for CEO/CFO)
- [x] Update workflow_files table to track which stage uploaded each file
- [x] Create backend validation: users must upload form before approving (except CEO/CFO)
- [x] Update WorkflowDetail UI to display all forms from previous stages (read-only, downloadable)
- [x] Show current stage's uploaded forms with upload interface
- [x] Disable Approve button until form is uploaded (except for CEO/CFO roles)
- [x] Implement CEO/CFO signature-only approval (apply pre-uploaded signature image)
- [ ] Add signature upload interface for CEO/CFO users in user management
- [ ] Test complete workflow with form upload requirements at each stage

## Phase 21: Default Form Templates & Workflow Integration
- [x] Create seed script to populate default form templates (MAF, PR, CATTO)
- [x] Define MAF form fields (requester info, item details, justification, budget)
- [x] Define PR form fields (vendor info, items, quantities, delivery date)
- [x] Define CATTO form fields (project details, timeline, resources, approval chain)
- [x] Update WorkflowCreate page to show template selection dropdown
- [x] Replace free-text fields with DynamicFormRenderer when template is selected
- [x] Save form submission data to form_submissions table when workflow is created
- [x] Update WorkflowDetail page to display submitted form data from form_submissions
- [ ] Test creating MAF workflow with form template
- [ ] Test creating PR workflow with form template
- [ ] Test creating CATTO workflow with form template

## Phase 9: Discontinue Project Flow (Current)
- [x] Update workflow schema to add discontinued/archived status
- [x] Create backend endpoint for discontinuing workflows
- [x] Build discontinue workflow modal with warning message
- [x] Add visual indicators (badges, colors) for discontinued workflows
- [x] Prevent modifications (approve, reject, upload) to discontinued workflows
- [x] Add "Discontinue Workflow" button to workflow detail page
- [x] Test complete discontinue flow with warnings and restrictions

## Phase 22: UI Improvements & Branding
- [x] Copy Compawnion logo files to project public directory
- [x] Update favicon to use Compawnion logo
- [x] Add Compawnion logo to login page and dashboard header
- [x] Update background with colorful blue-to-cyan gradient
- [x] Add Help/Support button to navigation linking to https://tech.compawnion.id/
- [x] Create analytics dashboard page with workflow metrics
- [x] Add workflow statistics cards (total, in progress, completed, rejected)
- [x] Add workflow completion rate chart
- [x] Add average approval time by workflow type chart
- [x] Add workflow distribution by department chart
- [x] Test all UI improvements and verify responsiveness

## Phase 23: Fix Gradient Background & Branding Visibility
- [x] Investigate why gradient background is not visible on login/dashboard
- [x] Fix CSS to ensure gradient background applies to all pages
- [x] Ensure Compawnion logo is visible in navigation
- [x] Test all pages to verify gradient and branding work correctly

## Phase 24: Fix Double Authentication Issue
- [x] Investigate why users see second auth screen after login
- [x] Fix Dashboard component to properly handle loading state
- [x] Test complete login flow from start to dashboard

## Phase 25: Fix CORS Issue on Production Domain
- [x] Investigate why auth.me API calls return status 0 on production
- [x] Check tRPC client configuration for backend URL
- [x] Remove VITE_API_URL to use same-origin for published version
- [ ] Republish with updated environment variables
- [ ] Test authentication flow on wfmt.compawnion.id domain

## Phase 8: Audit Trail & Logging
- [x] Review audit_logs table schema
- [x] Add audit logging to workflow approval/rejection actions
- [x] Add audit logging to file upload/delete actions
- [x] Add audit logging to workflow status changes
- [x] Add audit logging to admin override actions
- [x] Create audit trail viewer component
- [x] Add audit trail section to workflow detail page
- [x] Test complete audit trail functionality

Note: ProjectDetails.tsx page uses old API (projects/milestones) - needs update to use workflows/stages API to display audit trail

## Fix Broken Logo
- [x] Upload logo image to S3
- [x] Update logo URL in DashboardLayout component
- [x] Test logo display on dashboard

## Refactor ProjectDetails Page and Add Help Button
- [x] Analyze ProjectDetails.tsx current API usage
- [x] Create new WorkflowDetail page with workflows.getById API
- [x] Update to use stages.getByWorkflow instead of milestones
- [x] Add all stage approval/rejection mutations
- [x] Test workflow detail page displays correctly
- [x] Create HelpButton floating component
- [x] Add HelpButton to Dashboard and WorkflowDetail pages
- [x] Test help button links to tech.compawnion.id

## Fix Logo, Help Button, and Analytics Page Issues
- [x] Upload new logo image to S3
- [x] Update logo URL in all components
- [x] Investigate why help button is missing
- [x] Restore help button functionality
- [x] Locate analytics page
- [x] Test analytics page functionality

## Add Gantt Chart and Breadcrumb Trail
- [x] Add Gantt chart to Analytics page showing workflow progress timeline
- [x] Create breadcrumb/progress trail component for workflow stages
- [x] Add breadcrumb trail to top of WorkflowDetail page
- [x] Test Gantt chart visualization with workflow data
- [x] Test breadcrumb trail showing current and next stages

## Performance Optimization
- [x] Analyze slow database queries and API endpoints
- [x] Add database indexes for frequently queried fields (workflows table)
- [x] Add loading skeleton for better perceived performance
- [x] Test performance improvements

## Fix tRPC Mutation Error on Workflow Detail Page
- [x] Investigate the error and identify which mutation is failing
- [x] Check Zod schema validation in the problematic endpoint
- [x] Fix the schema validation issue (added missing Zod import)
- [x] Test the fix on workflow detail page

## Executive Dashboard Features and Workflow Improvements
- [x] Add Analytics button to dashboard for CEO, COO, CFO roles
- [x] Add Template Management button to dashboard for CEO, COO, CFO roles
- [ ] Create template management page for creating/editing form templates
- [ ] Implement Excel export for MAF workflows with signature fields
- [ ] Implement Excel export for PR workflows with signature fields
- [x] Fix PPIC role workflow approval (enable PPIC users to approve their stage)
- [x] Add Marketing department to department enum and forms
- [x] Add Sales department to department enum and forms
- [x] Add R&D department to department enum and forms
- [ ] Test all executive features and workflow approvals

## Executive Dashboard Features and Workflow Improvements
- [x] Add Analytics button to dashboard for CEO, COO, CFO roles
- [x] Add Template Management button to dashboard for CEO, COO, CFO roles
- [x] Fix PPIC role workflow approval (enable PPIC users to approve their stage)
- [x] Add Marketing department to department enum and forms
- [x] Add Sales department to department enum and forms
- [x] Add R&D department to department enum and forms
- [x] Implement Excel template download for MAF workflows
- [x] Implement Excel template download for PR workflows
- [x] Implement Excel template download for CATTO workflows
- [x] Add download button to workflow detail page
- [x] Test all new features end-to-end

## Fix Recurring Zod Import Error
- [x] Verify Zod import exists in routers.ts
- [x] Check for missing Zod imports in other router files
- [x] Fix the import issue permanently
- [x] Test workflow detail page to confirm fix works

## Restore Missing Approval Buttons and Upload Functionality
- [ ] Investigate why approve/reject buttons disappeared from workflow detail page
- [ ] Check canUserApproveStage logic in WorkflowDetail.tsx
- [ ] Fix the logic to properly show action buttons for authorized users
- [ ] Restore file upload functionality for stages
- [ ] Test with PPIC role on pending PPIC Review stage
- [ ] Test with Purchasing role on in-progress Purchasing Review stage


## Phase 30: Workflow Template Builder System
- [x] Create workflow_templates table schema (name, description, is_active)
- [x] Create template_stages table schema with conditions (order, department, approval_required, file_upload_required, notification_emails, visible_to_departments)
- [x] Build Template Builder page with drag-and-drop UI
- [x] Implement stage configuration panel (approval, file upload, email notifications, department visibility)
- [x] Add template management backend API (create, save, edit, delete, getAll, getById, getDefault)
- [x] Wire up frontend with tRPC for template creation
- [ ] Update workflow creation to select and use templates
- [ ] Enhance breadcrumb trail visualization
- [ ] Add visual stage flow indicator
- [ ] Create template list page to view all templates
- [ ] Add template editing functionality

## Phase 31: Template List & Workflow Integration
- [x] Create template list page (/templates) with all saved templates
- [x] Add edit button to open template in builder
- [x] Add delete button with confirmation dialog
- [x] Show template preview with visual stage flow
- [x] Update workflow creation form to select template
- [x] Auto-generate workflow stages from selected template
- [x] Add template preview in workflow creation


## Phase 32: Executive Access & Enhanced Analytics
- [x] Update navigation to show Form Template menu for CEO, COO, CFO, Admin roles
- [x] Update navigation to show Workflow Template menu for CEO, COO, CFO, Admin roles
- [x] Add department dropdown filter to Analytics page
- [x] Calculate average days from task assignment to completion per department (from audit logs)
- [x] Add monthly cost breakdown by department (from form price fields)
- [x] Add yearly cost breakdown by department (from form price fields)
- [x] Display completion time metrics with visual charts
- [x] Display cost metrics with visual charts


## Phase 33: Admin Workflow Deletion
- [ ] Create delete workflow backend endpoint (admin-only)
- [ ] Add cascade delete for related data (stages, files, approvals, comments, audit logs)
- [ ] Add delete button to workflow list (visible only to admin)
- [ ] Add confirmation dialog before deletion
- [ ] Show success/error toast after deletion
- [ ] Refresh workflow list after deletion


## Phase 33: Admin Workflow Deletion
- [x] Add delete workflow backend endpoint (admin-only)
- [x] Create deleteWorkflow function in db.ts with cascade deletion
- [x] Add delete button to workflow list (visible to admin only)
- [x] Add confirmation dialog before deletion
- [x] Show success/error toast messages


## Phase 34: Form Template Selection & Budget Analytics
- [ ] Fix form template dropdown showing no options in workflow creation
- [ ] Add "Actual Cost" field type to form template builder
- [ ] Create department budget allocation table in database
- [ ] Add budget setting interface for admin
- [ ] Create budget analytics page with metered bar charts (spending vs allocated)
- [ ] Calculate actual spending from "actual cost" fields in submitted forms
- [ ] Add monthly/quarterly/yearly budget comparison views
- [ ] Add home/back navigation button to Analytics page
- [ ] Add home/back navigation button to Form Template pages
- [ ] Add home/back navigation button to Workflow Template pages
- [ ] Push code to GitHub repository: https://github.com/eddiamintohir1/approval-workflow-system.git


## Phase 35: Budget Analytics Dashboard & Navigation Completion
- [x] Add home buttons to FormTemplateBuilder page
- [x] Add home buttons to FormTemplateList page
- [x] Add home buttons to TemplateList page
- [x] Create budget management backend API (create, read, update, delete budgets)
- [ ] Build admin budget management UI to set department budgets
- [x] Extract actual cost data from form submissions
- [x] Create metered bar chart component for budget visualization
- [x] Build budget analytics dashboard with department filter
- [x] Add monthly/quarterly/yearly view toggles
- [x] Display spending vs allocated budget with percentage indicators
- [x] Add budget overspend warnings (red indicators)


## Phase 36: Excel Template Management System
- [ ] Create excel_templates database table (workflow_type, template_name, file_url, file_key, uploaded_by, uploaded_at)
- [ ] Build backend API for Excel template CRUD operations
- [ ] Create Excel template management admin page with upload functionality
- [ ] Add navigation button in Dashboard sidebar for Excel Template Management (admin only)
- [ ] Update workflow detail page to show "Download [Type] Template" button
- [ ] Implement file download functionality for Excel templates
- [ ] Add upload timestamp and uploader name display

## Phase 20: Excel Template Management System

- [x] Create excel_templates database table with schema
- [x] Implement backend database helper functions (create, read, update, delete)
- [x] Create tRPC router for Excel template CRUD operations
- [x] Build admin UI page for template management (/admin/excel-templates)
- [x] Add Excel template upload functionality with S3 storage
- [x] Implement template list view with edit/delete actions
- [x] Add navigation button in Dashboard for executives (CEO, COO, CFO, admin)
- [x] Integrate template download into WorkflowDetail page
- [x] Display download button based on workflow type
- [x] Write comprehensive unit tests for Excel template management
- [x] All tests passing (6/6 tests)

## Phase 20.1: Fix Excel Templates Page React Error

- [x] Fix "Objects are not valid as a React child" error on /admin/excel-templates page
- [x] Identify where object is being rendered directly in JSX
- [x] Update to render object properties correctly

## Phase 21: Forgot Password Flow & User Sync

- [x] Create ForgotPassword page with email input form
- [x] Implement verification code input and new password form
- [x] Add Cognito forgotPassword and confirmPassword API calls
- [x] Add "Forgot Password?" link to Login page
- [x] Create admin bulk user sync function to import Cognito users
- [x] Add admin UI for bulk user sync
- [x] Test complete forgot password flow
- [x] Test bulk user sync functionality
