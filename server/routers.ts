import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "director") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  users: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum([
          "admin",
          "brand_manager",
          "ppic_manager",
          "production_manager",
          "purchasing_manager",
          "sales_manager",
          "pr_manager",
          "director"
        ]),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUserRole(input.userId, input.role);
        await db.logAudit({
          user_id: ctx.user.id,
          action: "user_role_updated",
          details: { targetUserId: input.userId, newRole: input.role },
        });
        return { success: true };
      }),
    
    updateStatus: adminProcedure
      .input(z.object({
        userId: z.number(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUserStatus(input.userId, input.isActive);
        await db.logAudit({
          user_id: ctx.user.id,
          action: "user_status_updated",
          details: { targetUserId: input.userId, isActive: input.isActive },
        });
        return { success: true };
      }),
  }),

  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Admins and directors see all projects
      if (ctx.user.role === "admin" || ctx.user.role === "director") {
        return await db.getAllProjects();
      }
      // Others see only their assigned projects
      return await db.getProjectsByUser(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        return project;
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        isOem: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Generate sequences
        const sku = await db.generateSequence("sku", ctx.user.id);
        const pafSequence = input.isOem ? await db.generateSequence("paf", ctx.user.id) : undefined;
        const mafSequence = !input.isOem ? await db.generateSequence("maf", ctx.user.id) : undefined;
        
        const projectId = await db.createProject({
          name: input.name,
          is_oem: input.isOem,
          sku,
          paf_sequence: pafSequence,
          maf_sequence: mafSequence,
          created_by: ctx.user.id,
          status: "in_progress",
        });
        
        // Create milestones based on workflow type
        if (input.isOem) {
          // OEM Workflow: Brand (PAF) → PR → PPIC → Production/Sales
          await db.createMilestone({
            project_id: projectId,
            name: "PAF Submission",
            stage: 1,
            approver_role: "brand_manager",
            status: "in_progress",
            is_view_only: false,
          });
          await db.createMilestone({
            project_id: projectId,
            name: "PR Review",
            stage: 2,
            approver_role: "pr_manager",
            status: "pending",
            is_view_only: false,
          });
          await db.createMilestone({
            project_id: projectId,
            name: "PPIC Review",
            stage: 3,
            approver_role: "ppic_manager",
            status: "pending",
            is_view_only: false,
          });
          await db.createMilestone({
            project_id: projectId,
            name: "Production Complete",
            stage: 4,
            approver_role: "production_manager",
            status: "pending",
            is_view_only: false,
          });
          await db.createMilestone({
            project_id: projectId,
            name: "Sales View",
            stage: 4,
            approver_role: "sales_manager",
            status: "pending",
            is_view_only: true,
          });
        } else {
          // Standard Workflow: Brand (PR & MAF) → PPIC → Production/Purchasing/Sales
          await db.createMilestone({
            project_id: projectId,
            name: "Brand PR & MAF",
            stage: 1,
            approver_role: "brand_manager",
            status: "in_progress",
            is_view_only: false,
          });
          await db.createMilestone({
            project_id: projectId,
            name: "PPIC Review",
            stage: 2,
            approver_role: "ppic_manager",
            status: "pending",
            is_view_only: false,
          });
          await db.createMilestone({
            project_id: projectId,
            name: "Production Approval",
            stage: 3,
            approver_role: "production_manager",
            status: "pending",
            is_view_only: false,
          });
          await db.createMilestone({
            project_id: projectId,
            name: "Purchasing Approval",
            stage: 3,
            approver_role: "purchasing_manager",
            status: "pending",
            is_view_only: false,
          });
          await db.createMilestone({
            project_id: projectId,
            name: "Sales View",
            stage: 3,
            approver_role: "sales_manager",
            status: "pending",
            is_view_only: true,
          });
        }
        
        await db.logAudit({
          user_id: ctx.user.id,
          project_id: projectId,
          action: "project_created",
          details: { name: input.name, isOem: input.isOem, sku },
        });
        
        return { projectId, sku };
      }),
    
    discontinue: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateProjectStatus(input.projectId, "discontinued");
        await db.logAudit({
          user_id: ctx.user.id,
          project_id: input.projectId,
          action: "project_discontinued",
          details: { reason: input.reason },
        });
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({
        projectId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        
        // Log before deletion
        await db.logAudit({
          user_id: ctx.user.id,
          project_id: input.projectId,
          action: "project_deleted",
          details: { projectName: project.name, sku: project.sku },
        });
        
        // Delete project (cascade will handle related records)
        await db.deleteProject(input.projectId);
        
        return { success: true };
      }),
  }),

  milestones: router({
    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMilestonesByProject(input.projectId);
      }),
    
    approve: protectedProcedure
      .input(z.object({
        milestoneId: z.number(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const milestone = await db.getMilestoneById(input.milestoneId);
        if (!milestone) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Milestone not found" });
        }
        
        // Check if user has permission to approve this milestone
        if (milestone.approver_role !== ctx.user.role && ctx.user.role !== "admin" && ctx.user.role !== "director") {
          throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to approve this milestone" });
        }
        
        // Create approval record
        await db.createApproval({
          milestone_id: input.milestoneId,
          project_id: milestone.project_id,
          approver_id: ctx.user.id,
          status: "approved",
          comments: input.comments,
        });
        
        // Update milestone status
        await db.updateMilestoneStatus(input.milestoneId, "completed");
        
        // Check if all milestones in the same stage are completed
        const allMilestones = await db.getMilestonesByProject(milestone.project_id);
        const sameStageMilestones = allMilestones.filter(m => m.stage === milestone.stage && !m.is_view_only);
        const allCompleted = sameStageMilestones.every(m => m.id === input.milestoneId || m.status === "completed");
        
        if (allCompleted) {
          // Move to next stage
          const nextStageMilestones = allMilestones.filter(m => m.stage === milestone.stage + 1);
          for (const nextMilestone of nextStageMilestones) {
            await db.updateMilestoneStatus(nextMilestone.id, "in_progress");
          }
          
          // Update project stage
          await db.updateProject(milestone.project_id, { current_stage: milestone.stage + 1 });
          
          // Check if project is complete
          const maxStage = Math.max(...allMilestones.map(m => m.stage));
          if (milestone.stage === maxStage) {
            await db.updateProjectStatus(milestone.project_id, "completed");
          }
        }
        
        await db.logAudit({
          user_id: ctx.user.id,
          project_id: milestone.project_id,
          action: "milestone_approved",
          details: { milestoneId: input.milestoneId, milestoneName: milestone.name, comments: input.comments },
        });
        
        return { success: true };
      }),
    
    reject: protectedProcedure
      .input(z.object({
        milestoneId: z.number(),
        comments: z.string().min(1, "Comments are required for rejection"),
      }))
      .mutation(async ({ input, ctx }) => {
        const milestone = await db.getMilestoneById(input.milestoneId);
        if (!milestone) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Milestone not found" });
        }
        
        // Check if user has permission to reject this milestone
        if (milestone.approver_role !== ctx.user.role && ctx.user.role !== "admin" && ctx.user.role !== "director") {
          throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to reject this milestone" });
        }
        
        // Create approval record with rejected status
        await db.createApproval({
          milestone_id: input.milestoneId,
          project_id: milestone.project_id,
          approver_id: ctx.user.id,
          status: "rejected",
          comments: input.comments,
        });
        
        // Update milestone status
        await db.updateMilestoneStatus(input.milestoneId, "rejected");
        
        // Move back to previous stage
        if (milestone.stage > 1) {
          const allMilestones = await db.getMilestonesByProject(milestone.project_id);
          const prevStageMilestones = allMilestones.filter(m => m.stage === milestone.stage - 1);
          for (const prevMilestone of prevStageMilestones) {
            await db.updateMilestoneStatus(prevMilestone.id, "in_progress");
          }
          await db.updateProject(milestone.project_id, { current_stage: milestone.stage - 1 });
        }
        
        await db.logAudit({
          user_id: ctx.user.id,
          project_id: milestone.project_id,
          action: "milestone_rejected",
          details: { milestoneId: input.milestoneId, milestoneName: milestone.name, comments: input.comments },
        });
        
        return { success: true };
      }),
  }),

  audit: router({
    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAuditTrailByProject(input.projectId);
      }),
  }),

  forms: router({
    getByMilestone: protectedProcedure
      .input(z.object({ milestoneId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFormsByMilestone(input.milestoneId);
      }),
    
    upload: protectedProcedure
      .input(z.object({
        milestoneId: z.number(),
        fileName: z.string(),
        fileType: z.string(),
        fileData: z.string(), // Base64 encoded file data
      }))
      .mutation(async ({ input, ctx }) => {
        const milestone = await db.getMilestoneById(input.milestoneId);
        if (!milestone) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Milestone not found" });
        }
        
        const { storagePut } = await import("./storage");
        
        // Generate a unique S3 key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const s3Key = `projects/${milestone.project_id}/milestones/${input.milestoneId}/${timestamp}-${randomSuffix}-${input.fileName}`;
        
        // Decode base64 and upload to S3
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        await storagePut(s3Key, fileBuffer, input.fileType);
        
        // Get presigned URL for download
        const { storageGet } = await import("./storage");
        const { url } = await storageGet(s3Key, 3600 * 24 * 7); // 7 days expiry
        
        // Create form record
        const formId = await db.createForm({
          project_id: milestone.project_id,
          milestone_id: input.milestoneId,
          name: input.fileName,
          s3_key: s3Key,
          s3_url: url,
          file_size: fileBuffer.length,
          uploaded_by: ctx.user.id,
        });
        
        await db.logAudit({
          user_id: ctx.user.id,
          project_id: milestone.project_id,
          action: "form_uploaded",
          details: { formId, milestoneId: input.milestoneId, fileName: input.fileName },
        });
        
        return { formId, s3Key };
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        milestoneId: z.number(),
        name: z.string(),
        s3Key: z.string(),
        fileSize: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storageGet } = await import("./storage");
        
        // Generate presigned URL for the uploaded file
        const { url } = await storageGet(input.s3Key, 3600 * 24 * 7); // 7 days expiry
        
        const formId = await db.createForm({
          project_id: input.projectId,
          milestone_id: input.milestoneId,
          name: input.name,
          s3_key: input.s3Key,
          s3_url: url,
          file_size: input.fileSize,
          uploaded_by: ctx.user.id,
        });
        
        await db.logAudit({
          user_id: ctx.user.id,
          project_id: input.projectId,
          action: "form_uploaded",
          details: { formId, milestoneId: input.milestoneId, fileName: input.name },
        });
        
        return { formId };
      }),
    
    download: protectedProcedure
      .input(z.object({ formId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const forms = await db.getFormsByProject(0); // Get all forms
        const form = forms.find(f => f.id === input.formId);
        
        if (!form) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
        }
        
        const { storageGet } = await import("./storage");
        const { url } = await storageGet(form.s3_key, 3600); // 1 hour expiry
        
        await db.logAudit({
          user_id: ctx.user.id,
          project_id: form.project_id,
          action: "form_downloaded",
          details: { formId: input.formId, fileName: form.name },
        });
        
        return { url, fileName: form.name };
      }),
  }),
});

export type AppRouter = typeof appRouter;
