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
