import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import * as db from "./db";
import { storagePut, storageGet } from "./storage";
import { randomUUID } from "crypto";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  // ============================================
  // Authentication
  // ============================================
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(async () => {
      // Cognito logout is handled on the frontend
      return { success: true };
    }),
  }),

  // ============================================
  // User Management
  // ============================================
  users: router({
    getAll: protectedProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getUserById(input.id);
      }),

    updateRole: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["CEO", "COO", "CFO", "PPIC", "Purchasing", "GA", "Finance", "Production", "Logistics", "admin"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateUserRole(input.userId, input.role);
        
        await db.createAuditLog({
          entityType: "user",
          entityId: input.userId.toString(),
          action: "role_updated",
          actionDescription: `Role updated to ${input.role}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          isActive: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateUserStatus(input.userId, input.isActive);
        
        await db.createAuditLog({
          entityType: "user",
          entityId: input.userId.toString(),
          action: "status_updated",
          actionDescription: `Status updated to ${input.isActive ? "active" : "inactive"}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),

    // Switch role for test user only
    switchRole: protectedProcedure
      .input(
        z.object({
          role: z.enum(["CEO", "COO", "CFO", "PPIC", "Purchasing", "GA", "Finance", "Production", "Logistics", "admin"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Only allow test user to switch roles
        if (ctx.user.email !== "test@compawnion.co") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Role switching is only available for test user" });
        }
        
        await db.updateUserRole(ctx.user.id, input.role);
        
        await db.createAuditLog({
          entityType: "user",
          entityId: ctx.user.id.toString(),
          action: "role_switched",
          actionDescription: `Test user switched role to ${input.role}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: input.role,
        });
        
        return { success: true };
      }),
  }),

  // ============================================
  // Workflow Management
  // ============================================
  workflows: router({
    create: protectedProcedure
      .input(
        z.object({
          workflowType: z.enum(["MAF", "PR", "CATTO"]),
          title: z.string(),
          description: z.string().optional(),
          department: z.string(),
          estimatedAmount: z.number().optional(),
          currency: z.string().optional(),
          requiresGa: z.boolean().optional(),
          requiresPpic: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const workflow = await db.createWorkflow({
          ...input,
          requesterId: ctx.user.id,
        });
        
        // Create initial stages based on workflow type
        await createInitialStages(workflow.id, input.workflowType, input.estimatedAmount);
        
        await db.createAuditLog({
          entityType: "workflow",
          entityId: workflow.id,
          action: "created",
          actionDescription: `${input.workflowType} workflow created: ${input.title}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return workflow;
      }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      // Admin sees all workflows, others see only their own
      if (ctx.user.role === "admin") {
        return await db.getAllWorkflows();
      } else {
        return await db.getWorkflowsByRequester(ctx.user.id);
      }
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const workflow = await db.getWorkflowById(input.id);
        if (!workflow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
        }
        return workflow;
      }),

    getWithDetails: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const workflow = await db.getWorkflowById(input.id);
        if (!workflow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
        }
        
        const stages = await db.getStagesByWorkflow(input.id);
        const approvals = await db.getApprovalsByWorkflow(input.id);
        const files = await db.getFilesByWorkflow(input.id);
        const comments = await db.getCommentsByWorkflow(input.id);
        
        return {
          workflow,
          stages,
          approvals,
          files,
          comments,
        };
      }),

    submit: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const workflow = await db.getWorkflowById(input.id);
        if (!workflow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
        }
        
        if (workflow.requesterId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        
        await db.submitWorkflow(input.id);
        
        // Update first stage to in_progress
        const stages = await db.getStagesByWorkflow(input.id);
        if (stages.length > 0) {
          await db.updateStageStatus(stages[0].id, "in_progress");
        }
        
        await db.createAuditLog({
          entityType: "workflow",
          entityId: input.id,
          action: "submitted",
          actionDescription: "Workflow submitted for approval",
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        // TODO: Send email notifications to approvers
        
        return { success: true };
      }),

    discontinue: protectedProcedure
      .input(z.object({ 
        id: z.string(),
        reason: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const workflow = await db.getWorkflowById(input.id);
        if (!workflow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
        }
        
        // Only requester or admin can discontinue
        if (workflow.requesterId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to discontinue this workflow" });
        }
        
        // Cannot discontinue already completed or discontinued workflows
        if (["completed", "discontinued", "archived"].includes(workflow.overallStatus)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot discontinue ${workflow.overallStatus} workflow` });
        }
        
        await db.discontinueWorkflow(input.id, input.reason);
        
        await db.createAuditLog({
          entityType: "workflow",
          entityId: input.id,
          action: "discontinued",
          actionDescription: `Workflow discontinued${input.reason ? `: ${input.reason}` : ''}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),

    archive: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const workflow = await db.getWorkflowById(input.id);
        if (!workflow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
        }
        
        // Only admin can archive
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can archive workflows" });
        }
        
        await db.archiveWorkflow(input.id);
        
        await db.createAuditLog({
          entityType: "workflow",
          entityId: input.id,
          action: "archived",
          actionDescription: "Workflow archived",
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          status: z.enum(["draft", "in_progress", "completed", "rejected", "cancelled"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateWorkflowStatus(input.id, input.status);
        
        await db.createAuditLog({
          entityType: "workflow",
          entityId: input.id,
          action: "status_updated",
          actionDescription: `Status updated to ${input.status}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),

    uploadFile: protectedProcedure
      .input(
        z.object({
          workflowId: z.string(),
          stageId: z.string().optional(), // Which stage this file belongs to
          filename: z.string(),
          fileData: z.string(), // base64 encoded
          mimeType: z.string(),
          fileSize: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Convert base64 to buffer
        const fileBuffer = Buffer.from(input.fileData, "base64");
        
        // Upload to S3
        const fileKey = `workflows/${input.workflowId}/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
        
        // Save file metadata to database
        await db.createWorkflowFile({
          workflowId: input.workflowId,
          stageId: input.stageId,
          fileName: input.filename,
          fileType: "attachment",
          s3Bucket: "manus-storage",
          s3Key: fileKey,
          s3Url: url,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          uploadedBy: ctx.user.id,
        });
        
        await db.createAuditLog({
          entityType: "workflow",
          entityId: input.workflowId.toString(),
          action: "file_uploaded",
          actionDescription: `File uploaded: ${input.filename}${input.stageId ? ` for stage ${input.stageId}` : ""}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true, url };
      }),

    getFiles: protectedProcedure
      .input(z.object({ workflowId: z.string() }))
      .query(async ({ input }) => {
        return await db.getFilesByWorkflow(input.workflowId);
      }),

    deleteFile: protectedProcedure
      .input(z.object({ fileId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const file = await db.getWorkflowFileById(input.fileId);
        if (!file) {
          throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
        }
        
        await db.deleteWorkflowFile(input.fileId);
        
        await db.createAuditLog({
          entityType: "workflow",
          entityId: file.workflowId.toString(),
          action: "file_deleted",
          actionDescription: `File deleted: ${file.fileName}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),
  }),

  // ============================================
  // Workflow Stage Management
  // ============================================
  stages: router({
    getByWorkflow: protectedProcedure
      .input(z.object({ workflowId: z.string() }))
      .query(async ({ input }) => {
        return await db.getStagesByWorkflow(input.workflowId);
      }),

    approve: protectedProcedure
      .input(
        z.object({
          stageId: z.string(),
          workflowId: z.string(),
          comments: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const stage = await db.getStageById(input.stageId);
        if (!stage) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Stage not found" });
        }
        
        // Check if user has permission to approve this stage
        if (stage.requiredRole && ctx.user.role !== stage.requiredRole && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to approve this stage" });
        }
        
        // Check if form has been uploaded for this stage (except CEO/CFO who use signatures)
        if (ctx.user.role !== "CEO" && ctx.user.role !== "CFO") {
          const stageFiles = await db.getFilesByStage(input.stageId);
          const userUploadedFile = stageFiles.find(f => f.uploadedBy === ctx.user.id);
          
          if (!userUploadedFile) {
            throw new TRPCError({ 
              code: "PRECONDITION_FAILED", 
              message: "You must upload a form before approving this stage" 
            });
          }
        }
        
        // Create approval record
        await db.createApproval({
          workflowId: input.workflowId,
          stageId: input.stageId,
          approverId: ctx.user.id,
          approverRole: ctx.user.role,
          action: "approved",
          comments: input.comments,
        });
        
        // Update stage status
        await db.updateStageStatus(input.stageId, "completed");
        
        // Check if this was the last stage
        const stages = await db.getStagesByWorkflow(input.workflowId);
        const currentStageIndex = stages.findIndex(s => s.id === input.stageId);
        
        if (currentStageIndex < stages.length - 1) {
          // Move to next stage
          await db.updateStageStatus(stages[currentStageIndex + 1].id, "in_progress");
        } else {
          // Workflow completed
          await db.updateWorkflowStatus(input.workflowId, "completed");
        }
        
        await db.createAuditLog({
          entityType: "stage",
          entityId: input.stageId,
          action: "approved",
          actionDescription: `Stage approved: ${stage.stageName}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),

    reject: protectedProcedure
      .input(
        z.object({
          stageId: z.string(),
          workflowId: z.string(),
          comments: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const stage = await db.getStageById(input.stageId);
        if (!stage) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Stage not found" });
        }
        
        // Check if user has permission to reject this stage
        if (stage.requiredRole && ctx.user.role !== stage.requiredRole && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to reject this stage" });
        }
        
        // Create rejection record
        await db.createApproval({
          workflowId: input.workflowId,
          stageId: input.stageId,
          approverId: ctx.user.id,
          approverRole: ctx.user.role,
          action: "rejected",
          comments: input.comments,
        });
        
        // Update stage and workflow status
        await db.updateStageStatus(input.stageId, "rejected");
        await db.updateWorkflowStatus(input.workflowId, "rejected");
        
        await db.createAuditLog({
          entityType: "stage",
          entityId: input.stageId,
          action: "rejected",
          actionDescription: `Stage rejected: ${stage.stageName}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),
  }),

  // ============================================
  // File Management
  // ============================================
  files: router({
    upload: protectedProcedure
      .input(
        z.object({
          workflowId: z.string(),
          stageId: z.string().optional(),
          fileName: z.string(),
          fileType: z.string(),
          fileCategory: z.string().optional(),
          fileData: z.string(), // base64 encoded
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Decode base64 file data
        const fileBuffer = Buffer.from(input.fileData, "base64");
        
        // Upload to S3
        const s3Key = `workflows/${input.workflowId}/${randomUUID()}-${input.fileName}`;
        const { url } = await storagePut(s3Key, fileBuffer, input.mimeType);
        
        // Create file record
        const file = await db.createWorkflowFile({
          workflowId: input.workflowId,
          stageId: input.stageId,
          fileName: input.fileName,
          fileType: input.fileType,
          fileCategory: input.fileCategory,
          s3Bucket: process.env.AWS_S3_BUCKET!,
          s3Key,
          s3Url: url,
          fileSize: fileBuffer.length,
          mimeType: input.mimeType,
          uploadedBy: ctx.user.id,
        });
        
        await db.createAuditLog({
          entityType: "file",
          entityId: file.id,
          action: "uploaded",
          actionDescription: `File uploaded: ${input.fileName}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return file;
      }),

    getByWorkflow: protectedProcedure
      .input(z.object({ workflowId: z.string() }))
      .query(async ({ input }) => {
        return await db.getFilesByWorkflow(input.workflowId);
      }),

    getByStage: protectedProcedure
      .input(z.object({ stageId: z.string() }))
      .query(async ({ input }) => {
        return await db.getFilesByStage(input.stageId);
      }),
  }),

  // ============================================
  // Comment Management
  // ============================================
  comments: router({
    create: protectedProcedure
      .input(
        z.object({
          workflowId: z.string(),
          stageId: z.string().optional(),
          commentText: z.string(),
          commentType: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const comment = await db.createComment({
          ...input,
          authorId: ctx.user.id,
          authorRole: ctx.user.role,
        });
        
        await db.createAuditLog({
          entityType: "comment",
          entityId: comment.id,
          action: "created",
          actionDescription: "Comment added",
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return comment;
      }),

    getByWorkflow: protectedProcedure
      .input(z.object({ workflowId: z.string() }))
      .query(async ({ input }) => {
        return await db.getCommentsByWorkflow(input.workflowId);
      }),

    getByStage: protectedProcedure
      .input(z.object({ stageId: z.string() }))
      .query(async ({ input }) => {
        return await db.getCommentsByStage(input.stageId);
      }),
  }),

  // ============================================
  // Audit Logs
  // ============================================
  auditLogs: router({
    getByEntity: protectedProcedure
      .input(
        z.object({
          entityType: z.string(),
          entityId: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await db.getAuditLogsByEntity(input.entityType, input.entityId);
      }),
  }),

  // ============================================
  // Email Recipients
  // ============================================
  emailRecipients: router({
    getByGroup: adminProcedure
      .input(z.object({ group: z.string() }))
      .query(async ({ input }) => {
        return await db.getEmailRecipientsByGroup(input.group);
      }),

    getAll: adminProcedure.query(async () => {
      return await db.getAllEmailRecipients();
    }),
  }),

  // ============================================
  // Form Templates Management
  // ============================================
  formTemplates: router({
    create: adminProcedure
      .input(
        z.object({
          templateName: z.string(),
          templateCode: z.string(),
          description: z.string().optional(),
          fields: z.array(
            z.object({
              id: z.string(),
              type: z.enum(["text", "number", "date", "dropdown", "textarea", "file", "checkbox", "email"]),
              label: z.string(),
              placeholder: z.string().optional(),
              required: z.boolean(),
              options: z.array(z.string()).optional(),
              validation: z.object({
                min: z.number().optional(),
                max: z.number().optional(),
                pattern: z.string().optional(),
                message: z.string().optional(),
              }).optional(),
              defaultValue: z.any().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const template = await db.createFormTemplate({
          templateName: input.templateName,
          templateCode: input.templateCode,
          description: input.description,
          fields: input.fields,
          createdBy: ctx.user.id,
        });
        
        await db.createAuditLog({
          entityType: "form_template",
          entityId: template.id,
          action: "created",
          actionDescription: `Form template created: ${input.templateName}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return template;
      }),

    getAll: protectedProcedure.query(async () => {
      return await db.getAllFormTemplates();
    }),

    getActive: protectedProcedure.query(async () => {
      return await db.getActiveFormTemplates();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const template = await db.getFormTemplateById(input.id);
        if (!template) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Form template not found" });
        }
        return template;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          templateName: z.string().optional(),
          description: z.string().optional(),
          fields: z.array(
            z.object({
              id: z.string(),
              type: z.enum(["text", "number", "date", "dropdown", "textarea", "file", "checkbox", "email"]),
              label: z.string(),
              placeholder: z.string().optional(),
              required: z.boolean(),
              options: z.array(z.string()).optional(),
              validation: z.object({
                min: z.number().optional(),
                max: z.number().optional(),
                pattern: z.string().optional(),
                message: z.string().optional(),
              }).optional(),
              defaultValue: z.any().optional(),
            })
          ).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateFormTemplate(input.id, {
          templateName: input.templateName,
          description: input.description,
          fields: input.fields,
          isActive: input.isActive,
        });
        
        await db.createAuditLog({
          entityType: "form_template",
          entityId: input.id,
          action: "updated",
          actionDescription: `Form template updated`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteFormTemplate(input.id);
        
        await db.createAuditLog({
          entityType: "form_template",
          entityId: input.id,
          action: "deleted",
          actionDescription: `Form template deleted`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),
  }),

  // ============================================
  // Form Submissions
  // ============================================
  formSubmissions: router({
    create: protectedProcedure
      .input(
        z.object({
          templateId: z.union([z.string(), z.number()]).transform(val => String(val)),
          workflowId: z.string().optional(),
          stageId: z.string().optional(),
          formData: z.record(z.any()),
          submissionStatus: z.enum(["draft", "submitted", "approved", "rejected"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const submission = await db.createFormSubmission({
          templateId: String(input.templateId),
          workflowId: input.workflowId,
          stageId: input.stageId,
          formData: input.formData,
          submittedBy: ctx.user.id,
          submissionStatus: input.submissionStatus || "draft",
          submittedAt: input.submissionStatus === "submitted" ? new Date() : undefined,
        });
        
        await db.createAuditLog({
          entityType: "form_submission",
          entityId: submission.id,
          action: "created",
          actionDescription: `Form submission created`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return submission;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const submission = await db.getFormSubmissionById(input.id);
        if (!submission) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Form submission not found" });
        }
        return submission;
      }),

    getByWorkflow: protectedProcedure
      .input(z.object({ workflowId: z.string() }))
      .query(async ({ input }) => {
        const submissions = await db.getFormSubmissionsByWorkflow(input.workflowId);
        
        // Fetch templates for each submission
        const submissionsWithTemplates = await Promise.all(
          submissions.map(async (submission) => {
            const template = await db.getFormTemplateById(submission.templateId);
            return {
              ...submission,
              template,
            };
          })
        );
        
        return submissionsWithTemplates;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          formData: z.record(z.any()).optional(),
          submissionStatus: z.enum(["draft", "submitted", "approved", "rejected"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateFormSubmission(input.id, {
          formData: input.formData,
          submissionStatus: input.submissionStatus,
          submittedAt: input.submissionStatus === "submitted" ? new Date() : undefined,
        });
        
        await db.createAuditLog({
          entityType: "form_submission",
          entityId: input.id,
          action: "updated",
          actionDescription: `Form submission updated`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteFormSubmission(input.id);
        
        await db.createAuditLog({
          entityType: "form_submission",
          entityId: input.id,
          action: "deleted",
          actionDescription: `Form submission deleted`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),
  }),

  // ============================================
  // Sequence Generators
  // ============================================
  sequences: router({    getAll: adminProcedure.query(async () => {
      return await db.getAllSequenceCounters();
    }),

    getByType: adminProcedure
      .input(z.object({ type: z.enum(["MAF", "PR", "CATTO", "SKU", "PAF"]) }))
      .query(async ({ input }) => {
        return await db.getSequenceCountersByType(input.type);
      }),

    generate: protectedProcedure
      .input(z.object({ type: z.enum(["MAF", "PR", "CATTO", "SKU", "PAF"]) }))
      .mutation(async ({ input, ctx }) => {
        const sequenceNumber = await db.generateSequenceNumber(input.type);
        
        await db.createAuditLog({
          entityType: "sequence",
          entityId: sequenceNumber,
          action: "generated",
          actionDescription: `${input.type} sequence number generated: ${sequenceNumber}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { sequenceNumber };
      }),

    reset: adminProcedure
      .input(
        z.object({
          type: z.enum(["MAF", "PR", "CATTO", "SKU", "PAF"]),
          date: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.resetSequenceCounter(input.type, input.date);
        
        await db.createAuditLog({
          entityType: "sequence",
          entityId: `${input.type}-${input.date}`,
          action: "reset",
          actionDescription: `${input.type} sequence counter reset for ${input.date}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),
  }),
});

// ============================================
// Helper Functions
// ============================================

async function createInitialStages(
  workflowId: string,
  workflowType: "MAF" | "PR" | "CATTO",
  estimatedAmount?: number
): Promise<void> {
  if (workflowType === "MAF") {
    // MAF workflow stages
    const stages = [
      { order: 1, name: "PPIC Review", type: "approval", role: "PPIC" },
      { order: 2, name: "Purchasing Review", type: "approval", role: "Purchasing" },
    ];
    
    // Add financial approval stages based on amount
    if (estimatedAmount && estimatedAmount > 5000000) {
      stages.push({ order: 3, name: "CFO Approval", type: "approval", role: "CFO" });
      stages.push({ order: 4, name: "CEO/COO Approval", type: "approval", role: "CEO" });
    } else if (estimatedAmount && estimatedAmount > 1000000) {
      stages.push({ order: 3, name: "CFO Approval", type: "approval", role: "CFO" });
    }
    
    for (const stage of stages) {
      await db.createWorkflowStage({
        workflowId,
        stageOrder: stage.order,
        stageName: stage.name,
        stageType: stage.type,
        requiredRole: stage.role,
      });
    }
  } else if (workflowType === "PR") {
    // PR workflow stages
    const stages = [
      { order: 1, name: "Department Head Review", type: "approval", role: "admin" },
      { order: 2, name: "Finance Review", type: "approval", role: "Finance" },
      { order: 3, name: "CFO Approval", type: "approval", role: "CFO" },
    ];
    
    for (const stage of stages) {
      await db.createWorkflowStage({
        workflowId,
        stageOrder: stage.order,
        stageName: stage.name,
        stageType: stage.type,
        requiredRole: stage.role,
      });
    }
  } else if (workflowType === "CATTO") {
    // CATTO (Capital Approval) workflow stages
    const stages = [
      { order: 1, name: "Finance Review", type: "approval", role: "Finance" },
      { order: 2, name: "CFO Approval", type: "approval", role: "CFO" },
      { order: 3, name: "CEO Approval", type: "approval", role: "CEO" },
    ];
    
    for (const stage of stages) {
      await db.createWorkflowStage({
        workflowId,
        stageOrder: stage.order,
        stageName: stage.name,
        stageType: stage.type,
        requiredRole: stage.role,
      });
    }
  }
}

export type AppRouter = typeof appRouter;
