import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import * as db from "./db";
import { storagePut, storageGet } from "./storage";
import { randomUUID } from "crypto";
import { withCache, CACHE_TTL, invalidateAnalyticsCache } from "./analyticsCache";
import { triggerRemindersNow } from "./reminderScheduler";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Template router (defined before appRouter)
const templatesRouter = router({
  // Create new template
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      workflowType: z.string(),
      isDefault: z.boolean().optional(),
      stages: z.array(z.object({
        stageOrder: z.number(),
        stageName: z.string(),
        stageDescription: z.string().optional(),
        department: z.string().optional(),
        requiredRole: z.string().optional(),
        requiresOneOf: z.array(z.string()).optional(),
        approvalRequired: z.boolean(),
        fileUploadRequired: z.boolean(),
        notificationEmails: z.array(z.string()).optional(),
        visibleToDepartments: z.array(z.string()).optional(),
        approvalThreshold: z.number().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.createWorkflowTemplate({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  // Get all templates
  getAll: protectedProcedure
    .input(z.object({
      workflowType: z.string().optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getWorkflowTemplates(input || {});
    }),

  // Get template by ID with stages
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const template = await db.getWorkflowTemplateById(input.id);
      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }
      return template;
    }),

  // Get default template for workflow type
  getDefault: protectedProcedure
    .input(z.object({ workflowType: z.string() }))
    .query(async ({ input }) => {
      return await db.getDefaultTemplate(input.workflowType);
    }),

  // Update template
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      isDefault: z.boolean().optional(),
      isActive: z.boolean().optional(),
      stages: z.array(z.object({
        id: z.string().optional(),
        stageOrder: z.number(),
        stageName: z.string(),
        stageDescription: z.string().optional(),
        department: z.string().optional(),
        requiredRole: z.string().optional(),
        requiresOneOf: z.array(z.string()).optional(),
        approvalRequired: z.boolean(),
        fileUploadRequired: z.boolean(),
        notificationEmails: z.array(z.string()).optional(),
        visibleToDepartments: z.array(z.string()).optional(),
        approvalThreshold: z.number().optional(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return await db.updateWorkflowTemplate(id, updates);
    }),

  // Delete template
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.deleteWorkflowTemplate(input.id);
    }),
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
    // Get current user's profile with role
    me: protectedProcedure.query(async ({ ctx }) => {
      return ctx.user;
    }),

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

    // Bulk sync users from Cognito to database
    syncFromCognito: adminProcedure
      .mutation(async ({ ctx }) => {
        const { CognitoIdentityProviderClient, ListUsersCommand } = await import("@aws-sdk/client-cognito-identity-provider");
        
        const client = new CognitoIdentityProviderClient({
          region: process.env.VITE_COGNITO_REGION!,
        });

        const userPoolId = process.env.VITE_COGNITO_USER_POOL_ID!;
        let syncedCount = 0;
        let paginationToken: string | undefined;

        try {
          do {
            const command = new ListUsersCommand({
              UserPoolId: userPoolId,
              Limit: 60,
              PaginationToken: paginationToken,
            });

            const response = await client.send(command);
            
            if (response.Users) {
              for (const cognitoUser of response.Users) {
                const email = cognitoUser.Attributes?.find(attr => attr.Name === "email")?.Value;
                const sub = cognitoUser.Attributes?.find(attr => attr.Name === "sub")?.Value;
                const name = cognitoUser.Attributes?.find(attr => attr.Name === "name")?.Value;
                
                if (email && sub && email.endsWith("@compawnion.co")) {
                  // Upsert user to database
                  await db.upsertUser({
                    cognitoSub: sub,
                    openId: sub, // Use sub as openId for Cognito users
                    email: email,
                    fullName: name || email.split("@")[0],
                    role: email === "eddie.amintohir@compawnion.co" ? "admin" : "PPIC", // Default role
                  });
                  syncedCount++;
                }
              }
            }

            paginationToken = response.PaginationToken;
          } while (paginationToken);

          await db.createAuditLog({
            entityType: "user",
            entityId: "bulk",
            action: "bulk_sync",
            actionDescription: `Synced ${syncedCount} users from Cognito`,
            actorId: ctx.user.id,
            actorEmail: ctx.user.email,
            actorRole: ctx.user.role,
          });

          return { success: true, syncedCount };
        } catch (error: any) {
          console.error("Cognito sync error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to sync users from Cognito: ${error.message}`,
          });
        }
      }),
  }),

  // ============================================
  // Workflow Management
  // ============================================
  workflows: router({
    create: protectedProcedure
      .input(
        z.object({
          workflowType: z.string(),
          title: z.string(),
          description: z.string().optional(),
          department: z.string(),
          estimatedAmount: z.number().optional(),
          currency: z.string().optional(),
          requiresGa: z.boolean().optional(),
          requiresPpic: z.boolean().optional(),
          templateId: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const workflow = await db.createWorkflow({
          ...input,
          requesterId: ctx.user.id,
        });
        
        // Create stages from template if provided, otherwise use default logic
        if (input.templateId) {
          const template = await db.getWorkflowTemplateById(input.templateId);
          if (template && template.stages) {
            for (const stage of template.stages) {
              await db.createWorkflowStage({
                workflowId: workflow.id,
                stageOrder: stage.stageOrder,
                stageName: stage.stageName,
                stageType: stage.approvalRequired ? "approval" : "review",
                requiredRole: stage.requiredRole,
                requiresOneOf: stage.requiresOneOf,
                fileUploadRequired: stage.fileUploadRequired,
                notificationEmails: stage.notificationEmails,
                visibleToDepartments: stage.visibleToDepartments,
                approvalThreshold: stage.approvalThreshold,
              });
            }
          }
        } else {
          // Create initial stages based on workflow type (fallback)
          await createInitialStages(workflow.id, input.workflowType, input.estimatedAmount);
        }
        
        await db.createAuditLog({
          entityType: "workflow",
          entityId: workflow.id,
          action: "created",
          actionDescription: `${input.workflowType} workflow created: ${input.title}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        // Invalidate analytics cache
        invalidateAnalyticsCache();
        
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
      .query(async ({ input, ctx }) => {
        const workflow = await db.getWorkflowById(input.id);
        if (!workflow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
        }

        // Check if user has access to this workflow
        const accessCheck = await db.checkWorkflowAccess(
          input.id,
          ctx.user.id,
          ctx.user.role,
          ctx.user.department
        );

        if (!accessCheck.hasAccess) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: `Access denied: ${accessCheck.reason}` 
          });
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

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        // Only admin can delete workflows
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete workflows" });
        }
        
        const workflow = await db.getWorkflowById(input.id);
        if (!workflow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
        }
        
        // Delete workflow and all related data (cascade)
        await db.deleteWorkflow(input.id);
        
        await db.createAuditLog({
          entityType: "workflow",
          entityId: input.id,
          action: "deleted",
          actionDescription: `Workflow permanently deleted: ${workflow.title}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        // Invalidate analytics cache
        invalidateAnalyticsCache();
        
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

  // ============================================
  // Analytics
  // ============================================
  analytics: router({
    overview: protectedProcedure.query(async () => {
      return await withCache(
        'analytics:overview',
        CACHE_TTL.OVERVIEW,
        () => db.getWorkflowAnalytics()
      );
    }),

    byType: protectedProcedure.query(async () => {
      return await withCache(
        'analytics:byType',
        CACHE_TTL.BY_TYPE,
        () => db.getWorkflowsByType()
      );
    }),

    byDepartment: protectedProcedure.query(async () => {
      return await withCache(
        'analytics:byDepartment',
        CACHE_TTL.BY_DEPARTMENT,
        () => db.getWorkflowsByDepartment()
      );
    }),

    byStatus: protectedProcedure.query(async () => {
      return await withCache(
        'analytics:byStatus',
        CACHE_TTL.BY_STATUS,
        () => db.getWorkflowsByStatus()
      );
    }),

    avgTimeByType: protectedProcedure.query(async () => {
      return await withCache(
        'analytics:avgTimeByType',
        CACHE_TTL.AVG_TIME,
        () => db.getAvgApprovalTimeByType()
      );
    }),

    completionTrend: protectedProcedure
      .input(z.object({ days: z.number().optional().default(30) }))
      .query(async ({ input }) => {
        return await withCache(
          `analytics:completionTrend:${input.days}`,
          CACHE_TTL.COMPLETION_TREND,
          () => db.getWorkflowCompletionTrend(input.days)
        );
      }),

    timeline: protectedProcedure.query(async () => {
      return await withCache(
        'analytics:timeline',
        CACHE_TTL.TIMELINE,
        () => db.getWorkflowTimeline()
      );
    }),

    // Department-specific analytics with per-department caching
    departmentMetrics: protectedProcedure
      .input(z.object({ department: z.string() }))
      .query(async ({ input }) => {
        return await withCache(
          `analytics:departmentMetrics:${input.department}`,
          CACHE_TTL.DEPARTMENT_METRICS,
          () => db.getDepartmentMetrics(input.department)
        );
      }),

    departmentCostBreakdown: protectedProcedure
      .input(z.object({ 
        department: z.string(),
        period: z.enum(["monthly", "yearly"]).default("monthly")
      }))
      .query(async ({ input }) => {
        return await withCache(
          `analytics:costBreakdown:${input.department}:${input.period}`,
          CACHE_TTL.COST_BREAKDOWN,
          () => db.getDepartmentCostBreakdown(input.department, input.period)
        );
      }),
  }),

  // ============================================
  // Budget Management
  // ============================================
  budgets: router({
    create: protectedProcedure
      .input(z.object({
        department: z.string(),
        year: z.number(),
        month: z.number().optional(),
        quarter: z.number().optional(),
        allocatedAmount: z.number(),
        period: z.enum(['monthly', 'quarterly', 'yearly']),
      }))
      .mutation(async ({ input }) => {
        return await db.createBudget(input);
      }),

    getByDepartment: protectedProcedure
      .input(z.object({
        department: z.string(),
        year: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getBudgetsByDepartment(input.department, input.year);
      }),

    getAll: protectedProcedure
      .input(z.object({ year: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllBudgets(input.year);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        allocatedAmount: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateBudget(input.id, input.allocatedAmount);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteBudget(input.id);
        return { success: true };
      }),

    analytics: protectedProcedure
      .input(z.object({
        department: z.string(),
        year: z.number(),
        period: z.enum(['monthly', 'quarterly', 'yearly']),
      }))
      .query(async ({ input }) => {
        return await db.getDepartmentBudgetAnalytics(input.department, input.year, input.period);
      }),
  }),

  // ============================================
  // Workflow Templates
  // ============================================
  templates: templatesRouter,

  // ============================================
  // Email Reminders
  // ============================================
  reminders: router({
    // Manual trigger for testing (admin only)
    sendNow: adminProcedure.mutation(async () => {
      await triggerRemindersNow();
      return { success: true, message: "Reminders sent successfully" };
    }),
  }),

  // ============================================
  // Excel Template Management
  // ============================================
  excelTemplates: router({
    create: protectedProcedure
      .input(z.object({
        workflowType: z.string(),
        templateName: z.string(),
        description: z.string().optional(),
        fileUrl: z.string(),
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const result = await db.createExcelTemplate({
          ...input,
          uploadedBy: ctx.user.id,
        });
        
        await db.createAuditLog({
          entityType: "excel_template",
          entityId: result.insertId?.toString() || "unknown",
          action: "created",
          actionDescription: `Excel template created: ${input.templateName}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return result;
      }),

    getAll: protectedProcedure
      .query(async () => {
        return await db.getAllExcelTemplates();
      }),

    getActive: protectedProcedure
      .query(async () => {
        return await db.getActiveExcelTemplates();
      }),

    getByWorkflowType: protectedProcedure
      .input(z.object({ workflowType: z.string() }))
      .query(async ({ input }) => {
        return await db.getExcelTemplateByWorkflowType(input.workflowType);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        templateName: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        await db.updateExcelTemplate(id, updates);
        
        await db.createAuditLog({
          entityType: "excel_template",
          entityId: id.toString(),
          action: "updated",
          actionDescription: `Excel template updated`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteExcelTemplate(input.id);
        
        await db.createAuditLog({
          entityType: "excel_template",
          entityId: input.id.toString(),
          action: "deleted",
          actionDescription: `Excel template deleted`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true };
      }),

    uploadFile: protectedProcedure
      .input(z.object({
        workflowType: z.string(),
        templateName: z.string(),
        description: z.string().optional(),
        filename: z.string(),
        fileData: z.string(), // base64 encoded
        fileSize: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        // Convert base64 to buffer
        const fileBuffer = Buffer.from(input.fileData, "base64");
        
        // Upload to S3
        const fileKey = `excel-templates/${input.workflowType}/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(fileKey, fileBuffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        
        // Save to database
        const result = await db.createExcelTemplate({
          workflowType: input.workflowType,
          templateName: input.templateName,
          description: input.description,
          fileUrl: url,
          fileKey: fileKey,
          fileName: input.filename,
          fileSize: input.fileSize,
          uploadedBy: ctx.user.id,
        });
        
        await db.createAuditLog({
          entityType: "excel_template",
          entityId: result.insertId?.toString() || "unknown",
          action: "uploaded",
          actionDescription: `Excel template uploaded: ${input.templateName}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });
        
        return { success: true, url };
      }),
  }),
});

// ============================================
// Helper Functions
// ============================================

async function createInitialStages(workflowId: string,
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
