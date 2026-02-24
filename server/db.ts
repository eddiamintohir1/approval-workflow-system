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

export async function getUserByEmail(email: string): Promise<schema.User | undefined> {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
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

export async function updateUserPinnedWorkflows(userId: number, pinnedWorkflows: string[]): Promise<void> {
  await db
    .update(schema.users)
    .set({ pinnedWorkflows })
    .where(eq(schema.users.id, userId));
}

// ============================================
// Workflow Management
// ============================================

export async function createWorkflow(workflow: {
  workflowType: string;
  title: string;
  description?: string;
  requesterId: number;
  department: string;
  estimatedAmount?: number;
  currency?: string;
  requiresGa?: boolean;
  requiresPpic?: boolean;
  templateId?: string;
  contingencyWorkflowIds?: string[];
}): Promise<schema.Workflow> {
  const workflowId = randomUUID();
  const workflowNumber = await generateWorkflowNumber(workflow.workflowType);
  
  await db
    .insert(schema.workflows)
    .values({
      id: workflowId,
      workflowNumber,
      workflowType: workflow.workflowType,
      templateId: workflow.templateId,
      title: workflow.title,
      description: workflow.description,
      requesterId: workflow.requesterId,
      department: workflow.department,
      estimatedAmount: workflow.estimatedAmount?.toString(),
      currency: workflow.currency || "IDR",
      requiresGa: workflow.requiresGa || false,
      requiresPpic: workflow.requiresPpic || false,
      contingencyWorkflowIds: workflow.contingencyWorkflowIds,
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

async function generateWorkflowNumber(type: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
  
  // Map custom types to predefined sequence types, or use "MAF" as default
  const validTypes = ["MAF", "PR", "CATTO", "SKU", "PAF"] as const;
  type ValidSequenceType = typeof validTypes[number];
  
  const sequenceType: ValidSequenceType = validTypes.includes(type as any) 
    ? (type as ValidSequenceType) 
    : "MAF"; // Default to MAF for custom workflow types
  
  // Try to get existing counter for today
  const [counter] = await db
    .select()
    .from(schema.sequenceCounters)
    .where(
      and(
        eq(schema.sequenceCounters.sequenceType, sequenceType),
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
        sequenceType: sequenceType,
        sequenceDate: dateStr,
        currentCounter: nextCounter,
      });
  }
  
  // Format: WFMT-{TYPE}-260209-001 (use original type for display, not sequence type)
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
  const users = await db.select().from(schema.users).where(eq(schema.users.role, role)).limit(1);
  return users[0] || null;
}

export async function getUsersByRole(role: string) {
  return await db.select().from(schema.users).where(eq(schema.users.role, role));
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
  isQuickAssignEnabled?: boolean;
}) {
  let query = db.select().from(schema.workflowTemplates);
  
  if (filters?.workflowType) {
    query = query.where(eq(schema.workflowTemplates.workflowType, filters.workflowType)) as any;
  }
  if (filters?.isActive !== undefined) {
    query = query.where(eq(schema.workflowTemplates.isActive, filters.isActive)) as any;
  }
  if (filters?.isQuickAssignEnabled !== undefined) {
    query = query.where(eq(schema.workflowTemplates.isQuickAssignEnabled, filters.isQuickAssignEnabled)) as any;
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
    isQuickAssignEnabled?: boolean;
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
      isQuickAssignEnabled: updates.isQuickAssignEnabled,
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

// ============================================
// Task Assignments
// ============================================

export async function createTaskAssignment(data: {
  workflowId: string;
  assignedTo: number;
  assignedBy: number;
}): Promise<schema.TaskAssignment> {
  const assignment = {
    id: randomUUID(),
    ...data,
  };
  
  await db.insert(schema.taskAssignments).values(assignment);
  return assignment as schema.TaskAssignment;
}

export async function getTaskAssignmentsByUser(userId: number) {
  return await db
    .select({
      assignment: schema.taskAssignments,
      workflow: schema.workflows,
    })
    .from(schema.taskAssignments)
    .leftJoin(schema.workflows, eq(schema.taskAssignments.workflowId, schema.workflows.id))
    .where(eq(schema.taskAssignments.assignedTo, userId))
    .orderBy(desc(schema.taskAssignments.assignedAt));
}

export async function getTeamAssignments(managerId: number) {
  return await db
    .select({
      assignment: schema.taskAssignments,
      workflow: schema.workflows,
      assignedUser: schema.users,
    })
    .from(schema.taskAssignments)
    .leftJoin(schema.workflows, eq(schema.taskAssignments.workflowId, schema.workflows.id))
    .leftJoin(schema.users, eq(schema.taskAssignments.assignedTo, schema.users.id))
    .where(eq(schema.taskAssignments.assignedBy, managerId))
    .orderBy(desc(schema.taskAssignments.assignedAt));
}

// ============================================
// User Performance Metrics
// ============================================

export async function calculateUserMetrics(userId: number) {
  // Get current month start
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Calculate average completion time (hours)
  const completedWorkflows = await db
    .select({
      id: schema.workflows.id,
      createdAt: schema.workflows.createdAt,
      completedAt: schema.workflows.completedAt,
    })
    .from(schema.workflows)
    .where(
      and(
        eq(schema.workflows.createdBy, userId),
        eq(schema.workflows.status, "completed")
      )
    );
  
  const avgCompletionHours = completedWorkflows.length > 0
    ? completedWorkflows.reduce((sum, w) => {
        const hours = (new Date(w.completedAt!).getTime() - new Date(w.createdAt).getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0) / completedWorkflows.length
    : null;
  
  // Count tasks completed this month
  const tasksCompletedThisMonth = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.workflows)
    .where(
      and(
        eq(schema.workflows.createdBy, userId),
        eq(schema.workflows.status, "completed"),
        sql`${schema.workflows.completedAt} >= ${monthStart.toISOString()}`
      )
    )
    .then(rows => rows[0]?.count || 0);
  
  // Find longest stuck task (in progress for longest time)
  const inProgressWorkflows = await db
    .select({
      id: schema.workflows.id,
      createdAt: schema.workflows.createdAt,
    })
    .from(schema.workflows)
    .where(
      and(
        eq(schema.workflows.createdBy, userId),
        eq(schema.workflows.status, "in_progress")
      )
    );
  
  let longestStuckHours = null;
  let longestStuckWorkflowId = null;
  
  if (inProgressWorkflows.length > 0) {
    const longestStuck = inProgressWorkflows.reduce((longest, w) => {
      const hours = (now.getTime() - new Date(w.createdAt).getTime()) / (1000 * 60 * 60);
      return hours > (longest.hours || 0) ? { hours, id: w.id } : longest;
    }, { hours: 0, id: '' });
    
    longestStuckHours = longestStuck.hours;
    longestStuckWorkflowId = longestStuck.id;
  }
  
  // Count rejected tasks
  const rejectedCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.workflows)
    .where(
      and(
        eq(schema.workflows.createdBy, userId),
        eq(schema.workflows.status, "rejected")
      )
    )
    .then(rows => rows[0]?.count || 0);
  
  // Upsert metrics
  const metrics = {
    userId,
    avgCompletionHours: avgCompletionHours ? avgCompletionHours.toFixed(2) : null,
    tasksCompletedThisMonth,
    longestStuckHours: longestStuckHours ? longestStuckHours.toFixed(2) : null,
    longestStuckWorkflowId,
    rejectedCount,
    lastCalculated: new Date(),
  };
  
  await db
    .insert(schema.userPerformanceMetrics)
    .values(metrics)
    .onDuplicateKeyUpdate({
      set: metrics,
    });
  
  return metrics;
}

export async function getUserMetrics(userId: number) {
  const [metrics] = await db
    .select()
    .from(schema.userPerformanceMetrics)
    .where(eq(schema.userPerformanceMetrics.userId, userId))
    .limit(1);
  
  return metrics || null;
}

export async function recalculateAllMetrics() {
  // Get all active users
  const users = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.isActive, true));
  
  // Calculate metrics for each user
  for (const user of users) {
    await calculateUserMetrics(user.id);
  }
  
  return { success: true, usersProcessed: users.length };
}

// ============================================
// Salary Cache
// ============================================

export async function upsertSalaryCache(data: {
  userId: number;
  salaryAmount: number;
  currency?: string;
}) {
  const salary = {
    ...data,
    currency: data.currency || 'IDR',
    lastSynced: new Date(),
  };
  
  await db
    .insert(schema.salaryCache)
    .values(salary)
    .onDuplicateKeyUpdate({
      set: salary,
    });
  
  return salary;
}

export async function getUserSalary(userId: number) {
  const [salary] = await db
    .select()
    .from(schema.salaryCache)
    .where(eq(schema.salaryCache.userId, userId))
    .limit(1);
  
  return salary || null;
}

export async function getAllSalaries() {
  return await db
    .select({
      salary: schema.salaryCache,
      user: schema.users,
    })
    .from(schema.salaryCache)
    .leftJoin(schema.users, eq(schema.salaryCache.userId, schema.users.id));
}

// ============================================
// Capacity Management
// ============================================

export async function getUserListPaginated(params: {
  page: number;
  pageSize: number;
  department?: string;
  managerId?: number; // For "My Team" filter
}) {
  const { page, pageSize, department, managerId } = params;
  const offset = (page - 1) * pageSize;
  
  let query = db
    .select({
      user: schema.users,
      metrics: schema.userPerformanceMetrics,
      salary: schema.salaryCache,
    })
    .from(schema.users)
    .leftJoin(schema.userPerformanceMetrics, eq(schema.users.id, schema.userPerformanceMetrics.userId))
    .leftJoin(schema.salaryCache, eq(schema.users.id, schema.salaryCache.userId))
    .where(eq(schema.users.isActive, true));
  
  // Filter by department
  if (department && department !== 'My Team') {
    query = query.where(eq(schema.users.role, department as any));
  }
  
  // Filter by "My Team" (assigned users)
  if (department === 'My Team' && managerId) {
    const assignedUserIds = await db
      .select({ userId: schema.taskAssignments.assignedTo })
      .from(schema.taskAssignments)
      .where(eq(schema.taskAssignments.assignedBy, managerId))
      .then(rows => rows.map(r => r.userId));
    
    if (assignedUserIds.length > 0) {
      query = query.where(sql`${schema.users.id} IN (${assignedUserIds.join(',')})`);
    } else {
      // No assigned users, return empty
      return { users: [], total: 0 };
    }
  }
  
  // Get total count
  const totalQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .where(eq(schema.users.isActive, true));
  
  const total = totalQuery[0]?.count || 0;
  
  // Get paginated results
  const results = await query
    .limit(pageSize)
    .offset(offset)
    .orderBy(schema.users.fullName);
  
  // Flatten the nested structure for frontend
  const users = results.map(row => ({
    id: row.user.id,
    fullName: row.user.fullName,
    email: row.user.email,
    role: row.user.role,
    department: row.user.role, // Use role as department for now
    activeTaskCount: 0, // TODO: Calculate from workflows
    salary: row.salary?.salary || null,
  }));
  
  return { users, total };
}

// ============================================
// Recurring Workflows
// ============================================

export type RecurringWorkflow = schema.RecurringWorkflow;
export type InsertRecurringWorkflow = schema.InsertRecurringWorkflow;
export type RecurringWorkflowHistory = schema.RecurringWorkflowHistory;

export async function createRecurringWorkflow(data: {
  templateId: string;
  title: string;
  description?: string;
  department: string;
  frequency: "daily" | "weekly" | "monthly";
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: Date;
  endDate?: Date;
  createdBy: number;
  assignedTo?: number[];
  formTemplateId?: string;
  formData?: Record<string, any>;
  contingencyWorkflowIds?: string[];
}): Promise<schema.RecurringWorkflow> {
  const id = randomUUID();
  
  // Calculate next scheduled date based on frequency
  let nextScheduledDate = new Date(data.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (nextScheduledDate < today) {
    // If start date is in the past, calculate next occurrence
    if (data.frequency === "daily") {
      nextScheduledDate = new Date(today);
      nextScheduledDate.setDate(nextScheduledDate.getDate() + 1);
    } else if (data.frequency === "weekly" && data.dayOfWeek !== undefined) {
      nextScheduledDate = new Date(today);
      const daysUntilTarget = (data.dayOfWeek - nextScheduledDate.getDay() + 7) % 7;
      nextScheduledDate.setDate(nextScheduledDate.getDate() + (daysUntilTarget || 7));
    } else if (data.frequency === "monthly" && data.dayOfMonth !== undefined) {
      nextScheduledDate = new Date(today);
      nextScheduledDate.setDate(data.dayOfMonth);
      if (nextScheduledDate <= today) {
        nextScheduledDate.setMonth(nextScheduledDate.getMonth() + 1);
      }
    }
  }
  
  await db.insert(schema.recurringWorkflows).values({
    id,
    templateId: data.templateId,
    title: data.title,
    description: data.description,
    department: data.department,
    frequency: data.frequency,
    dayOfMonth: data.dayOfMonth,
    dayOfWeek: data.dayOfWeek,
    startDate: data.startDate,
    endDate: data.endDate,
    nextScheduledDate,
    createdBy: data.createdBy,
    assignedTo: data.assignedTo,
    formTemplateId: data.formTemplateId,
    formData: data.formData,
    contingencyWorkflowIds: data.contingencyWorkflowIds,
    isActive: true,
    isPaused: false,
  });
  
  const [created] = await db
    .select()
    .from(schema.recurringWorkflows)
    .where(eq(schema.recurringWorkflows.id, id))
    .limit(1);
  
  return created;
}

export async function getRecurringWorkflowsByUser(userId: number): Promise<schema.RecurringWorkflow[]> {
  const workflows = await db
    .select()
    .from(schema.recurringWorkflows)
    .where(
      and(
        eq(schema.recurringWorkflows.createdBy, userId),
        eq(schema.recurringWorkflows.isActive, true)
      )
    )
    .orderBy(desc(schema.recurringWorkflows.nextScheduledDate));
  
  return workflows;
}

export async function getRecurringWorkflowById(id: string): Promise<schema.RecurringWorkflow | undefined> {
  const [workflow] = await db
    .select()
    .from(schema.recurringWorkflows)
    .where(eq(schema.recurringWorkflows.id, id))
    .limit(1);
  
  return workflow;
}

export async function updateRecurringWorkflow(
  id: string,
  data: Partial<InsertRecurringWorkflow>
): Promise<schema.RecurringWorkflow> {
  await db
    .update(schema.recurringWorkflows)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.recurringWorkflows.id, id));
  
  const [updated] = await db
    .select()
    .from(schema.recurringWorkflows)
    .where(eq(schema.recurringWorkflows.id, id))
    .limit(1);
  
  return updated;
}

export async function pauseRecurringWorkflow(id: string): Promise<void> {
  await db
    .update(schema.recurringWorkflows)
    .set({ isPaused: true, updatedAt: new Date() })
    .where(eq(schema.recurringWorkflows.id, id));
}

export async function resumeRecurringWorkflow(id: string): Promise<void> {
  await db
    .update(schema.recurringWorkflows)
    .set({ isPaused: false, updatedAt: new Date() })
    .where(eq(schema.recurringWorkflows.id, id));
}

export async function deleteRecurringWorkflow(id: string): Promise<void> {
  await db
    .update(schema.recurringWorkflows)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(schema.recurringWorkflows.id, id));
}

export async function getDueRecurringWorkflows(): Promise<schema.RecurringWorkflow[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const workflows = await db
    .select()
    .from(schema.recurringWorkflows)
    .where(
      and(
        eq(schema.recurringWorkflows.isActive, true),
        eq(schema.recurringWorkflows.isPaused, false),
        sql`${schema.recurringWorkflows.nextScheduledDate} <= ${today}`
      )
    );
  
  return workflows;
}

export async function recordRecurringWorkflowGeneration(data: {
  recurringWorkflowId: string;
  generatedWorkflowId: string;
  scheduledDate: Date;
  status: "success" | "failed";
  errorMessage?: string;
}): Promise<void> {
  const id = randomUUID();
  
  await db.insert(schema.recurringWorkflowHistory).values({
    id,
    recurringWorkflowId: data.recurringWorkflowId,
    generatedWorkflowId: data.generatedWorkflowId,
    scheduledDate: data.scheduledDate,
    generationStatus: data.status,
    errorMessage: data.errorMessage,
  });
}

export async function getRecurringWorkflowHistory(
  recurringWorkflowId: string
): Promise<schema.RecurringWorkflowHistory[]> {
  const history = await db
    .select()
    .from(schema.recurringWorkflowHistory)
    .where(eq(schema.recurringWorkflowHistory.recurringWorkflowId, recurringWorkflowId))
    .orderBy(desc(schema.recurringWorkflowHistory.scheduledDate))
    .limit(50);
  
  return history;
}

export async function calculateNextScheduledDate(
  workflow: schema.RecurringWorkflow
): Promise<Date> {
  const current = new Date(workflow.nextScheduledDate);
  let next = new Date(current);
  
  if (workflow.frequency === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (workflow.frequency === "weekly" && workflow.dayOfWeek !== undefined) {
    next.setDate(next.getDate() + 7);
  } else if (workflow.frequency === "monthly" && workflow.dayOfMonth !== undefined) {
    next.setMonth(next.getMonth() + 1);
    next.setDate(workflow.dayOfMonth);
  }
  
  return next;
}


// ============================================
// Signed Documents (HelloDoc E-Signature)
// ============================================

export async function createSignedDocument(doc: {
  workflowId: string;
  documentName: string;
  s3Key: string | null;
  s3Url: string | null;
  uploadedS3Key?: string;
  uploadedS3Url?: string;
  helloDocDocumentId?: string | null;
  signerId: number;
  signerEmail: string;
  signerName: string;
}) {
  const id = randomUUID();
  const now = new Date();
  await db.insert(schema.signedDocuments).values({
    id,
    workflowId: doc.workflowId,
    documentName: doc.documentName,
    s3Key: doc.s3Key,
    s3Url: doc.s3Url,
    uploadedS3Key: doc.uploadedS3Key || null,
    uploadedS3Url: doc.uploadedS3Url || null,
    helloDocDocumentId: doc.helloDocDocumentId || null,
    signerId: doc.signerId,
    signerEmail: doc.signerEmail,
    signerName: doc.signerName,
    status: "awaiting_hellodoc_id",
    signedAt: null,
    sentAt: null,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function getSignedDocumentsByWorkflow(workflowId: string) {
  return db
    .select()
    .from(schema.signedDocuments)
    .where(eq(schema.signedDocuments.workflowId, workflowId))
    .orderBy(desc(schema.signedDocuments.createdAt));
}

export async function getSignedDocumentById(id: string) {
  const [doc] = await db
    .select()
    .from(schema.signedDocuments)
    .where(eq(schema.signedDocuments.id, id))
    .limit(1);
  return doc;
}

export async function updateSignedDocumentStatus(
  id: string,
  status: "pending" | "signed" | "rejected" | "expired",
  signedAt?: Date
) {
  await db
    .update(schema.signedDocuments)
    .set({
      status,
      signedAt: signedAt || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.signedDocuments.id, id));
}

export async function getSignedDocumentByHelloDocId(helloDocDocumentId: string) {
  const [doc] = await db
    .select()
    .from(schema.signedDocuments)
    .where(eq(schema.signedDocuments.helloDocDocumentId, helloDocDocumentId))
    .limit(1);
  return doc;
}

export async function getAllSignedDocuments(
  userId: number,
  status?: "all" | "pending" | "signed" | "rejected" | "expired",
  search?: string
) {
  let query = db
    .select()
    .from(schema.signedDocuments)
    .where(eq(schema.signedDocuments.signerId, userId));

  // Apply status filter
  if (status && status !== "all") {
    query = query.where(
      and(
        eq(schema.signedDocuments.signerId, userId),
        eq(schema.signedDocuments.status, status)
      )
    );
  }

  // Apply search filter (document name or signer email)
  if (search) {
    query = query.where(
      and(
        eq(schema.signedDocuments.signerId, userId),
        sql`(${schema.signedDocuments.documentName} LIKE ${`%${search}%`} OR ${schema.signedDocuments.signerEmail} LIKE ${`%${search}%`})`
      )
    );
  }

  return query.orderBy(desc(schema.signedDocuments.createdAt));
}

export async function getSignedDocumentsBySender(userId: number) {
  return db
    .select()
    .from(schema.signedDocuments)
    .where(eq(schema.signedDocuments.signerId, userId))
    .orderBy(desc(schema.signedDocuments.createdAt));
}

export async function updateSignedDocumentHelloDocId(id: string, helloDocDocumentId: string) {
  await db
    .update(schema.signedDocuments)
    .set({ 
      helloDocDocumentId,
      status: "pending",
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.signedDocuments.id, id));
}


// ============================================
// Document Templates
// ============================================

export async function createDocumentTemplate(template: {
  id: string;
  name: string;
  description?: string;
  category?: string;
  s3Key: string;
  s3Url: string;
  fileType: string;
  createdBy: number;
}) {
  await db.insert(schema.documentTemplates).values(template);
  return template.id;
}

export async function getAllDocumentTemplates(userId?: number) {
  let query = db
    .select()
    .from(schema.documentTemplates)
    .where(eq(schema.documentTemplates.isActive, true));

  if (userId) {
    query = query.where(
      and(
        eq(schema.documentTemplates.isActive, true),
        eq(schema.documentTemplates.createdBy, userId)
      )
    );
  }

  return query.orderBy(desc(schema.documentTemplates.createdAt));
}

export async function getDocumentTemplateById(id: string) {
  const [template] = await db
    .select()
    .from(schema.documentTemplates)
    .where(eq(schema.documentTemplates.id, id))
    .limit(1);
  return template;
}

export async function updateDocumentTemplate(
  id: string,
  updates: {
    name?: string;
    description?: string;
    category?: string;
  }
) {
  await db
    .update(schema.documentTemplates)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(schema.documentTemplates.id, id));
}

export async function deleteDocumentTemplate(id: string) {
  await db
    .update(schema.documentTemplates)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(schema.documentTemplates.id, id));
}
