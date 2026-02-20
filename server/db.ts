import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, and, desc, sql } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import { randomUUID } from "crypto";

// Re-export types for convenience
export type User = schema.User;
export type Workflow = schema.Workflow;
export type WorkflowStage = schema.WorkflowStage;
export type WorkflowApproval = schema.WorkflowApproval;
export type WorkflowFile = schema.WorkflowFile;
export type WorkflowComment = schema.WorkflowComment;
export type AuditLog = schema.AuditLog;
export type EmailRecipient = schema.EmailRecipient;
export type SequenceCounter = schema.SequenceCounter;

// Database connection
const connection = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});
export const db = drizzle(connection, { schema, mode: "default" });

// ============================================
// User Management
// ============================================

export async function upsertUser(user: {
  cognitoSub: string;
  openId: string;
  email: string;
  fullName: string;
  department?: string;
  role?: typeof schema.users.$inferSelect.role;
  cognitoGroups?: string[];
}): Promise<schema.User> {
  // Check if user exists by cognito_sub
  const [existingUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.cognitoSub, user.cognitoSub))
    .limit(1);

  if (existingUser) {
    // Update existing user
    await db
      .update(schema.users)
      .set({
        email: user.email,
        fullName: user.fullName,
        department: user.department,
        role: user.role || existingUser.role,
        cognitoGroups: user.cognitoGroups,
        lastLoginAt: new Date(),
      })
      .where(eq(schema.users.id, existingUser.id));
    
    // Fetch and return updated user
    const [updated] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, existingUser.id))
      .limit(1);
    
    return updated;
  } else {
    // Insert new user
    const result = await db
      .insert(schema.users)
      .values({
        cognitoSub: user.cognitoSub,
        openId: user.openId,
        email: user.email,
        fullName: user.fullName,
        department: user.department,
        role: user.role || "PPIC",
        cognitoGroups: user.cognitoGroups,
        isActive: true,
        lastLoginAt: new Date(),
      });
    
    // Fetch and return the newly created user
    const [newUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.cognitoSub, user.cognitoSub))
      .limit(1);
    
    return newUser;
  }
}

export async function getUserByOpenId(openId: string): Promise<schema.User | undefined> {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.openId, openId))
    .limit(1);
  
  return user;
}

export async function getUserById(id: number): Promise<schema.User | undefined> {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  
  return user;
}

export async function getUserByCognitoSub(cognitoSub: string): Promise<schema.User | undefined> {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.cognitoSub, cognitoSub))
    .limit(1);
  
  return user;
}

export async function getAllUsers(): Promise<schema.User[]> {
  return await db
    .select()
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt));
}

export async function updateUserRole(
  userId: number,
  role: typeof schema.users.$inferSelect.role
): Promise<void> {
  await db
    .update(schema.users)
    .set({ role })
    .where(eq(schema.users.id, userId));
}

export async function updateUserStatus(userId: number, isActive: boolean): Promise<void> {
  await db
    .update(schema.users)
    .set({ isActive })
    .where(eq(schema.users.id, userId));
}

// ============================================
// Workflow Management
// ============================================

export async function createWorkflow(workflow: {
  workflowType: "MAF" | "PR" | "CATTO";
  title: string;
  description?: string;
  requesterId: number;
  department: string;
  estimatedAmount?: number;
  currency?: string;
  requiresGa?: boolean;
  requiresPpic?: boolean;
}): Promise<schema.Workflow> {
  const workflowId = randomUUID();
  const workflowNumber = await generateWorkflowNumber(workflow.workflowType);
  
  await db
    .insert(schema.workflows)
    .values({
      id: workflowId,
      workflowNumber,
      workflowType: workflow.workflowType,
      title: workflow.title,
      description: workflow.description,
      requesterId: workflow.requesterId,
      department: workflow.department,
      estimatedAmount: workflow.estimatedAmount?.toString(),
      currency: workflow.currency || "IDR",
      requiresGa: workflow.requiresGa || false,
      requiresPpic: workflow.requiresPpic || false,
      overallStatus: "draft",
    });
  
  // Fetch and return the newly created workflow
  const [newWorkflow] = await db
    .select()
    .from(schema.workflows)
    .where(eq(schema.workflows.id, workflowId))
    .limit(1);
  
  return newWorkflow;
}

export async function getWorkflowById(workflowId: string): Promise<schema.Workflow | undefined> {
  const [workflow] = await db
    .select()
    .from(schema.workflows)
    .where(eq(schema.workflows.id, workflowId))
    .limit(1);
  
  return workflow;
}

export async function getWorkflowsByRequester(requesterId: number): Promise<schema.Workflow[]> {
  return await db
    .select()
    .from(schema.workflows)
    .where(eq(schema.workflows.requesterId, requesterId))
    .orderBy(desc(schema.workflows.createdAt));
}

export async function getAllWorkflows(): Promise<schema.Workflow[]> {
  return await db
    .select()
    .from(schema.workflows)
    .orderBy(desc(schema.workflows.createdAt));
}

export async function updateWorkflowStatus(
  workflowId: string,
  status: typeof schema.workflows.$inferSelect.overallStatus
): Promise<void> {
  await db
    .update(schema.workflows)
    .set({ overallStatus: status })
    .where(eq(schema.workflows.id, workflowId));
}

export async function submitWorkflow(workflowId: string): Promise<void> {
  await db
    .update(schema.workflows)
    .set({
      overallStatus: "in_progress",
      submittedAt: new Date(),
    })
    .where(eq(schema.workflows.id, workflowId));
}

export async function discontinueWorkflow(
  workflowId: string,
  reason?: string
): Promise<void> {
  await db
    .update(schema.workflows)
    .set({
      overallStatus: "discontinued",
      completedAt: new Date(),
      metadata: sql`JSON_SET(COALESCE(metadata, '{}'), '$.discontinuedReason', ${reason || 'No reason provided'}, '$.discontinuedAt', ${new Date().toISOString()})`,
    })
    .where(eq(schema.workflows.id, workflowId));
}

export async function archiveWorkflow(workflowId: string): Promise<void> {
  await db
    .update(schema.workflows)
    .set({
      overallStatus: "archived",
      metadata: sql`JSON_SET(COALESCE(metadata, '{}'), '$.archivedAt', ${new Date().toISOString()})`,
    })
    .where(eq(schema.workflows.id, workflowId));
}

// ============================================
// Workflow Stage Management
// ============================================

export async function createWorkflowStage(stage: {
  workflowId: string;
  stageOrder: number;
  stageName: string;
  stageType: string;
  requiredRole?: string;
  requiresOneOf?: string[];
  approvalThreshold?: number;
}): Promise<schema.WorkflowStage> {
  const stageId = randomUUID();
  
  await db
    .insert(schema.workflowStages)
    .values({
      id: stageId,
      workflowId: stage.workflowId,
      stageOrder: stage.stageOrder,
      stageName: stage.stageName,
      stageType: stage.stageType,
      requiredRole: stage.requiredRole,
      requiresOneOf: stage.requiresOneOf,
      approvalThreshold: stage.approvalThreshold?.toString(),
      status: "pending",
    });
  
  // Fetch and return the newly created stage
  const [newStage] = await db
    .select()
    .from(schema.workflowStages)
    .where(eq(schema.workflowStages.id, stageId))
    .limit(1);
  
  return newStage;
}

export async function getStagesByWorkflow(workflowId: string): Promise<schema.WorkflowStage[]> {
  return await db
    .select()
    .from(schema.workflowStages)
    .where(eq(schema.workflowStages.workflowId, workflowId))
    .orderBy(schema.workflowStages.stageOrder);
}

export async function getStageById(stageId: string): Promise<schema.WorkflowStage | undefined> {
  const [stage] = await db
    .select()
    .from(schema.workflowStages)
    .where(eq(schema.workflowStages.id, stageId))
    .limit(1);
  
  return stage;
}

export async function updateStageStatus(
  stageId: string,
  status: typeof schema.workflowStages.$inferSelect.status
): Promise<void> {
  const updates: any = { status };
  
  if (status === "in_progress") {
    updates.startedAt = new Date();
  } else if (status === "completed" || status === "rejected") {
    updates.completedAt = new Date();
  }
  
  await db
    .update(schema.workflowStages)
    .set(updates)
    .where(eq(schema.workflowStages.id, stageId));
}

// ============================================
// Workflow Approval Management
// ============================================

export async function createApproval(approval: {
  workflowId: string;
  stageId: string;
  approverId: number;
  approverRole: string;
  action: "approved" | "rejected" | "commented";
  comments?: string;
}): Promise<schema.WorkflowApproval> {
  const approvalId = randomUUID();
  
  await db
    .insert(schema.workflowApprovals)
    .values({
      id: approvalId,
      workflowId: approval.workflowId,
      stageId: approval.stageId,
      approverId: approval.approverId,
      approverRole: approval.approverRole,
      action: approval.action,
      comments: approval.comments,
    });
  
  // Fetch and return the newly created approval
  const [newApproval] = await db
    .select()
    .from(schema.workflowApprovals)
    .where(eq(schema.workflowApprovals.id, approvalId))
    .limit(1);
  
  return newApproval;
}

export async function getApprovalsByWorkflow(workflowId: string): Promise<schema.WorkflowApproval[]> {
  return await db
    .select()
    .from(schema.workflowApprovals)
    .where(eq(schema.workflowApprovals.workflowId, workflowId))
    .orderBy(desc(schema.workflowApprovals.createdAt));
}

export async function getApprovalsByStage(stageId: string): Promise<schema.WorkflowApproval[]> {
  return await db
    .select()
    .from(schema.workflowApprovals)
    .where(eq(schema.workflowApprovals.stageId, stageId))
    .orderBy(desc(schema.workflowApprovals.createdAt));
}

// ============================================
// Workflow File Management
// ============================================

export async function createWorkflowFile(file: {
  workflowId: string;
  stageId?: string;
  fileName: string;
  fileType: string;
  fileCategory?: string;
  s3Bucket: string;
  s3Key: string;
  s3Url: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: number;
}): Promise<schema.WorkflowFile> {
  const fileId = randomUUID();
  
  await db
    .insert(schema.workflowFiles)
    .values({
      id: fileId,
      workflowId: file.workflowId,
      stageId: file.stageId,
      fileName: file.fileName,
      fileType: file.fileType,
      fileCategory: file.fileCategory,
      s3Bucket: file.s3Bucket,
      s3Key: file.s3Key,
      s3Url: file.s3Url,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      uploadedBy: file.uploadedBy,
    });
  
  // Fetch and return the newly created file
  const [newFile] = await db
    .select()
    .from(schema.workflowFiles)
    .where(eq(schema.workflowFiles.id, fileId))
    .limit(1);
  
  return newFile;
}

export async function getFilesByWorkflow(workflowId: string): Promise<schema.WorkflowFile[]> {
  return await db
    .select()
    .from(schema.workflowFiles)
    .where(eq(schema.workflowFiles.workflowId, workflowId))
    .orderBy(desc(schema.workflowFiles.uploadedAt));
}

export async function getFilesByStage(stageId: string): Promise<schema.WorkflowFile[]> {
  return await db
    .select()
    .from(schema.workflowFiles)
    .where(eq(schema.workflowFiles.stageId, stageId))
    .orderBy(desc(schema.workflowFiles.uploadedAt));
}

// ============================================
// Workflow Comment Management
// ============================================

export async function createComment(comment: {
  workflowId: string;
  stageId?: string;
  commentText: string;
  commentType?: string;
  authorId: number;
  authorRole?: string;
}): Promise<schema.WorkflowComment> {
  const commentId = randomUUID();
  
  await db
    .insert(schema.workflowComments)
    .values({
      id: commentId,
      workflowId: comment.workflowId,
      stageId: comment.stageId,
      commentText: comment.commentText,
      commentType: comment.commentType || "general",
      authorId: comment.authorId,
      authorRole: comment.authorRole,
    });
  
  // Fetch and return the newly created comment
  const [newComment] = await db
    .select()
    .from(schema.workflowComments)
    .where(eq(schema.workflowComments.id, commentId))
    .limit(1);
  
  return newComment;
}

export async function getCommentsByWorkflow(workflowId: string): Promise<schema.WorkflowComment[]> {
  return await db
    .select()
    .from(schema.workflowComments)
    .where(eq(schema.workflowComments.workflowId, workflowId))
    .orderBy(desc(schema.workflowComments.createdAt));
}

export async function getCommentsByStage(stageId: string): Promise<schema.WorkflowComment[]> {
  return await db
    .select()
    .from(schema.workflowComments)
    .where(eq(schema.workflowComments.stageId, stageId))
    .orderBy(desc(schema.workflowComments.createdAt));
}

// ============================================
// Audit Log Management
// ============================================

export async function createAuditLog(log: {
  entityType: string;
  entityId: string;
  action: string;
  actionDescription?: string;
  actorId?: number;
  actorEmail?: string;
  actorRole?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<schema.AuditLog> {
  const logId = randomUUID();
  
  await db
    .insert(schema.auditLogs)
    .values({
      id: logId,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      actionDescription: log.actionDescription,
      actorId: log.actorId,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      oldValues: log.oldValues,
      newValues: log.newValues,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    });
  
  // Fetch and return the newly created log
  const [newLog] = await db
    .select()
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.id, logId))
    .limit(1);
  
  return newLog;
}

export async function getAuditLogsByEntity(
  entityType: string,
  entityId: string
): Promise<schema.AuditLog[]> {
  return await db
    .select()
    .from(schema.auditLogs)
    .where(
      and(
        eq(schema.auditLogs.entityType, entityType),
        eq(schema.auditLogs.entityId, entityId)
      )
    )
    .orderBy(desc(schema.auditLogs.createdAt));
}

// ============================================
// Sequence Number Generation
// ============================================

async function generateWorkflowNumber(type: "MAF" | "PR" | "CATTO" | "SKU" | "PAF"): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
  
  // Try to get existing counter for today
  const [counter] = await db
    .select()
    .from(schema.sequenceCounters)
    .where(
      and(
        eq(schema.sequenceCounters.sequenceType, type),
        eq(schema.sequenceCounters.sequenceDate, dateStr)
      )
    )
    .limit(1);
  
  let nextCounter: number;
  
  if (counter) {
    // Increment existing counter
    nextCounter = counter.currentCounter + 1;
    await db
      .update(schema.sequenceCounters)
      .set({ currentCounter: nextCounter })
      .where(eq(schema.sequenceCounters.id, counter.id));
  } else {
    // Create new counter for today
    nextCounter = 1;
    await db
      .insert(schema.sequenceCounters)
      .values({
        id: randomUUID(),
        sequenceType: type,
        sequenceDate: dateStr,
        currentCounter: nextCounter,
      });
  }
  
  // Format: WFMT-MAF-260209-001
  const paddedCounter = nextCounter.toString().padStart(3, "0");
  return `WFMT-${type}-${dateStr}-${paddedCounter}`;
}

// ============================================
// Email Recipient Management
// ============================================

export async function getEmailRecipientsByGroup(group: string): Promise<schema.EmailRecipient[]> {
  return await db
    .select()
    .from(schema.emailRecipients)
    .where(
      and(
        eq(schema.emailRecipients.recipientGroup, group),
        eq(schema.emailRecipients.isActive, true)
      )
    );
}

export async function getAllEmailRecipients(): Promise<schema.EmailRecipient[]> {
  return await db
    .select()
    .from(schema.emailRecipients)
    .where(eq(schema.emailRecipients.isActive, true));
}

// ============================================
// Sequence Management (Public API)
// ============================================

export async function getAllSequenceCounters() {
  return await db
    .select()
    .from(schema.sequenceCounters)
    .orderBy(desc(schema.sequenceCounters.createdAt));
}

export async function getSequenceCountersByType(type: "MAF" | "PR" | "CATTO" | "SKU" | "PAF") {
  return await db
    .select()
    .from(schema.sequenceCounters)
    .where(eq(schema.sequenceCounters.sequenceType, type))
    .orderBy(desc(schema.sequenceCounters.sequenceDate));
}

export async function generateSequenceNumber(type: "MAF" | "PR" | "CATTO" | "SKU" | "PAF"): Promise<string> {
  return await generateWorkflowNumber(type);
}

export async function resetSequenceCounter(type: "MAF" | "PR" | "CATTO" | "SKU" | "PAF", date: string) {
  const [counter] = await db
    .select()
    .from(schema.sequenceCounters)
    .where(
      and(
        eq(schema.sequenceCounters.sequenceType, type),
        eq(schema.sequenceCounters.sequenceDate, date)
      )
    )
    .limit(1);

  if (counter) {
    await db
      .update(schema.sequenceCounters)
      .set({ currentCounter: 0 })
      .where(eq(schema.sequenceCounters.id, counter.id));
  }
}

// ============================================
// Workflow Files
// ============================================


// ============================================
// Workflow Files Queries
// ============================================

export async function getWorkflowFiles(workflowId: string) {
  return await db
    .select()
    .from(schema.workflowFiles)
    .where(eq(schema.workflowFiles.workflowId, workflowId))
    .orderBy(desc(schema.workflowFiles.uploadedAt));
}

export async function getWorkflowFileById(fileId: string) {
  const results = await db
    .select()
    .from(schema.workflowFiles)
    .where(eq(schema.workflowFiles.id, fileId))
    .limit(1);
  return results[0] || null;
}

export async function deleteWorkflowFile(fileId: string) {
  await db.delete(schema.workflowFiles).where(eq(schema.workflowFiles.id, fileId));
}

// ============================================
// Form Templates
// ============================================

export type FormTemplate = schema.FormTemplate;
export type InsertFormTemplate = schema.InsertFormTemplate;
export type FormSubmission = schema.FormSubmission;
export type InsertFormSubmission = schema.InsertFormSubmission;

export async function createFormTemplate(template: Omit<schema.InsertFormTemplate, "id" | "createdAt" | "updatedAt">): Promise<schema.FormTemplate> {
  const id = randomUUID();
  await db.insert(schema.formTemplates).values({
    ...template,
    id,
  });
  
  const [created] = await db
    .select()
    .from(schema.formTemplates)
    .where(eq(schema.formTemplates.id, id))
    .limit(1);
  
  return created!;
}

export async function getAllFormTemplates(): Promise<schema.FormTemplate[]> {
  return await db
    .select()
    .from(schema.formTemplates)
    .orderBy(desc(schema.formTemplates.createdAt));
}

export async function getActiveFormTemplates(): Promise<schema.FormTemplate[]> {
  return await db
    .select()
    .from(schema.formTemplates)
    .where(eq(schema.formTemplates.isActive, true))
    .orderBy(desc(schema.formTemplates.createdAt));
}

export async function getFormTemplateById(id: string): Promise<schema.FormTemplate | null> {
  const [template] = await db
    .select()
    .from(schema.formTemplates)
    .where(eq(schema.formTemplates.id, id))
    .limit(1);
  
  return template || null;
}

export async function getFormTemplateByCode(code: string): Promise<schema.FormTemplate | null> {
  const [template] = await db
    .select()
    .from(schema.formTemplates)
    .where(eq(schema.formTemplates.templateCode, code))
    .limit(1);
  
  return template || null;
}

export async function updateFormTemplate(id: string, updates: Partial<Omit<schema.InsertFormTemplate, "id" | "createdAt">>): Promise<void> {
  await db
    .update(schema.formTemplates)
    .set(updates)
    .where(eq(schema.formTemplates.id, id));
}

export async function deleteFormTemplate(id: string): Promise<void> {
  await db.delete(schema.formTemplates).where(eq(schema.formTemplates.id, id));
}

// ============================================
// Form Submissions
// ============================================

export async function createFormSubmission(submission: Omit<schema.InsertFormSubmission, "id" | "createdAt" | "updatedAt">): Promise<schema.FormSubmission> {
  const id = randomUUID();
  await db.insert(schema.formSubmissions).values({
    ...submission,
    id,
  });
  
  const [created] = await db
    .select()
    .from(schema.formSubmissions)
    .where(eq(schema.formSubmissions.id, id))
    .limit(1);
  
  return created!;
}

export async function getFormSubmissionById(id: string): Promise<schema.FormSubmission | null> {
  const [submission] = await db
    .select()
    .from(schema.formSubmissions)
    .where(eq(schema.formSubmissions.id, id))
    .limit(1);
  
  return submission || null;
}

export async function getFormSubmissionsByWorkflow(workflowId: string): Promise<schema.FormSubmission[]> {
  return await db
    .select()
    .from(schema.formSubmissions)
    .where(eq(schema.formSubmissions.workflowId, workflowId))
    .orderBy(desc(schema.formSubmissions.createdAt));
}

export async function getFormSubmissionsByStage(stageId: string): Promise<schema.FormSubmission[]> {
  return await db
    .select()
    .from(schema.formSubmissions)
    .where(eq(schema.formSubmissions.stageId, stageId))
    .orderBy(desc(schema.formSubmissions.createdAt));
}

export async function updateFormSubmission(id: string, updates: Partial<Omit<schema.InsertFormSubmission, "id" | "createdAt">>): Promise<void> {
  await db
    .update(schema.formSubmissions)
    .set(updates)
    .where(eq(schema.formSubmissions.id, id));
}

export async function deleteFormSubmission(id: string): Promise<void> {
  await db.delete(schema.formSubmissions).where(eq(schema.formSubmissions.id, id));
}

// ============================================================================
// Analytics Functions
// ============================================================================

export async function getWorkflowAnalytics() {
  const workflows = await db.select().from(schema.workflows);
  
  const total = workflows.length;
  const inProgress = workflows.filter(w => w.overallStatus === 'in_progress').length;
  const completed = workflows.filter(w => w.overallStatus === 'completed').length;
  const rejected = workflows.filter(w => ['rejected', 'cancelled', 'discontinued'].includes(w.overallStatus)).length;
  const draft = workflows.filter(w => w.overallStatus === 'draft').length;
  
  // Calculate average approval time for completed workflows
  const completedWorkflows = workflows.filter(w => w.overallStatus === 'completed');
  let avgApprovalTime = 0;
  if (completedWorkflows.length > 0) {
    const totalTime = completedWorkflows.reduce((sum, w) => {
      const created = new Date(w.createdAt).getTime();
      const updated = new Date(w.updatedAt).getTime();
      return sum + (updated - created);
    }, 0);
    avgApprovalTime = Math.round(totalTime / completedWorkflows.length / (1000 * 60 * 60 * 24)); // Convert to days
  }
  
  return {
    total,
    inProgress,
    completed,
    rejected,
    draft,
    avgApprovalTime,
  };
}

export async function getWorkflowsByType() {
  const workflows = await db.select().from(schema.workflows);
  
  const byType: Record<string, number> = {};
  workflows.forEach(w => {
    byType[w.type] = (byType[w.type] || 0) + 1;
  });
  
  return Object.entries(byType).map(([type, count]) => ({ type, count }));
}

export async function getWorkflowsByDepartment() {
  const workflows = await db.select().from(schema.workflows);
  
  const byDept: Record<string, number> = {};
  workflows.forEach(w => {
    byDept[w.department] = (byDept[w.department] || 0) + 1;
  });
  
  return Object.entries(byDept).map(([department, count]) => ({ department, count }));
}

export async function getWorkflowsByStatus() {
  const workflows = await db.select().from(schema.workflows);
  
  const byStatus: Record<string, number> = {};
  workflows.forEach(w => {
    byStatus[w.overallStatus] = (byStatus[w.overallStatus] || 0) + 1;
  });
  
  return Object.entries(byStatus).map(([status, count]) => ({ status, count }));
}

export async function getAvgApprovalTimeByType() {
  const workflows = await db.select().from(schema.workflows);
  const completedWorkflows = workflows.filter(w => w.overallStatus === 'completed');
  
  const timeByType: Record<string, { total: number; count: number }> = {};
  
  completedWorkflows.forEach(w => {
    const created = new Date(w.createdAt).getTime();
    const updated = new Date(w.updatedAt).getTime();
    const days = Math.round((updated - created) / (1000 * 60 * 60 * 24));
    
    if (!timeByType[w.type]) {
      timeByType[w.type] = { total: 0, count: 0 };
    }
    timeByType[w.type].total += days;
    timeByType[w.type].count += 1;
  });
  
  return Object.entries(timeByType).map(([type, data]) => ({
    type,
    avgDays: Math.round(data.total / data.count),
  }));
}

export async function getWorkflowCompletionTrend(days: number = 30) {
  const workflows = await db.select().from(schema.workflows);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentWorkflows = workflows.filter(w => new Date(w.createdAt) >= cutoffDate);
  
  // Group by date
  const byDate: Record<string, { total: number; completed: number }> = {};
  
  recentWorkflows.forEach(w => {
    const date = new Date(w.createdAt).toISOString().split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { total: 0, completed: 0 };
    }
    byDate[date].total += 1;
    if (w.overallStatus === 'completed') {
      byDate[date].completed += 1;
    }
  });
  
  return Object.entries(byDate)
    .map(([date, data]) => ({
      date,
      total: data.total,
      completed: data.completed,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

