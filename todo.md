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
- [ ] Build form template builder for admins
- [ ] Create dynamic form renderer based on templates
- [ ] Implement form validation system
- [ ] Add file upload to AWS S3
- [ ] Implement form download functionality

## Phase 6: Sequence Generators
- [ ] Build SKU sequence generator with custom restrictions
- [ ] Build PAF sequence generator with custom restrictions
- [ ] Build MAF sequence generator with custom restrictions
- [ ] Implement CSV export for sequences
- [ ] Create sequence history tracking
- [ ] Add auto-generation on project creation

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
