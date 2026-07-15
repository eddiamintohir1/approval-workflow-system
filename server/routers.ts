import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import * as db from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut, storageGet } from "./storage";
import { randomUUID } from "crypto";
import {
  withCache,
  CACHE_TTL,
  invalidateAnalyticsCache,
} from "./analyticsCache";
import { triggerRemindersNow } from "./reminderScheduler";
import {
  sendMilestoneCompletionEmail,
  sendCompletionEmail,
  sendRejectionEmail,
} from "./email";
import { documentSequenceRouter } from "./routers/documentSequence";
import { skuGeneratorRouter } from "./routers/skuGenerator";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { listMicrosoftDirectoryUsers } from "./microsoft-graph";
import {
  buildProcessingFields,
  deriveProcessingStatus,
} from "./formProcessing";

const APP_BASE_URL = (
  process.env.VITE_APP_URL || "https://approval-workflow-system-nine.vercel.app"
).replace(/\/$/, "");

function validateFieldMappings(
  fields: Array<{ mappingKey?: string; showInTable?: boolean }>
): void {
  const mappingKeys = fields
    .map(field => field.mappingKey?.trim())
    .filter((key): key is string => Boolean(key));
  if (new Set(mappingKeys).size !== mappingKeys.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Mapping keys must be unique within a form template",
    });
  }
  if (fields.some(field => field.showInTable && !field.mappingKey?.trim())) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Fields shown in the processing inbox require a mapping key",
    });
  }
}

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

// ============================================
// Task Assignments Router
// ============================================
const assignmentsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        assignedTo: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only dept heads can assign tasks
      const deptHeadRoles = [
        "PPIC",
        "Purchasing",
        "Finance",
        "Sales",
        "GA",
        "Brand Manager",
        "PR Manager",
      ];
      if (!deptHeadRoles.includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only department heads can assign tasks",
        });
      }

      return await db.createTaskAssignment({
        workflowId: input.workflowId,
        assignedTo: input.assignedTo,
        assignedBy: ctx.user.id,
      });
    }),

  getByUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTaskAssignmentsByUser(input.userId);
    }),

  getTeamAssignments: protectedProcedure.query(async ({ ctx }) => {
    return await db.getTeamAssignments(ctx.user.id);
  }),
});

// ============================================
// Performance Metrics Router
// ============================================
const metricsRouter = router({
  calculateUserMetrics: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      return await db.calculateUserMetrics(input.userId);
    }),

  getUserMetrics: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.getUserMetrics(input.userId);
    }),

  recalculateAll: adminProcedure.mutation(async () => {
    return await db.recalculateAllMetrics();
  }),
});

// ============================================
// Salary Integration Router
// ============================================
const salaryRouter = router({
  syncFromQapita: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        salaryAmount: z.number(),
        currency: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Integrate with Qapita API when credentials are provided
      return await db.upsertSalaryCache(input);
    }),

  getUserSalary: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Only admin/CEO/CFO/COO can view salaries
      const allowedRoles = ["admin", "CEO", "CFO", "COO"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view salary data",
        });
      }

      return await db.getUserSalary(input.userId);
    }),

  syncAll: adminProcedure.mutation(async () => {
    // TODO: Implement batch sync from Qapita API
    return { success: true, message: "Qapita API integration pending" };
  }),
});

// ============================================
// Capacity Management Router
// ============================================
const capacityRouter = router({
  getUserList: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        department: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Only admin/CEO/CFO/COO/Exec Asst can access capacity page
      const allowedRoles = ["admin", "CEO", "CFO", "COO", "Exec Asst"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to access capacity management",
        });
      }

      return await db.getUserListPaginated({
        ...input,
        managerId: input.department === "My Team" ? ctx.user.id : undefined,
      });
    }),

  getUserDetails: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Get or calculate metrics
      let metrics = await db.getUserMetrics(input.userId);
      if (!metrics) {
        metrics = await db.calculateUserMetrics(input.userId);
      }

      // Get salary if authorized
      const allowedRoles = ["admin", "CEO", "CFO", "COO"];
      const salary = allowedRoles.includes(ctx.user.role)
        ? await db.getUserSalary(input.userId)
        : null;

      return { metrics, salary };
    }),
});

// Template router (defined before appRouter)
const templatesRouter = router({
  // Create new template
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        workflowType: z.string(),
        isDefault: z.boolean().optional(),
        stages: z.array(
          z.object({
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
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.createWorkflowTemplate({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  // Get all templates
  getAll: protectedProcedure
    .input(
      z
        .object({
          workflowType: z.string().optional(),
          isActive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return await db.getWorkflowTemplates(input || {});
    }),

  // Get template by ID with stages
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const template = await db.getWorkflowTemplateById(input.id);
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
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
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
        stages: z
          .array(
            z.object({
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
            })
          )
          .optional(),
      })
    )
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

  // Toggle quick assign for template
  toggleQuickAssign: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isQuickAssignEnabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      return await db.updateWorkflowTemplate(input.id, {
        isQuickAssignEnabled: input.isQuickAssignEnabled,
      });
    }),

  // Get templates enabled for quick assign
  getQuickAssignTemplates: protectedProcedure.query(async () => {
    return await db.getWorkflowTemplates({
      isActive: true,
      isQuickAssignEnabled: true,
    });
  }),
});

export const appRouter = router({
  system: systemRouter,

  // ============================================
  // Authentication
  // ============================================
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(async ({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: -1,
      });
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
          role: z.enum([
            "CEO",
            "COO",
            "CFO",
            "Exec Asst",
            "PPIC",
            "Purchasing",
            "GA",
            "Finance",
            "Production",
            "Logistics",
            "R&D",
            "Sales",
            "Marketing",
            "Operations",
            "Staff",
            "admin",
          ]),
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

    // Pin workflow
    pinWorkflow: protectedProcedure
      .input(z.object({ workflowId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const currentPinned = ctx.user.pinnedWorkflows || [];
        if (currentPinned.includes(input.workflowId)) {
          return { success: true, message: "Already pinned" };
        }
        await db.updateUserPinnedWorkflows(ctx.user.id, [
          ...currentPinned,
          input.workflowId,
        ]);
        return { success: true };
      }),

    // Unpin workflow
    unpinWorkflow: protectedProcedure
      .input(z.object({ workflowId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const currentPinned = ctx.user.pinnedWorkflows || [];
        const updated = currentPinned.filter(id => id !== input.workflowId);
        await db.updateUserPinnedWorkflows(ctx.user.id, updated);
        return { success: true };
      }),

    // Switch role for test user only
    switchRole: protectedProcedure
      .input(
        z.object({
          role: z.enum([
            "CEO",
            "COO",
            "CFO",
            "Exec Asst",
            "PPIC",
            "Purchasing",
            "GA",
            "Finance",
            "Production",
            "Logistics",
            "R&D",
            "Sales",
            "Marketing",
            "Operations",
            "Staff",
            "admin",
          ]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Only allow test user to switch roles
        if (ctx.user.email !== "test@compawnion.co") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Role switching is only available for test user",
          });
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

    // Bulk sync active @compawnion.co users from Microsoft Entra ID.
    syncFromMicrosoft: adminProcedure.mutation(async ({ ctx }) => {
      let syncedCount = 0;

      try {
        const directoryUsers = await listMicrosoftDirectoryUsers();
        for (const directoryUser of directoryUsers) {
          const email = (
            directoryUser.mail ||
            directoryUser.userPrincipalName ||
            ""
          ).toLowerCase();
          if (
            !directoryUser.id ||
            directoryUser.accountEnabled === false ||
            !email.endsWith("@compawnion.co")
          ) {
            continue;
          }

          await db.upsertUser({
            // Retained for database compatibility until the column is renamed.
            cognitoSub: directoryUser.id,
            openId: directoryUser.id,
            email,
            fullName: directoryUser.displayName || email.split("@")[0],
            role: email === "eddie.amintohir@compawnion.co" ? "admin" : "PPIC",
          });
          syncedCount++;
        }

        await db.createAuditLog({
          entityType: "user",
          entityId: "bulk",
          action: "bulk_sync",
          actionDescription: `Synced ${syncedCount} users from Microsoft Entra ID`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });

        return { success: true, syncedCount };
      } catch (error: any) {
        console.error("Microsoft Entra sync error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to sync users from Microsoft Entra ID: ${error.message}`,
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
          contingencyWorkflowIds: z.array(z.string()).optional(),
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
          await createInitialStages(
            workflow.id,
            input.workflowType,
            input.estimatedAmount
          );
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

    createFromTemplate: protectedProcedure
      .input(
        z.object({
          templateId: z.string(),
          assignToUserId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get template
        const template = await db.getWorkflowTemplateById(input.templateId);
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        // Create workflow from template
        const workflow = await db.createWorkflow({
          workflowType: template.workflowType,
          title: `${template.name} - ${new Date().toLocaleDateString()}`,
          description: template.description || "",
          department: ctx.user.role,
          requesterId: ctx.user.id,
          templateId: input.templateId,
        });

        // Create stages from template
        if (template.stages) {
          for (const stage of template.stages) {
            await db.createWorkflowStage({
              workflowId: workflow.id,
              stageOrder: stage.stageOrder,
              stageName: stage.stageName,
              stageType: stage.approvalRequired ? "approval" : "review",
              requiredRole: stage.requiredRole,
              requiresOneOf: stage.requiresOneOf,
              requiresFileUpload: stage.requiresFileUpload,
              visibleToDepartments: stage.visibleToDepartments,
            });
          }
        }

        return workflow;
      }),

    search: protectedProcedure
      .input(
        z.object({
          query: z.string(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const limit = input.limit || 20;
        const workflows =
          ctx.user.role === "admin"
            ? await db.getAllWorkflows()
            : await db.getWorkflowsByRequester(ctx.user.id);

        // Simple search by title or workflow number
        const filtered = workflows.filter(
          w =>
            w.title.toLowerCase().includes(input.query.toLowerCase()) ||
            w.workflowNumber.toLowerCase().includes(input.query.toLowerCase())
        );

        return filtered.slice(0, limit);
      }),

    getByIds: protectedProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .query(async ({ input }) => {
        return await Promise.all(input.ids.map(id => db.getWorkflowById(id)));
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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
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
            message: `Access denied: ${accessCheck.reason}`,
          });
        }

        return workflow;
      }),

    getWithDetails: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const workflow = await db.getWorkflowById(input.id);
        if (!workflow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
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
      .input(
        z.object({
          id: z.string(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const workflow = await db.getWorkflowById(input.id);
        if (!workflow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
        }

        // Only requester or admin can discontinue
        if (workflow.requesterId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to discontinue this workflow",
          });
        }

        // Cannot discontinue already completed or discontinued workflows
        if (
          ["completed", "discontinued", "archived"].includes(
            workflow.overallStatus
          )
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot discontinue ${workflow.overallStatus} workflow`,
          });
        }

        await db.discontinueWorkflow(input.id, input.reason);

        await db.createAuditLog({
          entityType: "workflow",
          entityId: input.id,
          action: "discontinued",
          actionDescription: `Workflow discontinued${input.reason ? `: ${input.reason}` : ""}`,
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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
        }

        // Only admin can archive
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can archive workflows",
          });
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
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can delete workflows",
          });
        }

        const workflow = await db.getWorkflowById(input.id);
        if (!workflow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
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
          status: z.enum([
            "draft",
            "in_progress",
            "completed",
            "rejected",
            "cancelled",
          ]),
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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Stage not found",
          });
        }

        // Check if user has permission to approve this stage
        if (
          stage.requiredRole &&
          ctx.user.role !== stage.requiredRole &&
          ctx.user.role !== "admin"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to approve this stage",
          });
        }

        // Check if form has been uploaded for this stage (except CEO/CFO/admin who have bypass)
        if (
          ctx.user.role !== "CEO" &&
          ctx.user.role !== "CFO" &&
          ctx.user.role !== "admin"
        ) {
          const stageFiles = await db.getFilesByStage(input.stageId);
          const userUploadedFile = stageFiles.find(
            f => f.uploadedBy === ctx.user.id
          );

          if (!userUploadedFile) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "You must upload a form before approving this stage",
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

        // Get workflow details for email notifications
        const workflow = await db.getWorkflowById(input.workflowId);
        if (!workflow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workflow not found",
          });
        }

        // Check if this was the last stage
        const stages = await db.getStagesByWorkflow(input.workflowId);
        const currentStageIndex = stages.findIndex(s => s.id === input.stageId);

        if (currentStageIndex < stages.length - 1) {
          // Move to next stage
          const nextStage = stages[currentStageIndex + 1];
          await db.updateStageStatus(nextStage.id, "in_progress");

          // Send email notification to next approver
          if (nextStage.requiredRole) {
            const nextApprovers = await db.getUsersByRole(
              nextStage.requiredRole
            );
            for (const approver of nextApprovers) {
              try {
                await sendMilestoneCompletionEmail(
                  {
                    workflowNumber: workflow.workflowNumber,
                    workflowTitle: workflow.title,
                    milestoneName: nextStage.stageName,
                    approverName: approver.fullName,
                    approverEmail: approver.email,
                    workflowUrl: `${APP_BASE_URL}/workflows/${workflow.id}`,
                    completedBy: ctx.user.fullName,
                  },
                  workflow.id,
                  ctx.user.email
                ); // Pass logged-in user's email
              } catch (emailError) {
                console.error(
                  `Failed to send email to ${approver.email}:`,
                  emailError
                );
                // Don't fail the approval if email fails
              }
            }
          }
        } else {
          // This is the last stage - check contingency workflows before completing
          const workflow = await db.getWorkflowById(input.workflowId);

          if (
            workflow?.contingencyWorkflowIds &&
            workflow.contingencyWorkflowIds.length > 0
          ) {
            // Check if all contingency workflows are completed
            const contingencyWorkflows = await Promise.all(
              workflow.contingencyWorkflowIds.map(id => db.getWorkflowById(id))
            );

            const incompleteContingencies = contingencyWorkflows.filter(
              w => w && w.overallStatus !== "completed"
            );

            if (incompleteContingencies.length > 0) {
              const names = incompleteContingencies
                .map(w => w?.title || "Unknown")
                .join(", ");
              throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: `Cannot complete workflow. The following contingency workflows must be completed first: ${names}`,
              });
            }
          }

          // All contingencies satisfied - complete workflow
          await db.updateWorkflowStatus(input.workflowId, "completed");

          // Send completion email to workflow creator
          const creator = await db.getUserById(workflow.requesterId);
          if (creator) {
            try {
              await sendCompletionEmail(
                {
                  workflowNumber: workflow.workflowNumber,
                  workflowTitle: workflow.title,
                  completedAt: new Date().toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Jakarta",
                  }),
                  recipientName: creator.fullName,
                  recipientEmail: creator.email,
                  workflowUrl: `${APP_BASE_URL}/workflows/${workflow.id}`,
                },
                workflow.id,
                ctx.user.email
              ); // Pass logged-in user's email (final approver)
            } catch (emailError) {
              console.error(
                `Failed to send completion email to ${creator.email}:`,
                emailError
              );
              // Don't fail the approval if email fails
            }
          }
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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Stage not found",
          });
        }

        // Check if user has permission to reject this stage
        if (
          stage.requiredRole &&
          ctx.user.role !== stage.requiredRole &&
          ctx.user.role !== "admin"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to reject this stage",
          });
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

        // Send rejection email to workflow creator
        const workflow = await db.getWorkflowById(input.workflowId);
        if (workflow) {
          const creator = await db.getUserById(workflow.requesterId);
          if (creator) {
            try {
              await sendRejectionEmail(
                {
                  workflowNumber: workflow.workflowNumber,
                  workflowTitle: workflow.title,
                  milestoneName: stage.stageName,
                  rejectedBy: ctx.user.fullName,
                  rejectionReason: input.comments,
                  creatorName: creator.fullName,
                  creatorEmail: creator.email,
                  workflowUrl: `${APP_BASE_URL}/workflows/${workflow.id}`,
                },
                workflow.id,
                ctx.user.email
              ); // Pass logged-in user's email (rejector)
            } catch (emailError) {
              console.error(
                `Failed to send rejection email to ${creator.email}:`,
                emailError
              );
              // Don't fail the rejection if email fails
            }
          }
        }

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

        // Upload to Azure Blob Storage.
        const storageKey = `workflows/${input.workflowId}/${randomUUID()}-${input.fileName}`;
        const { url } = await storagePut(
          storageKey,
          fileBuffer,
          input.mimeType
        );

        // Create file record
        const file = await db.createWorkflowFile({
          workflowId: input.workflowId,
          stageId: input.stageId,
          fileName: input.fileName,
          fileType: input.fileType,
          fileCategory: input.fileCategory,
          // Legacy database column names retained until the storage schema migration.
          s3Bucket:
            process.env.AZURE_STORAGE_CONTAINER || "finance-attachments",
          s3Key: storageKey,
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
              type: z.enum([
                "text",
                "number",
                "date",
                "dropdown",
                "textarea",
                "file",
                "checkbox",
                "email",
              ]),
              label: z.string(),
              placeholder: z.string().optional(),
              required: z.boolean(),
              options: z.array(z.string()).optional(),
              validation: z
                .object({
                  min: z.number().optional(),
                  max: z.number().optional(),
                  pattern: z.string().optional(),
                  message: z.string().optional(),
                })
                .optional(),
              defaultValue: z.any().optional(),
              mappingKey: z.string().optional(),
              showInTable: z.boolean().optional(),
              tableLabel: z.string().optional(),
              tableOrder: z.number().int().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        validateFieldMappings(input.fields);
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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Form template not found",
          });
        }
        return template;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          templateName: z.string().optional(),
          description: z.string().optional(),
          fields: z
            .array(
              z.object({
                id: z.string(),
                type: z.enum([
                  "text",
                  "number",
                  "date",
                  "dropdown",
                  "textarea",
                  "file",
                  "checkbox",
                  "email",
                ]),
                label: z.string(),
                placeholder: z.string().optional(),
                required: z.boolean(),
                options: z.array(z.string()).optional(),
                validation: z
                  .object({
                    min: z.number().optional(),
                    max: z.number().optional(),
                    pattern: z.string().optional(),
                    message: z.string().optional(),
                  })
                  .optional(),
                defaultValue: z.any().optional(),
                mappingKey: z.string().optional(),
                showInTable: z.boolean().optional(),
                tableLabel: z.string().optional(),
                tableOrder: z.number().int().optional(),
              })
            )
            .optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (input.fields) validateFieldMappings(input.fields);
        const existingTemplate = await db.getFormTemplateById(input.id);
        if (!existingTemplate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Form template not found",
          });
        }
        await db.updateFormTemplate(input.id, {
          templateName: input.templateName,
          description: input.description,
          fields: input.fields,
          isActive: input.isActive,
          version: existingTemplate.version + 1,
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
          templateId: z
            .union([z.string(), z.number()])
            .transform(val => String(val)),
          workflowId: z.string().optional(),
          stageId: z.string().optional(),
          formData: z.record(z.any()),
          submissionStatus: z
            .enum(["draft", "submitted", "approved", "rejected"])
            .optional(),
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
          submittedAt:
            input.submissionStatus === "submitted" ? new Date() : undefined,
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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Form submission not found",
          });
        }
        return submission;
      }),

    getByWorkflow: protectedProcedure
      .input(z.object({ workflowId: z.string() }))
      .query(async ({ input }) => {
        const submissions = await db.getFormSubmissionsByWorkflow(
          input.workflowId
        );

        // Fetch templates for each submission
        const submissionsWithTemplates = await Promise.all(
          submissions.map(async submission => {
            const template = await db.getFormTemplateById(
              submission.templateId
            );
            return {
              ...submission,
              template,
            };
          })
        );

        return submissionsWithTemplates;
      }),

    getProcessingInbox: adminProcedure.query(async () => {
      const rows = await db.getFormSubmissionsForProcessing();
      const workflowIds = rows.flatMap(row =>
        row.workflow ? [row.workflow.id] : []
      );
      const allStages = await db.getStagesByWorkflowIds(workflowIds);
      const stagesByWorkflow = new Map<string, typeof allStages>();
      allStages.forEach(stage => {
        const stages = stagesByWorkflow.get(stage.workflowId) || [];
        stages.push(stage);
        stagesByWorkflow.set(stage.workflowId, stages);
      });

      return rows.map(({ submission, template, workflow, submitter }) => {
        const fields = template.fields || [];
        const { missingFields, mappedFields } = buildProcessingFields(
          fields,
          submission.formData
        );

        const stages = workflow ? stagesByWorkflow.get(workflow.id) || [] : [];
        const activeStage = stages.find(stage =>
          ["pending", "in_progress"].includes(stage.status)
        );
        const hasProgress = stages.some(stage =>
          ["in_progress", "completed"].includes(stage.status)
        );

        const processingStatus = deriveProcessingStatus({
          workflowCompleted: workflow?.overallStatus === "completed",
          missingFieldCount: missingFields.length,
          submissionIsDraft: submission.submissionStatus === "draft",
          hasWorkflowProgress: hasProgress,
        });

        return {
          submissionId: submission.id,
          workflowId: workflow?.id || null,
          workflowNumber: workflow?.workflowNumber || null,
          workflowTitle: workflow?.title || null,
          templateId: template.id,
          templateName: template.templateName,
          submitterName: submitter?.fullName || "Unknown user",
          submitterEmail: submitter?.email || null,
          processingStatus,
          missingFields,
          mappedFields,
          activeStage: activeStage
            ? {
                id: activeStage.id,
                name: activeStage.stageName,
                requiredRole: activeStage.requiredRole,
                isFinal: stages.at(-1)?.id === activeStage.id,
              }
            : null,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          completedAt: workflow?.completedAt || null,
        };
      });
    }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          formData: z.record(z.any()).optional(),
          submissionStatus: z
            .enum(["draft", "submitted", "approved", "rejected"])
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const submission = await db.getFormSubmissionById(input.id);
        if (!submission) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Form submission not found",
          });
        }
        if (
          submission.submittedBy !== ctx.user.id &&
          ctx.user.role !== "admin"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only update your own form submissions",
          });
        }
        await db.updateFormSubmission(input.id, {
          formData: input.formData,
          submissionStatus: input.submissionStatus,
          submittedAt:
            input.submissionStatus === "submitted" ? new Date() : undefined,
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
  sequences: router({
    getAll: adminProcedure.query(async () => {
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
      return await withCache("analytics:overview", CACHE_TTL.OVERVIEW, () =>
        db.getWorkflowAnalytics()
      );
    }),

    byType: protectedProcedure.query(async () => {
      return await withCache("analytics:byType", CACHE_TTL.BY_TYPE, () =>
        db.getWorkflowsByType()
      );
    }),

    byDepartment: protectedProcedure.query(async () => {
      return await withCache(
        "analytics:byDepartment",
        CACHE_TTL.BY_DEPARTMENT,
        () => db.getWorkflowsByDepartment()
      );
    }),

    byStatus: protectedProcedure.query(async () => {
      return await withCache("analytics:byStatus", CACHE_TTL.BY_STATUS, () =>
        db.getWorkflowsByStatus()
      );
    }),

    avgTimeByType: protectedProcedure.query(async () => {
      return await withCache(
        "analytics:avgTimeByType",
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
      return await withCache("analytics:timeline", CACHE_TTL.TIMELINE, () =>
        db.getWorkflowTimeline()
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
      .input(
        z.object({
          department: z.string(),
          period: z.enum(["monthly", "yearly"]).default("monthly"),
        })
      )
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
      .input(
        z.object({
          department: z.string(),
          year: z.number(),
          month: z.number().optional(),
          quarter: z.number().optional(),
          allocatedAmount: z.number(),
          period: z.enum(["monthly", "quarterly", "yearly"]),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createBudget(input);
      }),

    getByDepartment: protectedProcedure
      .input(
        z.object({
          department: z.string(),
          year: z.number(),
        })
      )
      .query(async ({ input }) => {
        return await db.getBudgetsByDepartment(input.department, input.year);
      }),

    getAll: protectedProcedure
      .input(z.object({ year: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllBudgets(input.year);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          allocatedAmount: z.number(),
        })
      )
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
      .input(
        z.object({
          department: z.string(),
          year: z.number(),
          period: z.enum(["monthly", "quarterly", "yearly"]),
        })
      )
      .query(async ({ input }) => {
        return await db.getDepartmentBudgetAnalytics(
          input.department,
          input.year,
          input.period
        );
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
      .input(
        z.object({
          workflowType: z.string(),
          templateName: z.string(),
          description: z.string().optional(),
          fileUrl: z.string(),
          fileKey: z.string(),
          fileName: z.string(),
          fileSize: z.number().optional(),
        })
      )
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

    getAll: protectedProcedure.query(async () => {
      return await db.getAllExcelTemplates();
    }),

    getActive: protectedProcedure.query(async () => {
      return await db.getActiveExcelTemplates();
    }),

    getByWorkflowType: protectedProcedure
      .input(z.object({ workflowType: z.string() }))
      .query(async ({ input }) => {
        return await db.getExcelTemplateByWorkflowType(input.workflowType);
      }),

    getDownloadUrl: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const template = await db.getExcelTemplateById(input.id);
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        // Generate fresh presigned URL (valid for 1 hour)
        const { url } = await storageGet(template.fileKey, 3600);

        return { url, fileName: template.fileName };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          templateName: z.string().optional(),
          description: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
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
      .input(
        z.object({
          workflowType: z.string(),
          templateName: z.string(),
          description: z.string().optional(),
          filename: z.string(),
          fileData: z.string(), // base64 encoded
          fileSize: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Convert base64 to buffer
        const fileBuffer = Buffer.from(input.fileData, "base64");

        // Upload to S3
        const fileKey = `excel-templates/${input.workflowType}/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(
          fileKey,
          fileBuffer,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

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

  // ============================================
  // Task Assignments
  // ============================================
  assignments: assignmentsRouter,

  // ============================================
  // Performance Metrics
  // ============================================
  metrics: metricsRouter,

  // ============================================
  // Salary Integration
  // ============================================
  salary: salaryRouter,

  // ============================================
  // Capacity Management
  // ============================================
  capacity: capacityRouter,

  // ============================================
  // Recurring Workflows
  // ============================================
  recurringWorkflows: router({
    // Create new recurring workflow
    create: protectedProcedure
      .input(
        z.object({
          templateId: z.string(),
          title: z.string(),
          description: z.string().optional(),
          department: z.string(),
          frequency: z.enum(["daily", "weekly", "monthly"]),
          dayOfMonth: z.number().min(1).max(31).optional(),
          dayOfWeek: z.number().min(0).max(6).optional(),
          startDate: z.date(),
          endDate: z.date().optional(),
          assignedTo: z.array(z.number()).optional(),
          assigneePresets: z.record(z.array(z.number())).optional(), // { "stage_name": [userId1, userId2] }
          formTemplateId: z.string().optional(),
          formData: z.record(z.any()).optional(),
          contingencyWorkflowIds: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const recurring = await db.createRecurringWorkflow({
          ...input,
          createdBy: ctx.user.id,
        });

        await db.createAuditLog({
          entityType: "recurring_workflow",
          entityId: recurring.id,
          action: "created",
          actionDescription: `Created recurring workflow: ${input.title}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });

        return recurring;
      }),

    // Get user's recurring workflows
    getMyRecurringWorkflows: protectedProcedure.query(async ({ ctx }) => {
      return await db.getRecurringWorkflowsByUser(ctx.user.id);
    }),

    // Get specific recurring workflow
    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getRecurringWorkflowById(input.id);
      }),

    // Update recurring workflow
    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          department: z.string().optional(),
          frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
          dayOfMonth: z.number().min(1).max(31).optional(),
          dayOfWeek: z.number().min(0).max(6).optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          assignedTo: z.array(z.number()).optional(),
          assigneePresets: z.record(z.array(z.number())).optional(),
          formData: z.record(z.any()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;

        // Verify ownership
        const existing = await db.getRecurringWorkflowById(id);
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recurring workflow not found",
          });
        }
        if (existing.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to update this recurring workflow",
          });
        }

        const updated = await db.updateRecurringWorkflow(id, updateData);

        await db.createAuditLog({
          entityType: "recurring_workflow",
          entityId: id,
          action: "updated",
          actionDescription: `Updated recurring workflow: ${updated.title}`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });

        return updated;
      }),

    // Pause recurring workflow
    pause: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const existing = await db.getRecurringWorkflowById(input.id);
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recurring workflow not found",
          });
        }
        if (existing.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        await db.pauseRecurringWorkflow(input.id);

        await db.createAuditLog({
          entityType: "recurring_workflow",
          entityId: input.id,
          action: "paused",
          actionDescription: `Paused recurring workflow`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });

        return { success: true };
      }),

    // Resume recurring workflow
    resume: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const existing = await db.getRecurringWorkflowById(input.id);
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recurring workflow not found",
          });
        }
        if (existing.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        await db.resumeRecurringWorkflow(input.id);

        await db.createAuditLog({
          entityType: "recurring_workflow",
          entityId: input.id,
          action: "resumed",
          actionDescription: `Resumed recurring workflow`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });

        return { success: true };
      }),

    // Delete recurring workflow
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const existing = await db.getRecurringWorkflowById(input.id);
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recurring workflow not found",
          });
        }
        if (existing.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        await db.deleteRecurringWorkflow(input.id);

        await db.createAuditLog({
          entityType: "recurring_workflow",
          entityId: input.id,
          action: "deleted",
          actionDescription: `Deleted recurring workflow`,
          actorId: ctx.user.id,
          actorEmail: ctx.user.email,
          actorRole: ctx.user.role,
        });

        return { success: true };
      }),

    // Get history of generated workflows
    getHistory: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getRecurringWorkflowHistory(input.id);
      }),
  }),

  // ============================================
  // E-Signature (HelloDoc Integration)
  // ============================================
  eSignature: router({
    // Create document record (upload only, no API send)
    createDocument: protectedProcedure
      .input(
        z.object({
          workflowId: z.string().optional(),
          documentName: z.string(),
          documentUrl: z.string(),
          signerEmail: z.string().email(),
          signerName: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const docId = await db.createSignedDocument({
          workflowId: input.workflowId || "standalone",
          documentName: input.documentName,
          s3Key: null,
          s3Url: null,
          uploadedS3Key: input.documentUrl.split("?")[0].split("/").pop() || "",
          uploadedS3Url: input.documentUrl,
          helloDocDocumentId: null,
          signerId: ctx.user.id,
          signerEmail: input.signerEmail,
          signerName: input.signerName,
        });
        return { documentId: docId };
      }),

    // Update document with HelloDoc ID (entered manually after sending from HelloDoc)
    updateHelloDocId: protectedProcedure
      .input(
        z.object({
          documentId: z.string(),
          helloDocDocumentId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateSignedDocumentHelloDocId(
          input.documentId,
          input.helloDocDocumentId
        );
        return { success: true };
      }),

    // Legacy sendForSignature (kept for backward compatibility but not used in hybrid workflow)
    sendForSignature: protectedProcedure
      .input(
        z.object({
          workflowId: z.string().optional(), // Optional for standalone usage
          documentName: z.string(),
          documentUrl: z.string(),
          signerEmail: z.string().email(),
          signerName: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { sendDocumentForSignature } = await import("./hellodoc");
        const result = await sendDocumentForSignature({
          documentUrl: input.documentUrl,
          documentName: input.documentName,
          signerEmail: input.signerEmail,
          signerName: input.signerName,
          workflowId: input.workflowId || "standalone",
        });
        const docId = await db.createSignedDocument({
          workflowId: input.workflowId || "standalone",
          documentName: input.documentName,
          s3Key: null,
          s3Url: null,
          uploadedS3Key: input.documentUrl.split("?")[0].split("/").pop() || "",
          uploadedS3Url: input.documentUrl,
          helloDocDocumentId: result.documentId,
          signerId: ctx.user.id,
          signerEmail: input.signerEmail,
          signerName: input.signerName,
        });
        return {
          documentId: docId,
          signatureUrl: result.signatureUrl,
          helloDocDocumentId: result.documentId,
        };
      }),

    checkStatus: protectedProcedure
      .input(z.object({ helloDocDocumentId: z.string() }))
      .query(async ({ input }) => {
        const { checkSignatureStatus } = await import("./hellodoc");
        return await checkSignatureStatus(input.helloDocDocumentId);
      }),

    getByWorkflow: protectedProcedure
      .input(z.object({ workflowId: z.string() }))
      .query(async ({ input }) => {
        return await db.getSignedDocumentsByWorkflow(input.workflowId);
      }),

    // Get all signed documents (for standalone e-signature page)
    getAll: protectedProcedure
      .input(
        z.object({
          status: z
            .enum(["all", "pending", "signed", "rejected", "expired"])
            .optional(),
          search: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getAllSignedDocuments(
          ctx.user.id,
          input.status,
          input.search
        );
      }),

    // Get documents sent by current user
    getBySender: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSignedDocumentsBySender(ctx.user.id);
    }),

    handleSignedDocument: protectedProcedure
      .input(z.object({ helloDocDocumentId: z.string() }))
      .mutation(async ({ input }) => {
        const { checkSignatureStatus, downloadSignedDocument } = await import(
          "./hellodoc"
        );
        const status = await checkSignatureStatus(input.helloDocDocumentId);
        if (status.status !== "signed" || !status.signedDocumentUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Document not signed yet. Status: ${status.status}`,
          });
        }
        const signedPdfBuffer = await downloadSignedDocument(
          status.signedDocumentUrl
        );
        const doc = await db.getSignedDocumentByHelloDocId(
          input.helloDocDocumentId
        );
        if (!doc) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }
        const s3Key = `signed-docs/${doc.workflowId}/${Date.now()}-${doc.documentName}`;
        const { url: s3Url } = await storagePut(
          s3Key,
          signedPdfBuffer,
          "application/pdf"
        );
        await db.updateSignedDocumentStatus(
          doc.id,
          "signed",
          status.signedAt || undefined
        );
        await db.db
          .update(schema.signedDocuments)
          .set({ s3Key, s3Url })
          .where(eq(schema.signedDocuments.id, doc.id));

        // Send email with signed document
        const { sendSignedDocumentEmail } = await import("./email");
        await sendSignedDocumentEmail(
          doc.signerEmail,
          doc.signerName,
          doc.documentName,
          s3Url,
          doc.workflowId
        );

        return {
          success: true,
          s3Url,
          signedAt: status.signedAt,
        };
      }),
  }),

  // ============================================
  // CFO Document Queue Router
  // ============================================
  cfoDocumentQueue: router({
    // Get all uploaded documents for CFO review
    getAll: protectedProcedure.query(async ({ ctx }) => {
      // Only CFO can access
      if (ctx.user.role !== "cfo") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only CFO can access document queue",
        });
      }
      return db.getAllSignedDocumentsForCFO();
    }),
  }),

  // ============================================
  // Document Templates Router
  // ============================================
  documentTemplates: router({
    // Create new template
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          category: z.string().optional(),
          fileUrl: z.string(),
          fileType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const templateId = randomUUID();
        await db.createDocumentTemplate({
          id: templateId,
          name: input.name,
          description: input.description,
          category: input.category,
          s3Key: input.fileUrl.split("?")[0].split("/").pop() || "",
          s3Url: input.fileUrl,
          fileType: input.fileType,
          createdBy: ctx.user.id,
        });
        return { templateId };
      }),

    // Get all templates
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAllDocumentTemplates();
    }),

    // Get template by ID
    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getDocumentTemplateById(input.id);
      }),

    // Update template
    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateDocumentTemplate(input.id, {
          name: input.name,
          description: input.description,
          category: input.category,
        });
        return { success: true };
      }),

    // Delete template (soft delete)
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteDocumentTemplate(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // Document Sequence Generator
  // ============================================
  documentSequence: documentSequenceRouter,

  // ============================================
  // SKU Generator
  // ============================================
  skuGenerator: skuGeneratorRouter,
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
      {
        order: 2,
        name: "Purchasing Review",
        type: "approval",
        role: "Purchasing",
      },
    ];

    // Add financial approval stages based on amount
    if (estimatedAmount && estimatedAmount > 5000000) {
      stages.push({
        order: 3,
        name: "CFO Approval",
        type: "approval",
        role: "CFO",
      });
      stages.push({
        order: 4,
        name: "CEO/COO Approval",
        type: "approval",
        role: "CEO",
      });
    } else if (estimatedAmount && estimatedAmount > 1000000) {
      stages.push({
        order: 3,
        name: "CFO Approval",
        type: "approval",
        role: "CFO",
      });
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
      {
        order: 1,
        name: "Department Head Review",
        type: "approval",
        role: "admin",
      },
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
