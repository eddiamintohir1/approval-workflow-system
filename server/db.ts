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

export async function getWorkflowById(workflowId: string): Promise<(schema.Workflow & { requesterName?: string }) | undefined> {
  const [result] = await db
    .select({
      ...schema.workflows,
      requesterName: schema.users.fullName,
    })
    .from(schema.workflows)
    .leftJoin(schema.users, eq(schema.workflows.requesterId, schema.users.id))
    .where(eq(schema.workflows.id, workflowId))
    .limit(1);
  
  return result as any;
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

export async function deleteWorkflow(workflowId: string): Promise<void> {
  // Delete all related data first (cascade delete)
  // 1. Delete workflow files
  await db.delete(schema.workflowFiles).where(eq(schema.workflowFiles.workflowId, workflowId));
  
  // 2. Delete workflow comments
  await db.delete(schema.workflowComments).where(eq(schema.workflowComments.workflowId, workflowId));
  
  // 3. Delete workflow approvals
  await db.delete(schema.workflowApprovals).where(eq(schema.workflowApprovals.workflowId, workflowId));
  
  // 4. Delete form submissions
  await db.delete(schema.formSubmissions).where(eq(schema.formSubmissions.workflowId, workflowId));
  
  // 5. Delete workflow stages
  await db.delete(schema.workflowStages).where(eq(schema.workflowStages.workflowId, workflowId));
  
  // 6. Finally delete the workflow itself
  await db.delete(schema.workflows).where(eq(schema.workflows.id, workflowId));
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

/**
 * Check if a user has access to view a workflow based on:
 * 1. C-level roles (CEO, CFO, COO) and admin always have access
 * 2. Workflow requester always has access
 * 3. Other users have access if their department is in visibleToDepartments for at least one stage
 */
export async function checkWorkflowAccess(
  workflowId: string,
  userId: number,
  userRole: string,
  userDepartment: string | null
): Promise<{ hasAccess: boolean; reason?: string }> {
  // C-level and admin always have access
  if (["CEO", "CFO", "COO", "admin"].includes(userRole)) {
    return { hasAccess: true, reason: "C-level or admin access" };
  }

  // Check if user is the requester
  const workflow = await getWorkflowById(workflowId);
  if (!workflow) {
    return { hasAccess: false, reason: "Workflow not found" };
  }

  if (workflow.requesterId === userId) {
    return { hasAccess: true, reason: "Workflow requester" };
  }

  // Check if user's department has visibility to any stage
  if (!userDepartment) {
    return { hasAccess: false, reason: "No department assigned" };
  }

  const stages = await getStagesByWorkflow(workflowId);
  
  // Check if any stage is visible to user's department
  const hasVisibleStage = stages.some(stage => {
    // If visibleToDepartments is null/empty, stage is NOT visible to regular users
    // Only C-level, admin, and requester can see stages without explicit visibility
    if (!stage.visibleToDepartments || stage.visibleToDepartments.length === 0) {
      return false;
    }
    // Check if user's department is in the visible departments list
    return stage.visibleToDepartments.includes(userDepartment);
  });

  if (hasVisibleStage) {
    return { hasAccess: true, reason: "Department has stage visibility" };
  }

  return { hasAccess: false, reason: "No visible stages for your department" };
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

export async function getFilesByWorkflow(workflowId: string) {
  const files = await db
    .select({
      file: schema.workflowFiles,
      uploader: {
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
      },
    })
    .from(schema.workflowFiles)
    .leftJoin(schema.users, eq(schema.workflowFiles.uploadedBy, schema.users.id))
    .where(eq(schema.workflowFiles.workflowId, workflowId))
    .orderBy(desc(schema.workflowFiles.uploadedAt));
  
  return files.map(({ file, uploader }) => ({
    ...file,
    uploaderName: uploader?.fullName || uploader?.email || 'Unknown',
    uploaderEmail: uploader?.email,
  }));
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

export async function getWorkflowTimeline() {
  const workflows = await db.select().from(schema.workflows).orderBy(desc(schema.workflows.createdAt));
  
  const timelineData = await Promise.all(
    workflows.map(async (workflow) => {
      // Get all stages for this workflow
      const stages = await db
        .select()
        .from(schema.workflowStages)
        .where(eq(schema.workflowStages.workflowId, workflow.id))
        .orderBy(schema.workflowStages.stageOrder);
      
      // Calculate stage durations
      const stageTimeline = stages.map((stage, index) => {
        const startDate = stage.createdAt;
        const endDate = stage.completedAt || new Date();
        const duration = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          stageName: stage.stageName,
          status: stage.status,
          startDate,
          endDate: stage.completedAt,
          duration,
          stageOrder: stage.stageOrder,
        };
      });
      
      return {
        id: workflow.id,
        workflowNumber: workflow.workflowNumber,
        title: workflow.title,
        type: workflow.type,
        overallStatus: workflow.overallStatus,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        stages: stageTimeline,
      };
    })
  );
  
  return timelineData;
}

export async function getUserByRole(role: string) {
  const users = await db.select().from(schema.user).where(eq(schema.user.role, role)).limit(1);
  return users[0] || null;
}

// ============================================
// Workflow Template Management
// ============================================

export async function createWorkflowTemplate(template: {
  name: string;
  description?: string;
  workflowType: string;
  isDefault?: boolean;
  createdBy: number;
  stages: Array<{
    stageOrder: number;
    stageName: string;
    stageDescription?: string;
    department?: string;
    requiredRole?: string;
    requiresOneOf?: string[];
    approvalRequired: boolean;
    fileUploadRequired: boolean;
    notificationEmails?: string[];
    visibleToDepartments?: string[];
    approvalThreshold?: number;
  }>;
}): Promise<{ templateId: string }> {
  const templateId = randomUUID();
  
  // If this is set as default, unset other defaults for this workflow type
  if (template.isDefault) {
    await db
      .update(schema.workflowTemplates)
      .set({ isDefault: false })
      .where(eq(schema.workflowTemplates.workflowType, template.workflowType));
  }
  
  // Insert template
  await db.insert(schema.workflowTemplates).values({
    id: templateId,
    name: template.name,
    description: template.description,
    workflowType: template.workflowType,
    isDefault: template.isDefault || false,
    isActive: true,
    createdBy: template.createdBy,
  });
  
  // Insert stages
  for (const stage of template.stages) {
    const stageId = randomUUID();
    await db.insert(schema.templateStages).values({
      id: stageId,
      templateId,
      stageOrder: stage.stageOrder,
      stageName: stage.stageName,
      stageDescription: stage.stageDescription,
      department: stage.department,
      requiredRole: stage.requiredRole,
      requiresOneOf: stage.requiresOneOf,
      approvalRequired: stage.approvalRequired,
      fileUploadRequired: stage.fileUploadRequired,
      notificationEmails: stage.notificationEmails,
      visibleToDepartments: stage.visibleToDepartments,
      approvalThreshold: stage.approvalThreshold ? stage.approvalThreshold.toString() : undefined,
    });
  }
  
  return { templateId };
}

export async function getWorkflowTemplates(filters?: {
  workflowType?: string;
  isActive?: boolean;
}) {
  let query = db.select().from(schema.workflowTemplates);
  
  if (filters?.workflowType) {
    query = query.where(eq(schema.workflowTemplates.workflowType, filters.workflowType)) as any;
  }
  if (filters?.isActive !== undefined) {
    query = query.where(eq(schema.workflowTemplates.isActive, filters.isActive)) as any;
  }
  
  const templates = await query.orderBy(desc(schema.workflowTemplates.createdAt));
  
  // Add stage count to each template
  const templatesWithStages = await Promise.all(
    templates.map(async (template) => {
      const stages = await db
        .select()
        .from(schema.templateStages)
        .where(eq(schema.templateStages.templateId, template.id));
      return { ...template, stages };
    })
  );
  
  return templatesWithStages;
}

export async function getWorkflowTemplateById(templateId: string) {
  const [template] = await db
    .select()
    .from(schema.workflowTemplates)
    .where(eq(schema.workflowTemplates.id, templateId))
    .limit(1);
  
  if (!template) {
    return null;
  }
  
  const stages = await db
    .select()
    .from(schema.templateStages)
    .where(eq(schema.templateStages.templateId, templateId))
    .orderBy(schema.templateStages.stageOrder);
  
  return {
    ...template,
    stages,
  };
}

export async function getDefaultTemplate(workflowType: string) {
  const [template] = await db
    .select()
    .from(schema.workflowTemplates)
    .where(
      and(
        eq(schema.workflowTemplates.workflowType, workflowType),
        eq(schema.workflowTemplates.isDefault, true),
        eq(schema.workflowTemplates.isActive, true)
      )
    )
    .limit(1);
  
  if (!template) {
    return null;
  }
  
  const stages = await db
    .select()
    .from(schema.templateStages)
    .where(eq(schema.templateStages.templateId, template.id))
    .orderBy(schema.templateStages.stageOrder);
  
  return {
    ...template,
    stages,
  };
}

export async function updateWorkflowTemplate(
  templateId: string,
  updates: {
    name?: string;
    description?: string;
    isDefault?: boolean;
    isActive?: boolean;
    stages?: Array<{
      id?: string;
      stageOrder: number;
      stageName: string;
      stageDescription?: string;
      department?: string;
      requiredRole?: string;
      requiresOneOf?: string[];
      approvalRequired: boolean;
      fileUploadRequired: boolean;
      notificationEmails?: string[];
      visibleToDepartments?: string[];
      approvalThreshold?: number;
    }>;
  }
) {
  // Update template
  await db
    .update(schema.workflowTemplates)
    .set({
      name: updates.name,
      description: updates.description,
      isDefault: updates.isDefault,
      isActive: updates.isActive,
      updatedAt: new Date(),
    })
    .where(eq(schema.workflowTemplates.id, templateId));
  
  // If stages are provided, replace all stages
  if (updates.stages) {
    // Delete existing stages
    await db
      .delete(schema.templateStages)
      .where(eq(schema.templateStages.templateId, templateId));
    
    // Insert new stages
    for (const stage of updates.stages) {
      const stageId = stage.id || randomUUID();
      await db.insert(schema.templateStages).values({
        id: stageId,
        templateId,
        stageOrder: stage.stageOrder,
        stageName: stage.stageName,
        stageDescription: stage.stageDescription,
        department: stage.department,
        requiredRole: stage.requiredRole,
        requiresOneOf: stage.requiresOneOf,
        approvalRequired: stage.approvalRequired,
        fileUploadRequired: stage.fileUploadRequired,
        notificationEmails: stage.notificationEmails,
        visibleToDepartments: stage.visibleToDepartments,
        approvalThreshold: stage.approvalThreshold ? stage.approvalThreshold.toString() : undefined,
      });
    }
  }
  
  return { success: true };
}

export async function deleteWorkflowTemplate(templateId: string) {
  // Stages will be deleted automatically due to CASCADE
  await db
    .delete(schema.workflowTemplates)
    .where(eq(schema.workflowTemplates.id, templateId));
  
  return { success: true };
}


// ============================================================================
// Department-Specific Analytics
// ============================================================================

export async function getDepartmentMetrics(department: string) {
  // Get all workflows for this department
  const workflows = await db
    .select()
    .from(schema.workflows)
    .where(eq(schema.workflows.department, department));

  // Get audit logs for completion tracking
  const workflowIds = workflows.map(w => w.id);
  
  if (workflowIds.length === 0) {
    return {
      totalWorkflows: 0,
      avgCompletionDays: 0,
      completedCount: 0,
      inProgressCount: 0,
    };
  }

  // Calculate average days from creation to completion
  const completedWorkflows = workflows.filter(w => w.overallStatus === 'completed');
  let avgCompletionDays = 0;
  
  if (completedWorkflows.length > 0) {
    const completionTimes = await Promise.all(
      completedWorkflows.map(async (workflow) => {
        // Get audit logs for this workflow
        const logs = await db
          .select()
          .from(schema.auditLogs)
          .where(and(
            eq(schema.auditLogs.entityType, 'workflow'),
            eq(schema.auditLogs.entityId, workflow.id)
          ))
          .orderBy(schema.auditLogs.timestamp);

        if (logs.length === 0) return 0;

        // Find first "created" and last "completed" logs
        const createdLog = logs.find(log => log.action === 'created');
        const completedLog = logs.find(log => log.action === 'completed' || log.actionDescription?.includes('completed'));

        if (!createdLog) return 0;

        const startTime = new Date(createdLog.timestamp).getTime();
        const endTime = completedLog 
          ? new Date(completedLog.timestamp).getTime()
          : new Date(workflow.updatedAt).getTime();

        return (endTime - startTime) / (1000 * 60 * 60 * 24); // Convert to days
      })
    );

    avgCompletionDays = Math.round(
      completionTimes.reduce((sum, days) => sum + days, 0) / completionTimes.length
    );
  }

  return {
    totalWorkflows: workflows.length,
    avgCompletionDays,
    completedCount: completedWorkflows.length,
    inProgressCount: workflows.filter(w => w.overallStatus === 'in_progress').length,
  };
}

export async function getDepartmentCostBreakdown(department: string, period: 'monthly' | 'yearly') {
  // Get all workflows for this department
  const workflows = await db
    .select()
    .from(schema.workflows)
    .where(eq(schema.workflows.department, department));

  if (workflows.length === 0) {
    return [];
  }

  // Get form submissions for these workflows
  const workflowIds = workflows.map(w => w.id);
  const submissions = await db
    .select()
    .from(schema.formSubmissions)
    .where(sql`${schema.formSubmissions.workflowId} IN (${sql.join(workflowIds.map(id => sql`${id}`), sql`, `)})`);

  // Extract cost data from form submissions
  const costData: { period: string; totalCost: number; count: number }[] = [];
  const periodMap = new Map<string, { totalCost: number; count: number }>();

  for (const submission of submissions) {
    const formData = submission.formData as any;
    
    // Look for price/cost fields in form data
    let cost = 0;
    if (formData) {
      // Common field names for cost/price
      const costFields = ['price', 'amount', 'cost', 'total', 'totalAmount', 'totalCost'];
      for (const field of costFields) {
        if (formData[field] && !isNaN(Number(formData[field]))) {
          cost = Number(formData[field]);
          break;
        }
      }
    }

    if (cost > 0 && submission.submittedAt) {
      const date = new Date(submission.submittedAt);
      let periodKey: string;

      if (period === 'monthly') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        periodKey = String(date.getFullYear());
      }

      const existing = periodMap.get(periodKey) || { totalCost: 0, count: 0 };
      periodMap.set(periodKey, {
        totalCost: existing.totalCost + cost,
        count: existing.count + 1,
      });
    }
  }

  // Convert map to array and sort
  for (const [periodKey, data] of periodMap.entries()) {
    costData.push({
      period: periodKey,
      totalCost: Math.round(data.totalCost),
      count: data.count,
    });
  }

  return costData.sort((a, b) => a.period.localeCompare(b.period));
}

// Budget Management Functions
export async function createBudget(data: {
  department: string;
  year: number;
  month?: number;
  quarter?: number;
  allocatedAmount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
}) {
  const [budget] = await db.insert(departmentBudgets).values({
    id: generateId(),
    department: data.department,
    year: data.year,
    month: data.month || null,
    quarter: data.quarter || null,
    allocatedAmount: data.allocatedAmount,
    period: data.period,
    createdAt: new Date(),
  }).returning();
  return budget;
}

export async function getBudgetsByDepartment(department: string, year: number) {
  return await db.select().from(departmentBudgets)
    .where(and(
      eq(departmentBudgets.department, department),
      eq(departmentBudgets.year, year)
    ))
    .orderBy(departmentBudgets.period, departmentBudgets.month);
}

export async function getAllBudgets(year: number) {
  return await db.select().from(departmentBudgets)
    .where(eq(departmentBudgets.year, year))
    .orderBy(departmentBudgets.department, departmentBudgets.period);
}

export async function updateBudget(id: string, allocatedAmount: number) {
  const [budget] = await db.update(departmentBudgets)
    .set({ allocatedAmount, updatedAt: new Date() })
    .where(eq(departmentBudgets.id, id))
    .returning();
  return budget;
}

export async function deleteBudget(id: string) {
  await db.delete(departmentBudgets).where(eq(departmentBudgets.id, id));
}

// Get department spending vs budget
export async function getDepartmentBudgetAnalytics(department: string, year: number, period: 'monthly' | 'quarterly' | 'yearly') {
  // Get budgets for the department
  const budgets = await db.select().from(departmentBudgets)
    .where(and(
      eq(departmentBudgets.department, department),
      eq(departmentBudgets.year, year),
      eq(departmentBudgets.period, period)
    ));

  // Get actual spending from form submissions
  const workflows = await db.select().from(workflowsTable)
    .where(eq(workflowsTable.department, department));

  const workflowIds = workflows.map(w => w.id);
  
  const submissions = workflowIds.length > 0 
    ? await db.select().from(formSubmissions)
        .where(sql`${formSubmissions.workflowId} IN ${workflowIds}`)
    : [];

  // Calculate spending by period
  const spendingMap = new Map<string, number>();
  
  for (const submission of submissions) {
    const formData = submission.formData as any;
    let cost = 0;
    
    if (formData) {
      const costFields = ['actualCost', 'price', 'amount', 'cost', 'total', 'totalAmount', 'totalCost'];
      for (const field of costFields) {
        if (formData[field] && !isNaN(Number(formData[field]))) {
          cost = Number(formData[field]);
          break;
        }
      }
    }

    if (cost > 0 && submission.submittedAt) {
      const date = new Date(submission.submittedAt);
      if (date.getFullYear() !== year) continue;

      let periodKey: string;
      if (period === 'monthly') {
        periodKey = String(date.getMonth() + 1);
      } else if (period === 'quarterly') {
        periodKey = String(Math.floor(date.getMonth() / 3) + 1);
      } else {
        periodKey = 'year';
      }

      spendingMap.set(periodKey, (spendingMap.get(periodKey) || 0) + cost);
    }
  }

  // Combine budgets with actual spending
  const analytics = budgets.map(budget => {
    let periodKey: string;
    if (period === 'monthly') {
      periodKey = String(budget.month);
    } else if (period === 'quarterly') {
      periodKey = String(budget.quarter);
    } else {
      periodKey = 'year';
    }

    const actualSpending = spendingMap.get(periodKey) || 0;
    const percentage = budget.allocatedAmount > 0 
      ? Math.round((actualSpending / budget.allocatedAmount) * 100)
      : 0;

    return {
      id: budget.id,
      period: periodKey,
      periodLabel: period === 'monthly' ? `Month ${budget.month}` : 
                   period === 'quarterly' ? `Q${budget.quarter}` : 
                   `Year ${year}`,
      allocatedAmount: budget.allocatedAmount,
      actualSpending: Math.round(actualSpending),
      percentage,
      isOverBudget: actualSpending > budget.allocatedAmount,
    };
  });

  return analytics;
}


// ============================================
// Excel Template Management
// ============================================

export async function createExcelTemplate(template: {
  workflowType: string;
  templateName: string;
  description?: string;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize?: number;
  uploadedBy: number;
}) {
  const [result] = await db.insert(schema.excelTemplates).values({
    ...template,
    uploadedAt: new Date(),
    isActive: true,
  });
  return result;
}

export async function getAllExcelTemplates() {
  return await db
    .select({
      id: schema.excelTemplates.id,
      workflowType: schema.excelTemplates.workflowType,
      templateName: schema.excelTemplates.templateName,
      description: schema.excelTemplates.description,
      fileUrl: schema.excelTemplates.fileUrl,
      fileKey: schema.excelTemplates.fileKey,
      fileName: schema.excelTemplates.fileName,
      fileSize: schema.excelTemplates.fileSize,
      uploadedAt: schema.excelTemplates.uploadedAt,
      isActive: schema.excelTemplates.isActive,
      uploaderName: schema.users.fullName,
      uploaderEmail: schema.users.email,
    })
    .from(schema.excelTemplates)
    .leftJoin(schema.users, eq(schema.excelTemplates.uploadedBy, schema.users.id))
    .orderBy(desc(schema.excelTemplates.uploadedAt));
}

export async function getActiveExcelTemplates() {
  return await db
    .select({
      id: schema.excelTemplates.id,
      workflowType: schema.excelTemplates.workflowType,
      templateName: schema.excelTemplates.templateName,
      description: schema.excelTemplates.description,
      fileUrl: schema.excelTemplates.fileUrl,
      fileName: schema.excelTemplates.fileName,
      fileSize: schema.excelTemplates.fileSize,
      uploadedAt: schema.excelTemplates.uploadedAt,
      isActive: schema.excelTemplates.isActive,
    })
    .from(schema.excelTemplates)
    .where(eq(schema.excelTemplates.isActive, true))
    .orderBy(desc(schema.excelTemplates.uploadedAt));
}

export async function getExcelTemplateByWorkflowType(workflowType: string) {
  const [template] = await db
    .select()
    .from(schema.excelTemplates)
    .where(and(
      eq(schema.excelTemplates.workflowType, workflowType),
      eq(schema.excelTemplates.isActive, true)
    ))
    .orderBy(desc(schema.excelTemplates.uploadedAt))
    .limit(1);
  return template || null;
}

export async function getExcelTemplateById(id: number) {
  const [template] = await db
    .select()
    .from(schema.excelTemplates)
    .where(eq(schema.excelTemplates.id, id))
    .limit(1);
  return template || null;
}

export async function updateExcelTemplate(id: number, updates: {
  templateName?: string;
  description?: string;
  isActive?: boolean;
}) {
  await db
    .update(schema.excelTemplates)
    .set(updates)
    .where(eq(schema.excelTemplates.id, id));
}

export async function deleteExcelTemplate(id: number) {
  await db.delete(schema.excelTemplates).where(eq(schema.excelTemplates.id, id));
}
