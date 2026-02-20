/**
 * AWS SES Email Service
 * Sends emails via AWS SES with dynamic sender based on workflow actor
 */

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface EmailOptions {
  from: string; // Email address of the sender (must be verified in SES)
  to: string[]; // Array of recipient email addresses
  subject: string;
  htmlBody: string;
  textBody?: string; // Optional plain text version
}

/**
 * Send email via AWS SES
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const command = new SendEmailCommand({
      Source: options.from,
      Destination: {
        ToAddresses: options.to,
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: options.htmlBody,
            Charset: "UTF-8",
          },
          ...(options.textBody && {
            Text: {
              Data: options.textBody,
              Charset: "UTF-8",
            },
          }),
        },
      },
    });

    const response = await sesClient.send(command);
    console.log(`✅ Email sent successfully:`, {
      messageId: response.MessageId,
      from: options.from,
      to: options.to,
      subject: options.subject,
    });
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email:`, error);
    return false;
  }
}

/**
 * Send workflow reminder email
 * Uses the last actor's email as the sender
 */
export async function sendWorkflowReminder(params: {
  fromEmail: string; // Last actor's email (e.g., eddie.amintohir@compawnion.co)
  fromName: string; // Last actor's name
  toEmails: string[]; // Recipients
  workflowTitle: string;
  workflowId: string;
  workflowType: string;
  currentStage: string;
  actionRequired: string;
  workflowUrl: string;
}): Promise<boolean> {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .workflow-details {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      min-width: 140px;
      color: #6b7280;
    }
    .detail-value {
      color: #111827;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .alert {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 24px;">Workflow Reminder</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Action Required</p>
  </div>
  
  <div class="content">
    <p>Hello,</p>
    
    <p>This is a reminder that the following workflow requires your attention:</p>
    
    <div class="workflow-details">
      <div class="detail-row">
        <div class="detail-label">Workflow Title:</div>
        <div class="detail-value"><strong>${params.workflowTitle}</strong></div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Workflow Type:</div>
        <div class="detail-value">${params.workflowType}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Current Stage:</div>
        <div class="detail-value">${params.currentStage}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Action Required:</div>
        <div class="detail-value"><strong>${params.actionRequired}</strong></div>
      </div>
    </div>
    
    <div class="alert">
      <strong>⏰ Daily Reminder</strong><br>
      This workflow is pending your review or approval. Please take action at your earliest convenience.
    </div>
    
    <div style="text-align: center;">
      <a href="${params.workflowUrl}" class="button">View Workflow</a>
    </div>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      If you have any questions, please contact the workflow requester or your supervisor.
    </p>
  </div>
  
  <div class="footer">
    <p>This is an automated reminder from the Approval Workflow System.</p>
    <p style="margin-top: 10px;">
      Sent by ${params.fromName} via Approval Workflow System<br>
      © ${new Date().getFullYear()} Compawnion. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;

  const textBody = `
Workflow Reminder - Action Required

Hello,

This is a reminder that the following workflow requires your attention:

Workflow Title: ${params.workflowTitle}
Workflow Type: ${params.workflowType}
Current Stage: ${params.currentStage}
Action Required: ${params.actionRequired}

View Workflow: ${params.workflowUrl}

This workflow is pending your review or approval. Please take action at your earliest convenience.

If you have any questions, please contact the workflow requester or your supervisor.

---
This is an automated reminder from the Approval Workflow System.
Sent by ${params.fromName} via Approval Workflow System
© ${new Date().getFullYear()} Compawnion. All rights reserved.
  `;

  return await sendEmail({
    from: `${params.fromName} <${params.fromEmail}>`,
    to: params.toEmails,
    subject: `Workflow Reminder: ${params.workflowTitle} - Action Required`,
    htmlBody,
    textBody,
  });
}

/**
 * Get workflow URL for email links
 */
export function getWorkflowUrl(workflowId: string): string {
  const baseUrl = process.env.VITE_APP_URL || "https://approval-workflow-system.manus.space";
  return `${baseUrl}/workflows/${workflowId}`;
}
