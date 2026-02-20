/**
 * Workflow Reminder Scheduler
 * Sends daily reminders at 8 AM for pending workflows
 */

import cron from "node-cron";
import * as db from "./db";
import { sendWorkflowReminder, getWorkflowUrl } from "./emailService";

/**
 * Get pending workflows that need reminders
 */
async function getPendingWorkflows() {
  const workflows = await db.getAllWorkflows();
  
  // Filter workflows that are in_progress
  return workflows.filter(w => w.overallStatus === "in_progress");
}

/**
 * Get last actor for a workflow (person who took the last action)
 */
async function getLastActor(workflowId: string) {
  const approvals = await db.getApprovalsByWorkflow(workflowId);
  
  if (approvals.length === 0) {
    return null;
  }
  
  // Sort by timestamp descending to get the most recent approval
  const sortedApprovals = approvals.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const lastApproval = sortedApprovals[0];
  
  // Get user details
  const user = await db.getUserById(lastApproval.approverId);
  return user;
}

/**
 * Get current pending stage and approvers for a workflow
 */
async function getPendingStageInfo(workflowId: string) {
  const stages = await db.getStagesByWorkflow(workflowId);
  
  // Find the first stage that's pending
  const pendingStage = stages.find(s => s.status === "pending");
  
  if (!pendingStage) {
    return null;
  }
  
  // Get users with the required role
  const users = await db.getAllUsers();
  const approvers = users.filter(u => u.role === pendingStage.requiredRole);
  
  return {
    stage: pendingStage,
    approvers,
  };
}

/**
 * Send reminders for all pending workflows
 */
export async function sendDailyReminders() {
  console.log("📧 Starting daily workflow reminders...");
  
  try {
    const pendingWorkflows = await getPendingWorkflows();
    console.log(`Found ${pendingWorkflows.length} pending workflows`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    for (const workflow of pendingWorkflows) {
      try {
        // Get last actor (sender)
        const lastActor = await getLastActor(workflow.id);
        if (!lastActor) {
          console.log(`⚠️  No last actor found for workflow ${workflow.id}, skipping`);
          continue;
        }
        
        // Get pending stage and approvers (recipients)
        const pendingInfo = await getPendingStageInfo(workflow.id);
        if (!pendingInfo || pendingInfo.approvers.length === 0) {
          console.log(`⚠️  No pending approvers for workflow ${workflow.id}, skipping`);
          continue;
        }
        
        // Send reminder email
        const recipientEmails = pendingInfo.approvers.map(u => u.email);
        const success = await sendWorkflowReminder({
          fromEmail: lastActor.email,
          fromName: lastActor.fullName,
          toEmails: recipientEmails,
          workflowTitle: workflow.title,
          workflowId: workflow.id,
          workflowType: workflow.workflowType,
          currentStage: pendingInfo.stage.stageName,
          actionRequired: pendingInfo.stage.stageType === "approval" ? "Approval Required" : "Review Required",
          workflowUrl: getWorkflowUrl(workflow.id),
        });
        
        if (success) {
          sentCount++;
          console.log(`✅ Reminder sent for workflow: ${workflow.title}`);
        } else {
          failedCount++;
          console.log(`❌ Failed to send reminder for workflow: ${workflow.title}`);
        }
        
      } catch (error) {
        failedCount++;
        console.error(`❌ Error processing workflow ${workflow.id}:`, error);
      }
    }
    
    console.log(`📊 Daily reminders complete: ${sentCount} sent, ${failedCount} failed`);
    
  } catch (error) {
    console.error("❌ Error in daily reminders:", error);
  }
}

/**
 * Start the reminder scheduler
 * Runs every day at 8:00 AM (Asia/Jakarta timezone)
 */
export function startReminderScheduler() {
  // Cron expression: "0 8 * * *" = Every day at 8:00 AM
  // Timezone: Asia/Jakarta (GMT+7)
  const cronExpression = "0 8 * * *";
  
  cron.schedule(cronExpression, async () => {
    console.log("⏰ Triggered daily workflow reminders at 8:00 AM");
    await sendDailyReminders();
  }, {
    timezone: "Asia/Jakarta"
  });
  
  console.log("✅ Reminder scheduler started: Daily at 8:00 AM Asia/Jakarta");
}

/**
 * Manual trigger for testing (can be called via API endpoint)
 */
export async function triggerRemindersNow() {
  console.log("🔧 Manual trigger: Sending reminders now");
  await sendDailyReminders();
}
