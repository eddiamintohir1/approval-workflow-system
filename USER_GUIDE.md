# Approval Workflow Management System - User Guide

**Version 1.04** | **Last Updated: February 23, 2026**

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles and Permissions](#user-roles-and-permissions)
4. [Dashboard Overview](#dashboard-overview)
5. [Creating Workflows](#creating-workflows)
6. [Managing Workflow Templates](#managing-workflow-templates)
7. [Approving and Rejecting Workflows](#approving-and-rejecting-workflows)
8. [Document Management](#document-management)
9. [Sequence Generators](#sequence-generators)
10. [Capacity Management](#capacity-management)
11. [Email Notifications](#email-notifications)
12. [Language Settings](#language-settings)
13. [Troubleshooting](#troubleshooting)

---

## Introduction

The **Approval Workflow Management System** is a comprehensive platform designed for manufacturing and sales operations at Compawnion Jadi Berkat. The system enables multi-layer approval workflows with role-based access control, document storage, automated email notifications, and sequence number generation.

### Key Features

The system provides several core capabilities that streamline approval processes. **Multi-layer approval workflows** support various workflow types including Material Authorization Forms (MAF), Purchase Requests (PR), reimbursements, and custom workflow types. Each workflow progresses through defined approval stages with specific approvers assigned to each stage.

**Role-based access control** ensures that users can only access and approve workflows relevant to their organizational role. The system supports roles including CEO, COO, CFO, Executive Assistant, PPIC, Purchasing, General Affairs, Finance, Production, Logistics, and Staff. Each role has specific permissions and approval authority levels.

**Document storage and management** capabilities allow users to attach files to workflows at any stage. All documents are securely stored in Azure Blob Storage, with automatic organization by workflow ID. Users can upload multiple files per workflow, and all uploaded files are accessible to authorized approvers throughout the workflow lifecycle.

**Automated email notifications** keep all stakeholders informed of workflow progress. The system sends emails when workflows reach new approval stages, when workflows are approved or rejected, and when deadlines are approaching. All emails are sent from the noreply@compawnion.co address with professional formatting and direct links to the relevant workflows.

**Sequence number generation** provides automatic numbering for workflows, SKUs, PAFs, and MAFs. Each sequence type has configurable prefixes, formats, and restrictions. The system ensures no duplicate numbers are generated and maintains separate counters for each workflow type and date combination.

---

## Getting Started

### System Requirements

To access the Approval Workflow Management System, you need a modern web browser. The system is fully compatible with **Google Chrome** (version 90 or later), **Mozilla Firefox** (version 88 or later), **Microsoft Edge** (version 90 or later), and **Safari** (version 14 or later). A stable internet connection is required for real-time updates and document uploads.

### Accessing the System

The system is accessible at the designated company URL provided by your system administrator. All users must have a valid @compawnion.co Microsoft 365 account to access the system. Authentication is handled through Microsoft Entra ID single sign-on.

### First-Time Login

When you access the system for the first time, you will be directed to the login page. Click **Continue with Microsoft** and sign in with your **@compawnion.co Microsoft 365 account**. The application never stores or resets your password.

If you cannot remember your password, use Microsoft's **Can't access your account?** recovery flow from the login page. Recovery and verification are managed by Microsoft 365 according to the organization's security policies.

### Changing Your Password

For security reasons, it is strongly recommended to change your password after your first login. To change your password, click on your profile name in the top-right corner of the dashboard, then select **Profile Settings**. Navigate to the **Security** tab and click **Change Password**. Enter your current password, then enter and confirm your new password. Your new password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.

---

## User Roles and Permissions

The system implements a hierarchical role-based access control model. Each user is assigned one primary role that determines their permissions and approval authority.

### Role Hierarchy

**CEO (Chief Executive Officer)** has the highest level of authority in the system. CEOs can approve or reject any workflow at any stage, override previous approvals or rejections, access all workflows regardless of department, view system-wide analytics and reports, and manage user roles and permissions.

**COO (Chief Operating Officer)** has operational oversight authority. COOs can approve workflows in the final approval stages, access workflows across all operational departments, view operational analytics and capacity reports, and override approvals in emergency situations.

**CFO (Chief Financial Officer)** has financial oversight authority. CFOs can approve workflows involving financial commitments above certain thresholds, access all workflows with budget implications, view financial analytics and spending reports, and require financial justification for high-value workflows.

**Executive Assistant** provides administrative support to executives. Executive Assistants can create workflows on behalf of executives, view workflows assigned to their executives, receive notification copies for executive-assigned workflows, and manage workflow priorities and deadlines.

**PPIC (Production Planning and Inventory Control)** manages production planning workflows. PPIC users can create and approve MAF workflows, manage production capacity and scheduling, approve material requisitions, and coordinate between production and purchasing departments.

**Purchasing** handles procurement workflows. Purchasing users can create and approve PR workflows, manage vendor relationships and purchase orders, approve material purchases within their authority limits, and coordinate with PPIC for material requirements.

**GA (General Affairs)** manages general administrative workflows. GA users can approve facility-related requests, manage office supplies and equipment, approve travel and accommodation requests, and coordinate with other departments for administrative support.

**Finance** handles financial workflows and reimbursements. Finance users can approve expense reimbursements, verify budget allocations, process payment requests, and generate financial reports.

**Production** manages manufacturing workflows. Production users can create production-related workflows, report production completion status, request materials through MAF workflows, and update production capacity information.

**Logistics** manages shipping and delivery workflows. Logistics users can approve shipping requests, manage delivery schedules, coordinate with external carriers, and update delivery status information.

**Staff** represents general employees. Staff users can create workflows for their own requests, view the status of their submitted workflows, upload supporting documents, and receive notifications about their workflows.

**Admin** has system administration privileges. Admin users can manage user accounts and roles, configure system settings and workflow templates, access system logs and audit trails, and provide technical support to other users.

---

## Dashboard Overview

The dashboard is the central hub of the system where you can view, filter, and manage all workflows relevant to your role.

### Dashboard Layout

The dashboard consists of several key sections. The **top navigation bar** contains the Compawnion logo on the left, a language switcher (EN/ID) in the center, and your profile menu on the right. The **sidebar navigation** provides quick access to different sections including Dashboard, Workflow Templates, Form Templates, Excel Templates, User Management (admin only), Capacity Management, Analytics, Sequence Generators, and Help & Support.

The **main content area** displays the workflow list with filters and search functionality. The **footer** contains copyright information, links to Privacy Policy and Terms of Service, and a link to the company website.

### Workflow List

The workflow list displays all workflows you have permission to view. Each workflow card shows the workflow number, title, type, current status, requester name, department, submission date, and current approval stage.

Workflows are color-coded by status. **Draft** workflows appear in gray, **In Progress** workflows in blue, **Completed** workflows in green, **Rejected** workflows in red, **Cancelled** workflows in orange, **Discontinued** workflows in purple, and **Archived** workflows in gray with reduced opacity.

### Filtering Workflows

The dashboard provides multiple filtering options to help you find specific workflows quickly. The **search box** at the top allows you to search by workflow number, title, or requester name. As you type, the system automatically filters the workflow list with a 300-millisecond debounce to prevent excessive queries.

The **status filter** dropdown lets you filter workflows by their current status. You can select one or multiple statuses to narrow down the list. The **type filter** dropdown allows filtering by workflow type such as MAF, PR, Reimbursement, or custom types. The **department filter** shows workflows from specific departments.

The **date range filter** enables you to view workflows created within a specific time period. You can select preset ranges like "Last 7 days" or "Last 30 days", or choose a custom date range using the date picker.

The **"My Workflows" toggle** filters the list to show only workflows you created. The **"Assigned to Me" toggle** shows only workflows currently awaiting your approval. The **"Pinned" toggle** displays workflows you have marked as important.

To clear all filters and return to the full workflow list, click the **Clear Filters** button at the top of the filter section.

### Creating a New Workflow

To create a new workflow from the dashboard, click the **Create Workflow** button in the top-right corner of the main content area. This will open the workflow creation page where you can select a template and fill in the required information.

---

## Creating Workflows

Creating a workflow involves selecting a template, providing workflow details, and optionally attaching supporting documents.

### Step 1: Select a Workflow Template

On the workflow creation page, the first step is to select a workflow template. Click the **Workflow Template** dropdown to view all available templates. Templates are organized by type and display the template name followed by the workflow type in parentheses (e.g., "Material Authorization Form (MAF)").

Select the template that best matches your request. After selecting a template, a preview card will appear showing the template name, description, and number of approval stages. Click the **Preview** button to view the complete approval flow before proceeding.

### Step 2: Enter Workflow Details

After selecting a template, fill in the required workflow details. The **Workflow Title** field should contain a clear, descriptive title for your request. This title will be visible to all approvers and should summarize the purpose of the workflow.

The **Description** field is optional but recommended. Use this field to provide additional context, justification, or special instructions for approvers. You can include details about urgency, budget considerations, or any other relevant information.

### Step 3: Select Department

From the **Department** dropdown, select your department. This field is required and helps route the workflow to the appropriate approvers. Available departments include PPIC, Purchasing, GA (General Affairs), Finance, Production, Logistics, IT, HR, Marketing, Sales, and R&D.

### Step 4: Choose Form Template (Optional)

If your workflow requires structured data entry, you can select a **Form Template** from the dropdown. Form templates provide predefined fields for specific workflow types. For example, a MAF workflow might include fields for material name, quantity, unit price, and delivery date.

After selecting a form template, dynamic form fields will appear below. Fill in all required fields marked with an asterisk (\*). The system will validate your inputs and display error messages if any required fields are missing or contain invalid data.

### Step 5: Configure Pre-completion Contingency (Optional)

If your workflow depends on the completion of other workflows, enable the **Pre-completion Contingency** toggle. This feature prevents your workflow from being completed until specified prerequisite workflows are finished.

After enabling the toggle, a workflow selector will appear. Search for and select the workflows that must be completed first. You can add multiple prerequisite workflows. The system will automatically check the status of these workflows and prevent final approval until all prerequisites are marked as completed.

### Step 6: Review and Submit

Before submitting, review all entered information for accuracy. Ensure the workflow title clearly describes your request, all required fields are filled in, the correct department is selected, and any prerequisite workflows are properly configured.

When you are ready to submit, click the **Create Workflow** button at the bottom of the page. The system will validate your inputs, generate a unique workflow number, create the workflow record in the database, send email notifications to the first-stage approvers, and redirect you to the workflow detail page.

If there are any validation errors, they will be displayed at the top of the form. Correct the errors and try submitting again.

---

## Managing Workflow Templates

Workflow templates define the approval stages and routing logic for different types of workflows. Administrators can create, edit, and manage templates to match organizational approval processes.

### Viewing Templates

To view all workflow templates, click **Workflow Templates** in the sidebar navigation. The template management page displays a list of all available templates with their names, workflow types, number of stages, and creation dates.

Each template card shows a preview of the approval flow. Click on a template card to view detailed information including the complete stage-by-stage approval flow, assigned approvers for each stage, approval requirements (single approver vs. all approvers), and any special conditions or routing rules.

### Creating a New Template

To create a new workflow template, click the **Create Template** button at the top of the template management page. This opens the Template Builder interface.

In the Template Builder, start by entering the **Template Name** and **Description**. These should clearly identify the purpose and use case for the template. Next, select the **Workflow Type** from the dropdown. You can choose from predefined types (MAF, PR, Reimbursement) or create a custom type by typing a new name.

After setting the basic information, configure the approval stages. Click **Add Stage** to create a new approval stage. For each stage, enter a **Stage Name** (e.g., "Department Manager Approval", "Finance Review"), select the **Approver Role** from the dropdown, set the **Approval Requirement** (single approver or all approvers must approve), and optionally set a **Deadline** (number of days from workflow submission or previous stage completion).

You can add as many stages as needed for your approval process. Use the **Move Up** and **Move Down** buttons to reorder stages. The workflow will progress through stages in the order displayed.

After configuring all stages, click **Save Template** to create the template. The system will validate the template configuration and make it available for workflow creation.

### Editing an Existing Template

To edit a template, navigate to the template management page and click the **Edit** button on the template card. This opens the Template Builder with the template's current configuration loaded.

Make your desired changes to the template name, description, workflow type, or approval stages. You can add new stages, remove existing stages, or modify stage properties. When finished, click **Save Changes** to update the template.

**Important**: Editing a template does not affect existing workflows created from that template. Only new workflows created after the edit will use the updated template configuration.

### Deleting a Template

To delete a template, click the **Delete** button on the template card. A confirmation dialog will appear asking you to confirm the deletion. **Warning**: Deleting a template is permanent and cannot be undone. However, existing workflows created from the template will not be affected.

Templates that are currently in use by active workflows cannot be deleted. You must first complete or cancel all workflows using the template before deletion is allowed.

---

## Approving and Rejecting Workflows

When a workflow reaches an approval stage where you are assigned as an approver, you will receive an email notification and the workflow will appear in your "Assigned to Me" filter on the dashboard.

### Viewing Workflow Details

Click on a workflow card to open the workflow detail page. This page displays comprehensive information about the workflow including the workflow number and title, current status and approval stage, requester information and department, submission date and last update date, workflow description, attached documents, approval progress indicator, complete audit trail of all actions, and approval stage details with assigned approvers.

Review all information carefully before making an approval decision. Pay special attention to the workflow description, attached documents, and any comments from previous approvers.

### Uploading Supporting Documents

If you need to attach additional documents before approving, click the **Upload File** button in the approval stage section. A file picker dialog will open. Select one or more files from your computer and click **Open**. The system supports common file formats including PDF, Word documents, Excel spreadsheets, images (JPG, PNG), and compressed files (ZIP).

Files are uploaded to secure Azure Blob Storage and automatically associated with the workflow. All uploaded files are visible to subsequent approvers and can be downloaded at any time.

### Approving a Workflow

To approve a workflow, click the **Approve** button in the approval stage section. A confirmation dialog will appear. You can optionally add a comment explaining your approval decision or providing guidance for subsequent approvers.

After clicking **Confirm Approval**, the system will record your approval, update the workflow status, advance the workflow to the next stage (if applicable), send email notifications to the next stage approvers, and log the action in the audit trail.

If you are the final approver and all stages are complete, the workflow status will change to **Completed** and a completion email will be sent to the workflow creator.

### Rejecting a Workflow

To reject a workflow, click the **Reject** button in the approval stage section. A dialog will appear requiring you to provide a **Rejection Reason**. This field is mandatory and should clearly explain why the workflow is being rejected.

After entering the rejection reason and clicking **Confirm Rejection**, the system will record your rejection, update the workflow status to **Rejected**, send an email notification to the workflow creator with your rejection reason, and log the action in the audit trail.

Rejected workflows cannot be re-approved. The workflow creator must create a new workflow addressing the rejection reasons.

### Delegating Approval

If you need to delegate your approval authority to another user (for example, when you are on vacation), contact your system administrator. Administrators can temporarily reassign approval tasks to other users with appropriate authority levels.

---

## Document Management

The system provides secure document storage and management capabilities for all workflow-related files.

### Uploading Documents

Documents can be uploaded at any stage of the workflow lifecycle. To upload a document, open the workflow detail page and navigate to the relevant approval stage section. Click the **Upload File** button and select files from your computer.

The system supports multiple file uploads in a single operation. You can select multiple files by holding Ctrl (Windows) or Cmd (Mac) while clicking files in the file picker dialog.

**File Size Limits**: Individual files must be smaller than 100 MB. If you need to upload larger files, consider compressing them into a ZIP archive first.

**Supported File Types**: The system accepts most common file formats including PDF documents, Microsoft Office files (Word, Excel, PowerPoint), images (JPG, PNG, GIF, BMP), compressed archives (ZIP, RAR), and text files (TXT, CSV).

### Viewing and Downloading Documents

All documents attached to a workflow are listed in the **Uploaded Files** section of each approval stage. Each file entry shows the file name, file size, upload date and time, and the user who uploaded the file.

To download a document, click on the file name. The file will be downloaded to your browser's default download location. You can then open the file with the appropriate application on your computer.

### Document Security

All documents are stored in Azure Blob Storage with encryption at rest and in transit. Access to documents is controlled by the same role-based permissions as workflow access. Only users with permission to view a workflow can download its attached documents.

Documents are organized by workflow ID in the Azure Blob container, making it easy to locate all files related to a specific workflow. The system maintains a complete audit log of all document uploads and downloads.

---

## Sequence Generators

The system provides automatic sequence number generation for workflows, SKUs, PAFs, and MAFs. Sequence generators ensure unique numbering and can be configured with custom formats and restrictions.

### Accessing Sequence Generators

To access the sequence generator management page, click **Sequence Generators** in the sidebar navigation. This page displays all configured sequence types and their current counter values.

### Sequence Types

The system supports five sequence types. **MAF (Material Authorization Form)** generates numbers for material authorization workflows with the format WFMT-MAF-DDMMYY-NNN. **PR (Purchase Request)** generates numbers for purchase request workflows with the format WFMT-PR-DDMMYY-NNN. **CATTO** generates numbers for custom workflow types with the format WFMT-CATTO-DDMMYY-NNN. **SKU** generates product SKU numbers with the format SKU-YYYYMMDD-NNNN. **PAF** generates production authorization form numbers with the format PAF-YYYYMMDD-NNNN.

In these formats, DDMMYY represents the date in day-month-year format, YYYYMMDD represents the date in year-month-day format, and NNN or NNNN represents a zero-padded sequential number that resets daily.

### Viewing Sequence Status

The sequence generator page displays the current status of each sequence type including the last generated number, the date of the last generation, the total count of generated numbers, and the next number that will be generated.

This information helps administrators monitor sequence usage and identify any issues with number generation.

### Exporting Sequence Data

To export sequence data for reporting or backup purposes, click the **Export to CSV** button at the top of the sequence generator page. The system will generate a CSV file containing all sequence records including sequence type, workflow number, workflow ID, generation date, and workflow status.

The CSV file can be opened in Excel or any spreadsheet application for further analysis.

### Sequence Configuration (Admin Only)

Administrators can configure sequence generator settings including the number format and prefix, the starting number for new sequences, whether to reset counters daily or monthly, and any restrictions on sequence generation.

To modify sequence settings, click the **Configure** button next to a sequence type. Make your desired changes and click **Save Configuration**. Changes will take effect immediately for newly generated numbers.

---

## Capacity Management

The Capacity Management module helps track production capacity, resource allocation, and workload distribution across departments.

### Accessing Capacity Management

Click **Capacity Management** in the sidebar navigation to open the capacity management page. This page displays capacity information for all departments and production lines.

### Viewing Capacity Data

The capacity management page shows several key metrics. **Current Utilization** displays the percentage of capacity currently in use. **Available Capacity** shows the remaining capacity available for new workflows. **Scheduled Workflows** lists all workflows scheduled for production. **Resource Allocation** shows how resources are distributed across different workflow types.

Capacity data is updated in real-time as workflows are created, approved, and completed. This ensures that capacity information is always current and accurate.

### Filtering Capacity Data

Use the filters at the top of the page to view capacity data for specific departments, date ranges, or workflow types. The search box allows you to quickly find specific production lines or resources.

### Capacity Alerts

The system automatically generates alerts when capacity utilization exceeds certain thresholds. **Yellow alerts** appear when utilization reaches 80%, indicating that capacity is becoming constrained. **Red alerts** appear when utilization reaches 95%, indicating that capacity is nearly exhausted.

When capacity alerts are active, administrators receive email notifications and can take action to rebalance workloads or adjust production schedules.

---

## Email Notifications

The system sends automated email notifications to keep all stakeholders informed of workflow progress and required actions.

### Notification Types

The system sends four types of email notifications. **Milestone Completion** notifications are sent when a workflow stage is completed and advances to the next stage. These emails are sent to the approvers assigned to the next stage, informing them that a workflow requires their attention.

**Workflow Rejection** notifications are sent when a workflow is rejected by an approver. These emails are sent to the workflow creator and include the rejection reason provided by the approver.

**Workflow Completion** notifications are sent when all approval stages are completed and the workflow is marked as finished. These emails are sent to the workflow creator, confirming successful completion.

**Deadline Reminder** notifications are sent 48 hours before an approval deadline. These emails are sent to assigned approvers who have not yet taken action, reminding them of the pending deadline.

### Email Content

All notification emails include the workflow number and title, current status and approval stage, requester name and department, a brief description of the required action, and a direct link to the workflow detail page.

Emails are formatted with professional HTML templates featuring the company logo, color-coded headers based on notification type, and clear call-to-action buttons.

### Email Delivery

All emails are sent from **noreply@compawnion.co** using Microsoft Graph and Exchange Online. Email delivery is typically completed within seconds of the triggering event.

If you do not receive expected email notifications, check your spam or junk mail folder. Add noreply@compawnion.co to your email contacts or safe sender list to ensure future emails are delivered to your inbox.

### Email Logs

The system maintains a complete log of all sent emails including recipient email address, subject line, notification type, delivery status (sent or failed), timestamp, and any error messages.

Administrators can access email logs from the system administration panel to troubleshoot delivery issues or verify that notifications were sent correctly.

---

## Language Settings

The system supports multiple languages to accommodate users with different language preferences. Currently, English and Indonesian are fully supported.

### Changing Language

To change the system language, click the language switcher dropdown in the top navigation bar. Select your preferred language from the list. The system interface will immediately update to display all text in the selected language.

Your language preference is saved in your browser's local storage and will persist across sessions. You do not need to change the language setting each time you log in.

### Supported Languages

**English (EN)** is the default language and includes all system text, navigation menus, form labels, button text, status messages, and help documentation.

**Indonesian (ID)** provides complete translation of all user interface elements. Technical terms are translated with commonly accepted Indonesian equivalents, and date formats are localized to Indonesian conventions.

### Translation Coverage

The translation system covers all major sections of the application including the dashboard and workflow list, login and authentication pages, workflow creation and detail pages, template management, user management, capacity management, analytics, sequence generators, and help and support pages.

Dynamic content such as toast notifications, error messages, and validation messages are also translated. Workflow-specific content like workflow titles and descriptions remain in the language entered by the workflow creator.

---

## Troubleshooting

This section provides solutions to common issues you may encounter while using the system.

### Login Issues

**Problem**: Cannot log in with email and password.

**Solution**: Verify that you are using your full @compawnion.co email address. Check that Caps Lock is not enabled, as passwords are case-sensitive. If you have forgotten your password, click the "Forgot Password" link on the login page. If the issue persists, contact your system administrator to verify that your account is active and not locked.

**Problem**: Password reset email not received.

**Solution**: Check your spam or junk mail folder for emails from noreply@compawnion.co. Verify that your email address is correct in the system. Wait a few minutes, as email delivery may be delayed. If you still do not receive the email after 10 minutes, contact your system administrator.

### Workflow Creation Issues

**Problem**: Cannot create workflow - validation errors appear.

**Solution**: Ensure all required fields marked with an asterisk (\*) are filled in. Check that the workflow title is not empty and does not exceed 500 characters. Verify that a department is selected. If using a form template, ensure all required form fields are completed. Review any specific error messages displayed and correct the indicated fields.

**Problem**: Workflow template not appearing in dropdown.

**Solution**: Verify that workflow templates have been created by an administrator. Check that you have permission to create workflows of the desired type. Refresh the page to reload the template list. If templates still do not appear, contact your system administrator.

### Approval Issues

**Problem**: Cannot approve workflow - button is disabled.

**Solution**: Verify that the workflow is in a stage where you are assigned as an approver. Check that you have the appropriate role and permissions to approve this workflow type. Ensure that any required documents have been uploaded. If the workflow has a pre-completion contingency, verify that all prerequisite workflows are completed. Refresh the page to ensure you have the latest workflow status.

**Problem**: Approval action not reflected in workflow status.

**Solution**: Wait a few seconds and refresh the page, as status updates may take a moment to propagate. Check the audit trail to confirm that your approval was recorded. If your approval does not appear in the audit trail, try approving again. If the issue persists, contact your system administrator.

### Document Upload Issues

**Problem**: Cannot upload documents - upload fails.

**Solution**: Check that your file size does not exceed 100 MB. Verify that your file type is supported (PDF, Word, Excel, images, ZIP). Ensure you have a stable internet connection. Try uploading a smaller file or compressing large files into a ZIP archive. Clear your browser cache and try again. If uploads continue to fail, contact your system administrator.

**Problem**: Uploaded document not appearing in file list.

**Solution**: Refresh the page to reload the file list. Check that the upload completed successfully and did not show an error message. Verify that you uploaded the file to the correct workflow. If the file still does not appear, try uploading again.

### Email Notification Issues

**Problem**: Not receiving email notifications.

**Solution**: Check your spam or junk mail folder for emails from noreply@compawnion.co. Add noreply@compawnion.co to your email contacts or safe sender list. Verify that your email address is correct in your user profile. Check with your Microsoft 365 administrator that Exchange Online delivery is not being blocked. If you still do not receive emails, contact your system administrator to check the email logs.

### Performance Issues

**Problem**: System is slow or unresponsive.

**Solution**: Check your internet connection speed and stability. Close unnecessary browser tabs to free up memory. Clear your browser cache and cookies. Try using a different web browser. If the issue affects all users, contact your system administrator as there may be a server-side issue.

### Browser Compatibility Issues

**Problem**: System features not working correctly in my browser.

**Solution**: Verify that you are using a supported browser (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+). Update your browser to the latest version. Disable browser extensions that may interfere with the system. Try accessing the system in an incognito or private browsing window. If issues persist, try a different browser.

---

## Getting Help

If you encounter issues not covered in this guide or need additional assistance, several support resources are available.

### Help & Support Page

Click **Help & Support** in the sidebar navigation to access the built-in help system. This page provides quick answers to frequently asked questions, video tutorials for common tasks, links to additional documentation, and contact information for technical support.

### Contacting Support

For technical support, email your system administrator or IT support team. Include the following information in your support request: your name and email address, a detailed description of the issue, the workflow number (if applicable), any error messages displayed, the steps you took before the issue occurred, and your browser type and version.

Support requests are typically responded to within 24 hours during business days.

### Company Website

For general information about Compawnion Jadi Berkat, visit the company website at **https://www.compawnion.co/**. The website provides information about company services, contact information, and additional resources.

---

## Appendix: Keyboard Shortcuts

The system supports several keyboard shortcuts to improve efficiency.

**Ctrl+K** or **Cmd+K**: Open quick search  
**Ctrl+N** or **Cmd+N**: Create new workflow  
**Ctrl+F** or **Cmd+F**: Focus search box  
**Esc**: Close open dialogs or modals  
**Tab**: Navigate between form fields  
**Enter**: Submit forms or confirm actions

---

## Legal Information

### Privacy Policy

Your privacy is important to us. The system collects and processes personal information in accordance with applicable data protection regulations. For detailed information about data collection, usage, and protection, please review the **Privacy Policy** accessible from the footer of any page.

### Terms of Service

By using the Approval Workflow Management System, you agree to comply with the **Terms of Service**. These terms govern your use of the system and outline your rights and responsibilities. The Terms of Service are accessible from the footer of any page.

---

**Copyright © 2026 Compawnion Jadi Berkat. All rights reserved.**

_This system was developed by Eddie Amintohir. All intellectual property rights belong to the respective owners._
