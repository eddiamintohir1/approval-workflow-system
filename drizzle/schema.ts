import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role field for approval workflow system.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", [
    "admin",
    "brand_manager",
    "ppic_manager",
    "production_manager",
    "purchasing_manager",
    "sales_manager",
    "pr_manager",
    "director"
  ]).default("brand_manager").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table - stores all product development projects
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).unique(),
  pafSequence: varchar("pafSequence", { length: 100 }).unique(),
  mafSequence: varchar("mafSequence", { length: 100 }).unique(),
  isOem: boolean("isOem").default(false).notNull(),
  status: mysqlEnum("status", [
    "pending",
    "in_progress",
    "completed",
    "discontinued"
  ]).default("pending").notNull(),
  currentStage: int("currentStage").default(1).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Milestones table - defines stages within each project
 */
export const milestones = mysqlTable("milestones", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  stage: int("stage").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "in_progress",
    "completed",
    "rejected"
  ]).default("pending").notNull(),
  approverRole: mysqlEnum("approverRole", [
    "brand_manager",
    "ppic_manager",
    "production_manager",
    "purchasing_manager",
    "sales_manager",
    "pr_manager",
    "director"
  ]).notNull(),
  isViewOnly: boolean("isViewOnly").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;

/**
 * Forms table - stores uploaded form files
 */
export const forms = mysqlTable("forms", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  milestoneId: int("milestoneId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  s3Url: varchar("s3Url", { length: 1000 }).notNull(),
  fileType: varchar("fileType", { length: 100 }),
  fileSize: int("fileSize"),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Form = typeof forms.$inferSelect;
export type InsertForm = typeof forms.$inferInsert;

/**
 * Form templates table - admin-created fillable form templates
 */
export const formTemplates = mysqlTable("formTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  fields: json("fields").notNull(), // Array of field definitions
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FormTemplate = typeof formTemplates.$inferSelect;
export type InsertFormTemplate = typeof formTemplates.$inferInsert;

/**
 * Form submissions table - data from fillable forms
 */
export const formSubmissions = mysqlTable("formSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  milestoneId: int("milestoneId").notNull(),
  templateId: int("templateId").notNull(),
  data: json("data").notNull(), // Form field values
  submittedBy: int("submittedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = typeof formSubmissions.$inferInsert;

/**
 * Approvals table - logs approval/rejection actions
 */
export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  milestoneId: int("milestoneId").notNull(),
  projectId: int("projectId").notNull(),
  approverId: int("approverId").notNull(),
  status: mysqlEnum("status", ["approved", "rejected"]).notNull(),
  comments: text("comments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;

/**
 * Audit trail table - logs all significant actions
 */
export const auditTrail = mysqlTable("auditTrail", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  action: varchar("action", { length: 255 }).notNull(),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditTrail = typeof auditTrail.$inferSelect;
export type InsertAuditTrail = typeof auditTrail.$inferInsert;

/**
 * Sequences table - tracks generated sequences
 */
export const sequences = mysqlTable("sequences", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["sku", "paf", "maf"]).notNull(),
  sequence: varchar("sequence", { length: 100 }).notNull().unique(),
  projectId: int("projectId"),
  generatedBy: int("generatedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Sequence = typeof sequences.$inferSelect;
export type InsertSequence = typeof sequences.$inferInsert;

/**
 * Sequence config table - admin settings for sequence generators
 */
export const sequenceConfig = mysqlTable("sequenceConfig", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["sku", "paf", "maf"]).notNull().unique(),
  prefix: varchar("prefix", { length: 50 }).default("").notNull(),
  suffix: varchar("suffix", { length: 50 }).default("").notNull(),
  currentNumber: int("currentNumber").default(1).notNull(),
  maxPerMonth: int("maxPerMonth"),
  resetFrequency: mysqlEnum("resetFrequency", ["monthly", "yearly", "never"]).default("never").notNull(),
  lastReset: timestamp("lastReset"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SequenceConfig = typeof sequenceConfig.$inferSelect;
export type InsertSequenceConfig = typeof sequenceConfig.$inferInsert;
