/**
 * Email Notification Service using AWS SES
 * 
 * Sends workflow notifications for:
 * - Milestone completion (notify next approver)
 * - Workflow rejection (notify creator)
 * - Workflow completion (notify all stakeholders)
 * - Reminder notifications (deadline approaching)
 * 
 * Copyright © Compawnion Jadi Berkat
 * IP: Eddie Amintohir
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { db } from './db';
import { emailLogs } from '../drizzle/schema';

// AWS SES Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-west-2';
const FROM_EMAIL = 'noreply@compawnion.co';
const FROM_NAME = 'CJB Workflow Hub';

// Create SES client
const sesClient = new SESClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Email template types
 */
export type EmailTemplate = 
  | 'milestone_completion'
  | 'workflow_rejection'
  | 'workflow_completion'
  | 'deadline_reminder';

/**
 * Email data for milestone completion
 */
interface MilestoneCompletionData {
  workflowNumber: string;
  workflowTitle: string;
  milestoneName: string;
  approverName: string;
  approverEmail: string;
  workflowUrl: string;
  completedBy: string;
}

/**
 * Email data for workflow rejection
 */
interface WorkflowRejectionData {
  workflowNumber: string;
  workflowTitle: string;
  milestoneName: string;
  rejectedBy: string;
  rejectionReason: string;
  creatorName: string;
  creatorEmail: string;
  workflowUrl: string;
}

/**
 * Email data for workflow completion
 */
interface WorkflowCompletionData {
  workflowNumber: string;
  workflowTitle: string;
  completedAt: string;
  recipientName: string;
  recipientEmail: string;
  workflowUrl: string;
}

/**
 * Email data for deadline reminder
 */
interface DeadlineReminderData {
  workflowNumber: string;
  workflowTitle: string;
  milestoneName: string;
  deadline: string;
  approverName: string;
  approverEmail: string;
  workflowUrl: string;
}

/**
 * Generate HTML email template for milestone completion
 */
function generateMilestoneCompletionEmail(data: MilestoneCompletionData): { subject: string; html: string } {
  return {
    subject: `Action Required: Approve ${data.workflowNumber} - ${data.workflowTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066FF 0%, #00CCFF 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Approval Required</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                Hello <strong>${data.approverName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                A workflow milestone has been completed and requires your approval.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Workflow ID</p>
                    <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">${data.workflowNumber}</p>
                    
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Workflow Title</p>
                    <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">${data.workflowTitle}</p>
                    
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Milestone</p>
                    <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">${data.milestoneName}</p>
                    
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Completed By</p>
                    <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${data.completedBy}</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; text-align: center;">
                <a href="${data.workflowUrl}" style="display: inline-block; background: linear-gradient(135deg, #0066FF 0%, #00CCFF 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Review & Approve</a>
              </p>
              
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                Please review the workflow and provide your approval or feedback.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                This is an automated notification from CJB Workflow Hub<br>
                © ${new Date().getFullYear()} Compawnion Jadi Berkat. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}

/**
 * Generate HTML email template for workflow rejection
 */
function generateRejectionEmail(data: WorkflowRejectionData): { subject: string; html: string } {
  return {
    subject: `Workflow Rejected: ${data.workflowNumber} - ${data.workflowTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Workflow Rejected</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                Hello <strong>${data.creatorName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                Your workflow has been rejected and requires revision.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-left: 4px solid #DC2626; border-radius: 6px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Workflow ID</p>
                    <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">${data.workflowNumber}</p>
                    
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Workflow Title</p>
                    <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">${data.workflowTitle}</p>
                    
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Rejected At</p>
                    <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">${data.milestoneName}</p>
                    
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Rejected By</p>
                    <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">${data.rejectedBy}</p>
                    
                    <p style="margin: 0 0 10px; color: #DC2626; font-size: 14px; font-weight: 600;">Reason for Rejection</p>
                    <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.5;">${data.rejectionReason}</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; text-align: center;">
                <a href="${data.workflowUrl}" style="display: inline-block; background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">View Workflow</a>
              </p>
              
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                Please review the rejection reason and make necessary revisions before resubmitting.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                This is an automated notification from CJB Workflow Hub<br>
                © ${new Date().getFullYear()} Compawnion Jadi Berkat. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}

/**
 * Generate HTML email template for workflow completion
 */
function generateCompletionEmail(data: WorkflowCompletionData): { subject: string; html: string } {
  return {
    subject: `Workflow Completed: ${data.workflowNumber} - ${data.workflowTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10B981 0%, #34D399 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">✓ Workflow Completed</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                Hello <strong>${data.recipientName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                Great news! A workflow has been successfully completed.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #10B981; border-radius: 6px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Workflow ID</p>
                    <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">${data.workflowNumber}</p>
                    
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Workflow Title</p>
                    <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">${data.workflowTitle}</p>
                    
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Completed At</p>
                    <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${data.completedAt}</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; text-align: center;">
                <a href="${data.workflowUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #34D399 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">View Workflow</a>
              </p>
              
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                All approval milestones have been completed successfully.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                This is an automated notification from CJB Workflow Hub<br>
                © ${new Date().getFullYear()} Compawnion Jadi Berkat. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}

/**
 * Generate HTML email template for deadline reminder
 */
function generateDeadlineReminderEmail(data: DeadlineReminderData): { subject: string; html: string } {
  return {
    subject: `Reminder: Approval Deadline Approaching - ${data.workflowNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">⏰ Deadline Reminder</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                Hello <strong>${data.approverName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                This is a friendly reminder that an approval deadline is approaching.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-left: 4px solid #F59E0B; border-radius: 6px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Workflow ID</p>
                    <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">${data.workflowNumber}</p>
                    
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Workflow Title</p>
                    <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">${data.workflowTitle}</p>
                    
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Milestone</p>
                    <p style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">${data.milestoneName}</p>
                    
                    <p style="margin: 0 0 10px; color: #F59E0B; font-size: 14px; font-weight: 600;">Deadline</p>
                    <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 600;">${data.deadline}</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; text-align: center;">
                <a href="${data.workflowUrl}" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Review Now</a>
              </p>
              
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                Please complete your review before the deadline to avoid delays.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                This is an automated notification from CJB Workflow Hub<br>
                © ${new Date().getFullYear()} Compawnion Jadi Berkat. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}

/**
 * Send email via AWS SES
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  template: EmailTemplate,
  workflowId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const command = new SendEmailCommand({
      Source: `${FROM_NAME} <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const response = await sesClient.send(command);
    const messageId = response.MessageId || 'unknown';

    // Log email to database
    await db.insert(emailLogs).values({
      id: crypto.randomUUID(),
      recipientEmail: to,
      subject,
      template,
      workflowId: workflowId || null,
      status: 'sent',
      messageId,
      sentAt: new Date(),
    });

    console.log(`[Email] Sent ${template} to ${to} (MessageId: ${messageId})`);
    return { success: true, messageId };
  } catch (error: any) {
    console.error(`[Email] Failed to send ${template} to ${to}:`, error);

    // Log failed email to database
    await db.insert(emailLogs).values({
      id: crypto.randomUUID(),
      recipientEmail: to,
      subject,
      template,
      workflowId: workflowId || null,
      status: 'failed',
      errorMessage: error.message || 'Unknown error',
      sentAt: new Date(),
    });

    return { success: false, error: error.message };
  }
}

/**
 * Send milestone completion notification
 */
export async function sendMilestoneCompletionEmail(data: MilestoneCompletionData, workflowId: string) {
  const { subject, html } = generateMilestoneCompletionEmail(data);
  return sendEmail(data.approverEmail, subject, html, 'milestone_completion', workflowId);
}

/**
 * Send workflow rejection notification
 */
export async function sendRejectionEmail(data: WorkflowRejectionData, workflowId: string) {
  const { subject, html } = generateRejectionEmail(data);
  return sendEmail(data.creatorEmail, subject, html, 'workflow_rejection', workflowId);
}

/**
 * Send workflow completion notification
 */
export async function sendCompletionEmail(data: WorkflowCompletionData, workflowId: string) {
  const { subject, html } = generateCompletionEmail(data);
  return sendEmail(data.recipientEmail, subject, html, 'workflow_completion', workflowId);
}

/**
 * Send deadline reminder notification
 */
export async function sendDeadlineReminderEmail(data: DeadlineReminderData, workflowId: string) {
  const { subject, html } = generateDeadlineReminderEmail(data);
  return sendEmail(data.approverEmail, subject, html, 'deadline_reminder', workflowId);
}
