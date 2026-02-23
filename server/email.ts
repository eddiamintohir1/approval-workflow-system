/**
 * Email Service - WorkMail SMTP Integration
 * 
 * Sends emails via AWS WorkMail SMTP using nodemailer
 * Each email is sent from the logged-in user's WorkMail address
 */

import nodemailer from 'nodemailer';
import { randomUUID } from 'crypto';
import { db } from './db';
import { emailLogs } from '../drizzle/schema';
import { getWorkmailPassword } from './secrets';

// WorkMail SMTP Configuration
const WORKMAIL_SMTP_HOST = 'smtp.mail.us-west-2.awsapps.com';
const WORKMAIL_SMTP_PORT = 465;
const WORKMAIL_SMTP_SECURE = true; // Use TLS

// Email template types
type EmailTemplate = 'milestone_completion' | 'workflow_rejection' | 'workflow_completion' | 'deadline_reminder';

/**
 * Create SMTP transporter for a specific user
 * @param userEmail User's WorkMail email address
 * @param userPassword User's WorkMail password (from Secrets Manager)
 */
function createUserTransporter(userEmail: string, userPassword: string) {
  return nodemailer.createTransport({
    host: WORKMAIL_SMTP_HOST,
    port: WORKMAIL_SMTP_PORT,
    secure: WORKMAIL_SMTP_SECURE,
    auth: {
      user: userEmail,
      pass: userPassword,
    },
    // Connection timeout and retry settings
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
}

/**
 * Send email and log to database
 * @param fromEmail Sender's email (logged-in user)
 * @param fromPassword Sender's WorkMail password
 * @param toEmail Recipient's email
 * @param subject Email subject
 * @param html Email HTML content
 * @param template Email template type
 * @param workflowId Related workflow ID (optional)
 */
async function sendEmail(
  fromEmail: string,
  fromPassword: string,
  toEmail: string,
  subject: string,
  html: string,
  template: EmailTemplate,
  workflowId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const logId = randomUUID();
  
  try {
    const transporter = createUserTransporter(fromEmail, fromPassword);
    
    const info = await transporter.sendMail({
      from: fromEmail, // Email sent from logged-in user's address
      to: toEmail,
      subject,
      html,
    });

    // Log successful email
    await db.insert(emailLogs).values({
      id: logId,
      recipientEmail: toEmail,
      subject,
      template,
      workflowId: workflowId || null,
      status: 'sent',
      messageId: info.messageId,
      sentAt: new Date(),
    });

    console.log(`✅ Email sent from ${fromEmail} to ${toEmail} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    // Log failed email
    await db.insert(emailLogs).values({
      id: logId,
      recipientEmail: toEmail,
      subject,
      template,
      workflowId: workflowId || null,
      status: 'failed',
      errorMessage: error.message,
      sentAt: new Date(),
    });

    console.error(`❌ Failed to send email from ${fromEmail} to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send milestone completion notification
 * Notifies the next approver that a milestone has been completed
 */
export async function sendMilestoneCompletionEmail(
  data: {
    workflowNumber: string;
    workflowTitle: string;
    milestoneName: string;
    approverName: string;
    approverEmail: string;
    workflowUrl: string;
    completedBy: string;
  },
  workflowId: string,
  senderEmail: string // Logged-in user's email
): Promise<void> {
  const senderPassword = await getWorkmailPassword(senderEmail);
  
  const subject = `[Action Required] ${data.workflowNumber}: ${data.milestoneName}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Action Required</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">Hello ${data.approverName},</p>
              
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">
                <strong>${data.completedBy}</strong> has completed a milestone in the workflow <strong>${data.workflowTitle}</strong>.
                Your approval is now required for the next stage.
              </p>
              
              <!-- Workflow Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Workflow Number:</strong> ${data.workflowNumber}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Title:</strong> ${data.workflowTitle}</p>
                    <p style="margin: 0; color: #666666; font-size: 14px;"><strong>Current Stage:</strong> ${data.milestoneName}</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.workflowUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Review Workflow</a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #666666; margin: 20px 0 0 0;">
                Please review and approve this workflow at your earliest convenience.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This is an automated notification from CJB Workflow Hub
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} Compawnion Jadi Berkat
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
  await sendEmail(senderEmail, senderPassword, data.approverEmail, subject, html, 'milestone_completion', workflowId);
}

/**
 * Send workflow rejection notification
 * Notifies the workflow creator that their workflow was rejected
 */
export async function sendRejectionEmail(
  data: {
    workflowNumber: string;
    workflowTitle: string;
    milestoneName: string;
    rejectedBy: string;
    rejectionReason: string;
    creatorName: string;
    creatorEmail: string;
    workflowUrl: string;
  },
  workflowId: string,
  senderEmail: string // Logged-in user's email (rejector)
): Promise<void> {
  const senderPassword = await getWorkmailPassword(senderEmail);
  
  const subject = `[Rejected] ${data.workflowNumber}: ${data.workflowTitle}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Workflow Rejected</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">Hello ${data.creatorName},</p>
              
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">
                Your workflow <strong>${data.workflowTitle}</strong> has been rejected by <strong>${data.rejectedBy}</strong> at the <strong>${data.milestoneName}</strong> stage.
              </p>
              
              <!-- Workflow Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff5f5; border-left: 4px solid #f5576c; margin: 20px 0; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Workflow Number:</strong> ${data.workflowNumber}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Title:</strong> ${data.workflowTitle}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Rejected Stage:</strong> ${data.milestoneName}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Rejected By:</strong> ${data.rejectedBy}</p>
                    <p style="margin: 0; color: #666666; font-size: 14px;"><strong>Reason:</strong></p>
                    <p style="margin: 10px 0 0 0; color: #333333; font-size: 14px; font-style: italic;">"${data.rejectionReason}"</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.workflowUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">View Workflow</a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #666666; margin: 20px 0 0 0;">
                Please review the rejection reason and make necessary adjustments before resubmitting.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This is an automated notification from CJB Workflow Hub
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} Compawnion Jadi Berkat
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
  await sendEmail(senderEmail, senderPassword, data.creatorEmail, subject, html, 'workflow_rejection', workflowId);
}

/**
 * Send workflow completion notification
 * Notifies the workflow creator that all stages are complete
 */
export async function sendCompletionEmail(
  data: {
    workflowNumber: string;
    workflowTitle: string;
    completedAt: string;
    recipientName: string;
    recipientEmail: string;
    workflowUrl: string;
  },
  workflowId: string,
  senderEmail: string // Logged-in user's email (final approver)
): Promise<void> {
  const senderPassword = await getWorkmailPassword(senderEmail);
  
  const subject = `[Completed] ${data.workflowNumber}: ${data.workflowTitle}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✓ Workflow Completed</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">Hello ${data.recipientName},</p>
              
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">
                Great news! Your workflow <strong>${data.workflowTitle}</strong> has been completed successfully.
                All approval stages have been finalized.
              </p>
              
              <!-- Workflow Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #38ef7d; margin: 20px 0; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Workflow Number:</strong> ${data.workflowNumber}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Title:</strong> ${data.workflowTitle}</p>
                    <p style="margin: 0; color: #666666; font-size: 14px;"><strong>Completed At:</strong> ${data.completedAt}</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.workflowUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">View Workflow</a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #666666; margin: 20px 0 0 0;">
                You can now proceed with the next steps for this workflow.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This is an automated notification from CJB Workflow Hub
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} Compawnion Jadi Berkat
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
  await sendEmail(senderEmail, senderPassword, data.recipientEmail, subject, html, 'workflow_completion', workflowId);
}

/**
 * Send deadline reminder notification
 * Warns approver that a workflow deadline is approaching (48 hours)
 */
export async function sendDeadlineReminderEmail(
  data: {
    workflowNumber: string;
    workflowTitle: string;
    milestoneName: string;
    dueDate: string;
    hoursRemaining: number;
    approverName: string;
    approverEmail: string;
    workflowUrl: string;
  },
  workflowId: string,
  senderEmail: string // System email or workflow creator
): Promise<void> {
  const senderPassword = await getWorkmailPassword(senderEmail);
  
  const subject = `[Reminder] ${data.workflowNumber}: Deadline Approaching (${data.hoursRemaining}h remaining)`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Deadline Reminder</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">Hello ${data.approverName},</p>
              
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">
                This is a friendly reminder that the workflow <strong>${data.workflowTitle}</strong> is approaching its deadline.
                Your approval is still pending.
              </p>
              
              <!-- Workflow Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-left: 4px solid #ffd200; margin: 20px 0; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Workflow Number:</strong> ${data.workflowNumber}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Title:</strong> ${data.workflowTitle}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Current Stage:</strong> ${data.milestoneName}</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;"><strong>Due Date:</strong> ${data.dueDate}</p>
                    <p style="margin: 0; color: #d97706; font-size: 16px; font-weight: 600;"><strong>Time Remaining:</strong> ${data.hoursRemaining} hours</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.workflowUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Review Now</a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #666666; margin: 20px 0 0 0;">
                Please review and approve this workflow as soon as possible to avoid delays.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This is an automated notification from CJB Workflow Hub
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} Compawnion Jadi Berkat
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
  await sendEmail(senderEmail, senderPassword, data.approverEmail, subject, html, 'deadline_reminder', workflowId);
}
