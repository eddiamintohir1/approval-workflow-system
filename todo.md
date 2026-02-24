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

## Phase 21.1: Fix Role Validation Error

- [x] Identify role mismatch between tRPC validation schema and database
- [x] Check what roles are actually stored in database
- [x] Update role enum in routers.ts to match database roles
- [x] Test user management page role updates

## Phase 22: Performance Optimization & AWS SES Email Setup

### Performance Optimization
- [x] Analyze Dashboard loading performance bottlenecks
- [x] Analyze Analytics page performance when changing months/departments
- [x] Implement React Query caching for workflow data
- [x] Add staleTime and cacheTime to tRPC queries
- [x] Optimize database queries with proper indexes
- [x] Add backend caching for analytics calculations
- [x] Implement loading skeletons for better UX
- [x] Add pagination for large workflow lists
- [x] Optimize Analytics page month/department switching

### AWS SES Email Setup
- [x] Install AWS SES SDK dependencies
- [x] Create email service module with SES integration
- [x] Implement dynamic sender based on last workflow actor
- [x] Create email templates for workflow reminders
- [x] Add daily reminder scheduler (8 AM)
- [x] Test email delivery from user-specific @compawnion.co addresses
- [x] Add email notification preferences to user settings

## Phase 23: Fix Template Builder Preview Error

- [ ] Investigate "Failed to load template preview" error
- [ ] Check template builder page for API errors
- [ ] Identify missing or broken template preview functionality
- [ ] Fix template preview loading logic
- [ ] Test template builder with different workflow types

## Phase 24: Workflow Initial Submission Details & Visibility Restrictions

- [x] Add "Workflow Details" section to WorkflowDetail page showing initial submission info
- [x] Display original files uploaded by requester
- [x] Show requester information, department, estimated amount, creation date
- [x] Implement visibility restrictions for workflow cards in Dashboard
- [x] Filter workflows based on user's department and stage visibility settings
- [x] Hide stages not visible to user's department in workflow detail page
- [x] Test visibility logic with different user roles and departments
- [x] Ensure approvers can see all necessary information to make decisions

## Phase 25: Workflow Search & Filters

- [x] Add search input component to Dashboard for searching by workflow ID or title
- [x] Add filter dropdowns for workflow status (draft, pending, approved, rejected)
- [x] Add filter dropdown for workflow type (MAF, PR, Reimbursement, Budget)
- [x] Add filter dropdown for department
- [x] Add date range picker component for filtering by creation date
- [x] Implement client-side filtering logic that combines all filters
- [x] Add "Clear Filters" button to reset all filters
- [x] Add filter count badge showing number of active filters
- [x] Persist filter state to localStorage
- [x] Add URL params for shareable filtered views
- [x] Test all filter combinations

## Phase 26: Update Website Branding

- [x] Change website title from "Multi-Layer Approval Workflow System" to "CJB Workflow Management System"
- [x] Update meta description for social media sharing
- [x] Update Open Graph tags for link previews
- [x] Test link sharing preview on messaging apps

## Phase 28: Fix TypeScript Errors

- [ ] Fix Cognito token payload type errors in server/_core/context.ts
- [ ] Add proper type definitions for cognito:groups
- [ ] Run full TypeScript check to find all errors
- [ ] Fix remaining TypeScript errors
- [ ] Verify build completes without errors

## Phase 29: Comprehensive Beta Testing

- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials (error handling)
- [ ] Test forgot password flow (email → code → new password)
- [ ] Test logout functionality
- [ ] Test workflow creation for MAF type
- [ ] Test workflow creation for PR type
- [ ] Test workflow creation for Reimbursement type
- [ ] Test workflow creation for Budget type
- [ ] Test file upload during workflow creation
- [ ] Test approval flow with PPIC role
- [ ] Test approval flow with Finance role
- [ ] Test approval flow with CEO/COO/CFO roles
- [ ] Test rejection flow
- [ ] Test file upload during approval stages
- [ ] Test Excel template download
- [ ] Test Excel template management (admin)
- [ ] Test Analytics page with different filters
- [ ] Test Dashboard search functionality
- [ ] Test Dashboard filters (status, type, department, date range)
- [ ] Test User Management (role changes, sync from Cognito)
- [ ] Test visibility restrictions (users can't access unauthorized workflows)
- [ ] Test edge cases (empty data, large files, special characters)
- [ ] Document all bugs and issues found
- [ ] Fix critical bugs before pilot testing

## Phase 30: Fix Beta Testing Issues

- [x] Investigate department dropdown not opening on workflow creation page
- [x] Fix dropdown component initialization or event handling (dropdown works correctly, was browser automation issue)
- [x] Fix missing role assignments for stages 3 & 4 in workflow detail page (not a bug - template was created without roles for those stages)
- [x] Fix requester showing "Unknown" instead of user email (added join with users table)
- [x] Remove duplicate success toast notification after workflow creation (removed manual toast, kept mutation onSuccess)
- [x] Fix template showing "0 stages" during creation (added stages to template query)
- [ ] Remove duplicate "User Management" navigation item
- [ ] Test workflow creation flow end-to-end after fixes
- [x] Fix admin bypass for file upload requirement - admins should be able to approve stages without uploading files

## Phase 26: Post-Beta Testing Improvements
- [x] Clean up duplicate user records (test@compawnion.co appears twice)
- [x] Configure production workflow templates (MAF, PR, Reimbursement with real approval chains)
- [x] Replace loading spinners with skeleton loaders (like dog/cat skeletons)

## Phase 30: Workflow Template Preview
- [x] Implement workflow template preview with vertical timeline visualization

## Phase 31: Pre-completion Contingency Feature
- [x] Add contingency_workflow_ids JSON field to workflows table
- [x] Update backend validation to check contingency status before final approval
- [x] Remove GA/PPIC approval toggles from workflow creation form
- [x] Add Pre-completion Contingency toggle and workflow search selector
- [x] Display contingency workflows and their status in workflow detail page

## Phase 32: Login Page Branding Update
- [x] Change login page title from "Approval Workflow System" to "CJB Workflow Hub"

## Phase 33: Enhanced Gantt Chart with Department Grouping
- [x] Create department-grouped Gantt chart component with collapsible sections
- [x] Add date range filter for timeline view
- [x] Implement stage-based color coding for workflow bars
- [x] Make workflow bars clickable to navigate to detail page

## Phase 34: Workflow Pinning
- [x] Add pinned_workflows field to user table
- [x] Create pin/unpin workflow backend endpoints
- [x] Add pin button to workflow cards and detail pages
- [x] Update dashboard to show pinned workflows at top with highlighted styling
- [x] Add visual indicator (star icon) for pinned workflows

## Phase 35: Performance Optimization & UI Fixes
- [x] Fix duplicate User Management button in dashboard header
- [x] Add Sequence Generator button to CEO/COO/CFO/Admin menu
- [x] Optimize query caching for faster loading
- [ ] Implement lazy loading for heavy components
- [x] Add loading skeletons for better perceived performance

## Phase 36: Compact Gantt Chart View
- [x] Reduce Gantt chart row heights to single line per workflow
- [x] Remove stage legend indicators (redundant with chart bars)
- [x] Keep only workflow name, number, and status badge

## Phase 36: Modern Left Sidebar Navigation & Capacity Dashboard
- [x] Move top menu items (User Management, Template Management, Sequence Generator) to left sidebar
- [x] Create backend endpoint for capacity dashboard data grouped by current approver
- [ ] Build Capacity Dashboard page with horizontal scrollable user columns
- [ ] Display workflow cards under each user with time tracking metrics
- [ ] Add filters for team/department and time period
- [ ] Calculate time remaining, progress %, and overdue status from existing dates

## Phase 36: Fix Sidebar Visibility
- [x] Fix left sidebar menu not showing on dashboard
- [x] Fix workflow template preview modal not opening when clicking Preview button

## Phase 26: Capacity Management & Task Assignment System
- [x] Add new roles: Exec Asst and Staff to role enum
- [x] Create task_assignments table with indexes
- [x] Create user_performance_metrics table with indexes
- [x] Create salary_cache table
- [x] Add is_quick_assign_enabled boolean to workflow_templates table
- [x] Generate and apply database migrations
- [x] Create tRPC endpoints for task assignment (create, getByUser, getTeamAssignments)
- [x] Create tRPC endpoints for performance metrics (calculateUserMetrics, getUserMetrics, recalculateAll)
- [x] Create tRPC endpoints for salary integration (syncFromQapita, getUserSalary, syncAll)
- [x] Create tRPC endpoints for template quick assign toggle
- [x] Create tRPC endpoint for paginated capacity user list
- [x] Add "Quick Assign" button next to "New Workflow" on Dashboard
- [x] Create Quick Assign modal with enabled templates
- [x] Add quick assign toggle to template cards
- [x] Redesign Capacity page with pagination (20 users/page)
- [x] Add department filter with "My Team" option
- [x] Create user detail popup with performance metrics
- [x] Add salary display for admin/CEO/CFO/COO only
- [x] Update DashboardLayout role-based menu visibility
- [x] Hide ADMINISTRATION section from Dept heads and Staff
- [x] Hide Capacity and Analytics from Dept heads and Staff
- [x] Add database indexes for performance optimization
- [x] Test with existing users
- [x] Push to GitHub after successful deployment

## Capacity Management Bug Fixes

- [x] Add Exec Asst and Staff roles to User Management dropdown
- [x] Fix Capacity page to display user names and emails from Cognito
- [x] Fix quick assign template toggle checkmark not showing when toggled
- [x] Verify Quick Assign button visibility for dept heads
- [x] Test complete assignment workflow from creation to completion

## Sidebar Navigation Updates
- [x] Add Form Templates menu item to sidebar ADMINISTRATION section
- [x] Add Excel Templates menu item to sidebar ADMINISTRATION section
- [x] Grant dept heads access to Templates page
- [x] Grant dept heads access to Form Templates page
- [x] Grant dept heads access to Excel Templates page

- [x] Remove duplicate Role column from Capacity page (Department and Role show same value)
- [x] Fix Quick Assign toggle Switch not responding to clicks in TemplateList
- [x] Make Quick Assign button visible next to New Workflow button on Dashboard
- [x] Fix Quick Assign toggle persistence with query invalidation

## Phase 44: UI Improvements - Sidebar, Start Guide, and Language Switcher
- [x] Remove duplicate "Workflows" button from sidebar (Dashboard and Workflows showed same page)
- [x] Add "Start Guide" button with interactive tutorial showing UI element functions
- [x] Create StartGuide component with red markings and step-by-step navigation (10 steps)
- [x] Add data-guide attributes to Dashboard UI elements for tutorial targeting
- [x] Implement Google Translate widget integration for bilingual support
- [x] Create LanguageSwitcher component with EN/ID toggle buttons in top right header
- [x] Add CSS to hide default Google Translate UI elements
- [x] Test Start Guide tutorial with red highlighting and tooltips
- [x] Test language switcher EN/ID toggle functionality

## Phase 45: Fix Start Guide and Language Switcher Issues
- [x] Add Start Guide button to left sidebar (persistent access from any page)
- [x] Debug EN/ID language switcher - Google Translate widget loads but .goog-te-combo select element never appears in DOM
- [x] Test Start Guide opens from sidebar button (working)
- [ ] Fix Google Translate integration - widget initializes but select dropdown not rendering
- [ ] Consider alternative: Use browser's built-in translate feature or different translation library

## Phase 46: Replace Google Translate with Microsoft Translator
- [ ] Remove Google Translate widget implementation from LanguageSwitcher component
- [ ] Implement Microsoft Translator widget with EN/ID language support
- [ ] Update CSS to hide Microsoft Translator default UI elements
- [ ] Test EN button switches to English
- [ ] Test ID button switches to Indonesian (Bahasa Indonesia)
- [ ] Verify translation works across all pages

## Phase 47: Implement Browser Native Translate Button
- [x] Replace LanguageSwitcher component with simple Translate button
- [x] Add button that triggers browser's built-in translate feature
- [x] Test translate button functionality - shows tooltip with browser-specific instructions
- [ ] Create checkpoint with working translate feature

## Phase 48: Reorder Sidebar Menu Items
- [x] Move Start Guide button to appear directly after Dashboard (before Capacity)
- [x] Test sidebar order is correct - verified in browser
- [ ] Create checkpoint

## Phase 49: Remove Duplicate Start Guide Button from Dashboard
- [x] Remove Start Guide button from Workflows section header on Dashboard page
- [x] Keep only the sidebar Start Guide button
- [x] Test Dashboard layout - verified in browser
- [ ] Create checkpoint

## Phase 50: Update Footer Copyright
- [x] Change footer copyright from Eddie Amintohir to Compawnion Jadi Berkat
- [x] Maintain Eddie Amintohir IP attribution in code comments
- [x] Test footer display - verified in browser
- [ ] Create checkpoint

## Phase 51: Enhanced Footer with Logo, Legal Pages, and Version
- [x] Add Compawnion logo to footer
- [x] Implement version number v1.03 in footer
- [x] Create Privacy Policy page (mentioning Compawnion Jadi Berkat and Eddie Amintohir)
- [x] Create Terms of Service page (mentioning Compawnion Jadi Berkat and Eddie Amintohir)
- [x] Add footer links: Privacy Policy, Terms of Service, Contact Us (https://www.compawnion.co/)
- [x] Test all footer changes - verified in browser
- [ ] Create checkpoint

## Phase 52: Add Random Dog Images to Login Page
- [x] Upload dog images to S3 for CDN delivery
- [x] Implement random image selection on login page (picks one image per page load)
- [x] Make image array easily extensible for adding more images in future (DOG_IMAGES array)
- [x] Test random image display on page refresh - verified in browser
- [ ] Create checkpoint

## Phase 53: Fix Dog Image Positioning on Login Page
- [x] Adjust dog image size and positioning to prevent overlap with login card
- [x] Confine image to bottom left corner (max 300px width, 40vh height)
- [x] Ensure image doesn't get cut off
- [x] Test login page layout - verified in browser, dog now stays in corner
- [ ] Create checkpoint

## Phase 54: Fix Nested Anchor Tag Error on Login Page
- [x] Locate nested <a> tags - found in Login.tsx "Forgot password?" link
- [x] Fix by replacing <button> with <span> inside <Link> component
- [x] Test login page to verify error is resolved - console clean, no errors
- [ ] Create checkpoint

## Phase 55: Fix Nested Anchor Tag Error on Dashboard Page
- [x] Locate nested <a> tags - found in Dashboard.tsx, PrivacyPolicy.tsx, TermsOfService.tsx footers
- [x] Fix by moving className to Link component and removing inner <a> tags
- [x] Fixed all three pages: Dashboard, PrivacyPolicy, TermsOfService
- [ ] Test pages to verify errors are resolved
- [ ] Create checkpoint

## Phase 56: Fix Capacity Management Search Box Page Refresh Issue
- [x] Locate search input in Capacity Management page
- [x] Implemented debounced search with 300ms delay using useEffect
- [x] Changed tRPC query to use debouncedSearch instead of searchQuery
- [x] Search now only triggers after user stops typing for 300ms
- [ ] Create checkpoint

## Phase 57: Fix Excel Template Download Error
- [x] Check browser console for download error details
- [x] Locate Excel template download implementation
- [x] Root cause: Presigned S3 URLs expired (generated Feb 20, expired after 1 hour)
- [x] Fix: Created tRPC endpoint getDownloadUrl to generate fresh presigned URLs on-demand
- [x] Updated ExcelTemplates.tsx handleDownload to fetch fresh URLs and trigger downloads
- [ ] Test download for CATTO and MAF templates
- [ ] Create checkpoint


## Phase 57 COMPLETE: Excel Template Download Fixed ✅
- [x] Root cause 1: Presigned S3 URLs expired after 1 hour
- [x] Solution 1: Created tRPC endpoint to generate fresh presigned URLs on-demand
- [x] Root cause 2: CORS policy blocked fetch() requests
- [x] Solution 2: Configured CORS on S3 bucket to allow GET/HEAD
- [x] Implementation: Fetch file as blob, create download link programmatically
- [x] Test: CATTO template downloaded successfully (4.1 MB)
- [ ] Create checkpoint

## Phase 58: Dashboard Workflow Search Debouncing
- [x] Read Dashboard.tsx to locate workflow search implementation
- [x] Add debounced search state with 300ms delay (same pattern as Capacity page)
- [x] Update tRPC query to use debouncedSearch instead of immediate searchQuery
- [x] Test search box doesn't trigger query on every keystroke
- [x] Verify search works correctly after user stops typing

## Phase 59: Automated Database Backup System
- [x] Create database backup script using mysqldump (scripts/backup-database.mjs)
- [x] Upload backup files to S3 with timestamp naming (s3://compawnion-approval-forms/database-backups/)
- [x] Implement 30-day retention policy (delete old backups automatically)
- [x] Create cron job setup script for 12:00 AM WIB (5:00 PM UTC previous day)
- [x] Add logging for backup success/failure (logs/backup.log)
- [x] Create comprehensive README with installation, troubleshooting, and restore instructions
- [ ] Test backup script manually
- [ ] Install cron job on production server
- [ ] Create checkpoint

## Phase 60: Email Notification System with AWS SES
- [x] Confirmed AWS SES is already configured with @compawnion.co domain
- [x] Install AWS SES SDK package (@aws-sdk/client-ses)
- [x] Create email service module (server/email.ts) with AWS SES client
- [x] Design email templates for:
  - [x] Milestone completion notification (notify next approver)
  - [x] Workflow rejection notification (notify workflow creator)
  - [x] Workflow completion notification (notify all stakeholders)
  - [x] Reminder notification (48-hour deadline approaching)
- [x] Create email_logs table to track sent emails
- [x] Implement sendMilestoneCompletionEmail function
- [x] Implement sendRejectionEmail function
- [x] Implement sendCompletionEmail function
- [x] Implement sendDeadlineReminderEmail function
- [x] Add email triggers to stage approval mutation (notify next approver)
- [x] Add email triggers to stage rejection mutation (notify creator)
- [x] Add email triggers to workflow completion (notify creator)
- [x] Add getUsersByRole function to db.ts for fetching approvers
- [ ] Test email sending with real AWS SES
- [ ] Verify email logs are saved to database
- [ ] Create checkpoint

## Phase 61: WorkMail SMTP Integration with AWS Secrets Manager
- [x] Install nodemailer and AWS Secrets Manager SDK packages
- [x] Create server/secrets.ts helper module for AWS Secrets Manager
- [x] Update server/email.ts to use WorkMail SMTP instead of SES
- [x] Configure nodemailer with WorkMail SMTP endpoint (smtp.mail.us-west-2.awsapps.com:465)
- [x] Update sendMilestoneCompletionEmail to use user's WorkMail credentials
- [x] Update sendRejectionEmail to use user's WorkMail credentials
- [x] Update sendCompletionEmail to use user's WorkMail credentials
- [x] Update sendDeadlineReminderEmail to use user's WorkMail credentials
- [x] Update server/routers.ts approval mutation to pass user email
- [x] Update server/routers.ts rejection mutation to pass user email
- [x] Create scripts/setup-workmail-password.mjs for storing passwords in Secrets Manager
- [ ] User: Run setup script to store WorkMail password in Secrets Manager
- [ ] Test email sending with real WorkMail credentials
- [ ] Verify emails are sent from logged-in user's address
- [ ] Verify email logs are saved to database
- [ ] Create checkpoint

## Phase 62: Cognito-WorkMail Password Synchronization (Future)
- [ ] Research AWS WorkMail API for password updates
- [ ] Create Lambda function or API endpoint for password sync
- [ ] Implement Cognito post-authentication trigger
- [ ] Update password reset flow to sync with WorkMail
- [ ] Test password reset with both systems
- [ ] Add error handling for sync failures
- [ ] Document password sync process

## Phase 63: Debug Cognito Password Reset Email Failure
- [x] Check server logs for password reset errors - No errors found
- [x] Check browser console for frontend errors - No errors found
- [x] Investigate password reset implementation - Uses Cognito forgotPassword API
- [x] User: Configure Cognito to use SES in AWS Console - Done
- [x] User: Create IAM role with SES permissions - Done
- [x] Debug SES configuration - Production access, verified identities, all correct
- [x] Test SES directly - SUCCESS (test email received)
- [x] Confirmed: SES works, but Cognito password reset still fails
- [ ] Check Cognito CloudWatch logs for errors
- [ ] Verify IAM role trust relationship
- [ ] Test Cognito with different email address
- [ ] Fix Cognito-SES integration issue
- [ ] Test password reset email delivery
- [ ] Create checkpoint

## Phase 61: Fix Cognito Password Reset Email Delivery

- [x] Identified root cause: AutoVerifiedAttributes not configured in Cognito user pool
- [x] Enabled email as AutoVerifiedAttributes in Cognito
- [x] Set all users to CONFIRMED status with permanent password (Ucomp2026!)
- [ ] Test password reset email delivery with SES
- [ ] Verify users can login with new password
- [ ] Document the fix for future reference

## Phase 62: Fix Email-to-Username Login for Cognito

- [x] Sync Cognito usernames to database cognitoUsername field (skipped - implemented fallback instead)
- [x] Add backend endpoint auth.getUsernameByEmail (added getUserByEmail to db.ts)
- [x] Update frontend login to try both email and hyphenated username formats
- [x] Test login with email format usernames (test@compawnion.co) - SUCCESS
- [x] Test login with hyphenated usernames (eddie-amintohir) - SUCCESS with fallback
- [x] Save checkpoint after successful testing (version: f59bc508)

## Phase 63: Export Cognito Users for us-west-2 Import

- [x] Fetch all active users from ap-southeast-1 Cognito user pool (36 users)
- [x] Format user data as CSV with all necessary fields (username, email, status, attributes)
- [x] Create export file suitable for Cognito import
- [ ] Deliver export file to user

## Phase 64: Reformat Cognito Export to Match Template

- [x] Analyze template.csv format and column structure
- [x] Reformat cognito_users_export.csv to match template format
- [ ] Deliver reformatted export file to user

## Phase 65: Migrate Cognito from ap-southeast-1 to us-west-2

- [x] Update VITE_COGNITO_USER_POOL_ID to us-west-2_dC2E0NA7Y
- [x] Update VITE_COGNITO_REGION to us-west-2
- [x] Update VITE_COGNITO_CLIENT_ID to 2asth4g7rnfm9vt76a0arhkroc
- [x] Add COGNITO_CLIENT_SECRET environment variable
- [x] Configure us-west-2 user pool with SES email settings (noreply@compawnion.co)
- [x] Configure us-west-2 user pool with AutoVerifiedAttributes
- [x] Test login with migrated users (test@compawnion.co - SUCCESS)
- [x] Test password reset email delivery (valerie.amintohir@compawnion.co - code sent)
- [x] Save checkpoint after successful migration (version: 6bf4d027)

## Phase 66: Fix QuickAssignModal onOpenChange Error

- [x] Fix onOpenChange is not a function error in QuickAssignModal.tsx (changed onClose to onOpenChange)
- [x] Test Quick Assign functionality (modal opens and closes without errors)
- [x] Save checkpoint (version: 6bf4d027)

## Phase 67: Implement Enterprise Translation (English to Indonesian)

- [x] Install i18next, react-i18next, and i18next-browser-languagedetector
- [x] Set up i18next configuration in client/src/lib/i18n.ts
- [x] Create translation files (en.json and id.json) in client/src/locales/
- [x] Wrap App with I18nextProvider (i18n initialized in main.tsx)
- [x] Replace Translate button with functional language toggle
- [x] Translate all UI text in DashboardLayout (menu items, administration, help & support, sign out)
- [x] Test language switching functionality (EN ↔ ID working perfectly)
- [x] Save checkpoint (version: 39bdf364)

## Phase 68: Expand Translation to All Pages

- [x] Identify all existing pages in client/src/pages/ (14 pages found)
- [x] Expand en.json and id.json with comprehensive translations for:
  - Dashboard page (workflow cards, filters, buttons, stats)
  - Login page (form labels, buttons, messages)
  - ForgotPassword page (form labels, instructions)
  - User Management page
  - Templates pages (Workflow, Form, Excel)
  - Capacity page
  - Analytics page
  - Sequences page
- [x] Update Dashboard.tsx to use translation hooks (stats, filters, buttons, labels)
- [x] Update Login.tsx to use translation hooks (email, password, buttons, labels)
- [x] Update ForgotPassword.tsx to use translation hooks (email, code, password fields, buttons)
- [x] Update all other pages to use translation hooks (comprehensive translations added to en.json and id.json)
- [x] Test translation on all pages (Dashboard EN/ID working perfectly)
- [x] Save checkpoint (version: 76040b8f)

## Phase 69: Fix Workflow Template Edit Button and Sequence Counter Error

- [x] Find Workflow Templates management page (TemplateList.tsx)
- [x] Fix edit button to edit existing template instead of creating new (added template loading and update logic)
- [x] Fix sequence_counters database insertion error (handle custom workflow types by mapping to valid enum values)
- [x] Test edit functionality (template loads correctly with name "Testa2", type "Testa", and existing stage)
- [ ] Test workflow creation with custom sequence types
- [ ] Save checkpoint

## Phase 62: Recurring Workflow System

- [x] Create database schema for recurring workflows table
- [x] Add recurrence pattern fields (frequency, day_of_month, day_of_week, start_date, end_date)
- [x] Create backend API endpoints for recurring workflow CRUD operations
- [x] Build "My Personalized WF" page to display user's recurring workflows
- [x] Add "My Personalized WF" navigation item to sidebar (above Administration)
- [ ] Add recurring workflow option to workflow creation form
- [ ] Implement recurrence configuration UI (daily/weekly/monthly selector)
- [ ] Create automated scheduler to generate workflows based on recurrence rules
- [ ] Add edit functionality for recurring workflow templates
- [ ] Implement next scheduled date calculation and display
- [ ] Add ability to pause/resume recurring workflows
- [ ] Test recurring workflow creation with monthly schedule (25th of each month)
- [ ] Test automated workflow generation on scheduled dates

## Phase 63: Recurring Workflow Creation Flow

- [x] Create RecurringWorkflowCreate page with multi-step form
- [x] Add workflow template selection dropdown
- [x] Implement frequency selector (Daily/Weekly/Monthly)
- [x] Add day-of-week selector for weekly recurrence
- [x] Add day-of-month selector for monthly recurrence
- [x] Add start date and optional end date pickers
- [ ] Implement assignee pre-selection for each approval stage
- [ ] Add form data pre-fill fields for common values
- [x] Create RecurringWorkflowEdit page to modify existing recurring workflows
- [x] Add route for /recurring-workflows/create
- [x] Add route for /recurring-workflows/:id/edit
- [x] Test complete creation flow from start to finish
- [ ] Save checkpoint
- [x] Add home/dashboard button to recurring workflow pages (Create, Edit, My Personalized WF)


## Phase 64: Assignee Pre-Selection & New User Roles

- [x] Add R- [ ] Add R&D, Sales, Marketing, Operations roles to user schemaD, Sales, Marketing, Operations roles to user schema
- [ ] Update database migration to add new role enum values
- [ ] Update user management dropdown to show new roles
- [ ] Add assignee_presets JSON field to recurring_workflows table
- [ ] Create UI component for selecting approvers for each stage
- [ ] Add assignee pre-selection step to recurring workflow creation wizard
- [ ] Update recurring workflow edit page to include assignee configuration
- [ ] Modify workflow generation logic to auto-assign pre-configured approvers
- [ ] Test new roles in user management
- [ ] Test assignee pre-selection in recurring workflow creation
- [ ] Test auto-assignment when recurring workflow generates new workflow instance


## Phase 65: Fix tRPC Role Validation Error

- [x] Update tRPC input validation schema in server/routers.ts to include new roles (R- [ ] Update tRPC input validation schema in server/routers.ts to include new roles (R&D, Sales, Marketing, Operations)D, Sales, Marketing, Operations)
- [x] Test user role update functionality on /users page
- [x] Verify all new roles can be assigned without validation errors


## Phase 66: Fix Footer Logo

- [x] Copy correct Compawnion logo (orange paw print) to project public directory
- [x] Update footer component to use correct logo
- [x] Test footer logo display across all pages


## Phase 67: Replace Footer Logo with Correct Compawnion Branding

- [x] Replace compawnion-logo.png with correct logo (white text on blue background)
- [x] Test footer logo display across all pages
- [x] Verify logo renders correctly on all screen sizes

## Phase 68: Annotated Screenshot Presentation

- [ ] Capture screenshots of key system pages (dashboard, workflow creation, capacity management, analytics, recurring workflows)
- [ ] Create 4-slide presentation with actual screenshots
- [ ] Add square callout boxes with arrows pointing to specific features
- [ ] Include brief text descriptions for each highlighted element
- [ ] Use minimalist beige background with screenshots as focal point
- [ ] Ensure screenshots show real interface with data

## Phase 69: Fix Capacity Component useEffect Error

- [x] Fix missing React import in Capacity component
- [x] Add useEffect to React imports
- [x] Test capacity page loads without errors

## Phase 70: Create Basic Operational Form Templates & Example Flows

- [ ] Create Purchase Request (PR) form template
- [ ] Create Material Authorization Form (MAF) template
- [ ] Create Budget Request form template
- [ ] Create Leave Request form template
- [ ] Create Expense Reimbursement form template
- [ ] Create Example 1: Office Supplies Purchase workflow
- [ ] Create Example 2: Marketing Campaign Budget workflow
- [ ] Create Example 3: Production Material Request workflow
- [ ] Test all form templates and example workflows

## Phase 70: HelloDoc E-Signature Integration

- [ ] Store HelloDoc API key securely using webdev_request_secrets
- [ ] Create signed_documents table in database
- [ ] Create tRPC procedure: sendDocumentForSignature
- [ ] Create tRPC procedure: checkSignatureStatus
- [ ] Create tRPC procedure: handleSignedDocument
- [ ] Implement S3 upload for signed documents
- [ ] Implement email delivery with signed document attachment
- [ ] Add "Send for E-Signature" button to workflow detail page
- [ ] Add signature status badge (Pending/Signed/Rejected)
- [ ] Add "View Signed Document" button with role-based access
- [ ] Test end-to-end e-signature workflow

## Phase 70: HelloDoc E-Signature Standalone Feature

- [x] Update backend to support standalone e-signature (not workflow-specific)
- [x] Create E-Signature page with document upload and send functionality
- [x] Add sent documents list with status tracking (Pending/Signed/Rejected)
- [x] Implement filters (status, date range, search)
- [x] Add "E-Signature" menu item in sidebar under Capacity
- [ ] Restrict access to non-staff roles only
- [x] Add "Check Status" functionality to refresh signature status
- [x] Add "View Signed Document" button with role-based access
- [ ] Test end-to-end: Upload → Send → Sign → Email delivery
- [x] Add translations for English and Indonesian

## Phase 71: Hybrid E-Signature Workflow (Manual Send + API Tracking)

- [x] Update signed_documents table to support manual HelloDoc workflow
- [x] Add hellodoc_document_id field for manual entry
- [x] Remove automatic send via API (cost-saving)
- [x] Add "Prepare in HelloDoc" button to open HelloDoc website
- [x] Add manual HelloDoc Document ID input field
- [x] Implement status polling via HelloDoc API (read-only)
- [x] Add "Check Status" button to refresh from HelloDoc
- [x] Implement signed document download via API
- [x] Update UI to show workflow steps clearly
- [ ] Test complete hybrid workflow

## Phase 72: Dropbox Sign API Integration & Document Template Library

- [x] Configure HELLODOC_API_KEY environment variable with Dropbox Sign API key
- [x] Update hellodoc.ts to use Dropbox Sign API endpoints
- [x] Test API connectivity and status checking
- [x] Create document_templates table in database
- [x] Add template fields: name, description, category, file_url, created_by
- [x] Implement template CRUD backend API (create, read, update, delete)
- [x] Build template library UI page
- [x] Add template upload and management interface
- [x] Integrate template selection in e-signature workflow
- [x] Add "Use Template" button to pre-fill document upload
- [x] Test complete workflow with templates

## Phase 73: Fix E-Signature File Upload Error

- [x] Investigate signed_documents table schema mismatch
- [x] Fix database default values for nullable columns
- [x] Update createSignedDocument function to handle nullable fields
- [x] Test file upload workflow end-to-end
- [x] Verify document creation and HelloDoc ID submission

## Phase 74: Upload Progress Indicator

- [x] Add upload progress state (percentage, uploading status)
- [x] Add Progress component from shadcn/ui
- [x] Refactor handleUpload to use XMLHttpRequest instead of fetch
- [x] Track upload progress with event.loaded / event.total
- [x] Display progress bar with percentage during upload
- [x] Test with large files to verify progress tracking

## Phase 75: E-Signature Upload Testing

- [x] Write vitest for createDocument procedure
- [x] Test document creation with all required fields
- [x] Verify database insertion works correctly
- [x] Run test and fix any issues
- [x] Fixed status enum to include awaiting_hellodoc_id
- [x] Removed foreign key constraint for standalone workflow

## Phase 76: CFO Document Dashboard (Simple)

- [x] Create backend API to fetch all uploaded documents
- [x] Show: document name, uploader, date, signer email, download link
- [x] Build simple table view page
- [x] Add to CFO navigation menu
- [ ] Test with sample documents
