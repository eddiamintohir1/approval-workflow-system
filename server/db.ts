import { supabase } from "./supabase";

// ============================================
// User Management
// ============================================

export interface User {
  id: number;
  open_id: string;
  name: string | null;
  email: string | null;
  login_method: string | null;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_signed_in: Date;
}

export interface InsertUser {
  open_id: string;
  name?: string | null;
  email?: string | null;
  login_method?: string | null;
  role?: string;
  is_active?: boolean;
  last_signed_in?: Date;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.open_id) {
    throw new Error("User open_id is required for upsert");
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("open_id", user.open_id)
    .single();

  if (existingUser) {
    // Update existing user
    const updates: any = {};
    if (user.name !== undefined) updates.name = user.name;
    if (user.email !== undefined) updates.email = user.email;
    if (user.login_method !== undefined) updates.login_method = user.login_method;
    if (user.role !== undefined) updates.role = user.role;
    if (user.is_active !== undefined) updates.is_active = user.is_active;
    updates.last_signed_in = user.last_signed_in || new Date();

    await supabase.from("users").update(updates).eq("open_id", user.open_id);
  } else {
    // Insert new user
    await supabase.from("users").insert({
      open_id: user.open_id,
      name: user.name || null,
      email: user.email || null,
      login_method: user.login_method || null,
      role: user.role || "brand_manager",
      is_active: user.is_active !== undefined ? user.is_active : true,
      last_signed_in: user.last_signed_in || new Date(),
    });
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("open_id", openId)
    .single();

  if (error || !data) return undefined;
  return data as User;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return undefined;
  return data as User;
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as User[];
}

export async function updateUserRole(userId: number, role: string): Promise<void> {
  await supabase.from("users").update({ role }).eq("id", userId);
}

export async function updateUserStatus(userId: number, isActive: boolean): Promise<void> {
  await supabase.from("users").update({ is_active: isActive }).eq("id", userId);
}

// ============================================
// Project Management
// ============================================

export interface Project {
  id: number;
  name: string;
  sku: string | null;
  paf_sequence: string | null;
  maf_sequence: string | null;
  is_oem: boolean;
  status: string;
  current_stage: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface InsertProject {
  name: string;
  sku?: string | null;
  paf_sequence?: string | null;
  maf_sequence?: string | null;
  is_oem: boolean;
  status?: string;
  current_stage?: number;
  created_by: number;
}

export async function createProject(project: InsertProject): Promise<number> {
  const { data, error } = await supabase
    .from("projects")
    .insert(project)
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function getProjectById(projectId: number): Promise<Project | undefined> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error || !data) return undefined;
  return data as Project;
}

export async function getProjectsByUser(userId: number): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Project[];
}

export async function getAllProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Project[];
}

export async function updateProject(projectId: number, updates: Partial<InsertProject>): Promise<void> {
  await supabase.from("projects").update(updates).eq("id", projectId);
}

export async function updateProjectStatus(projectId: number, status: string): Promise<void> {
  await supabase.from("projects").update({ status }).eq("id", projectId);
}

export async function deleteProject(projectId: number): Promise<void> {
  // Delete related records first (if cascade is not set up)
  await supabase.from("forms").delete().eq("project_id", projectId);
  await supabase.from("form_submissions").delete().eq("project_id", projectId);
  await supabase.from("approvals").delete().eq("project_id", projectId);
  await supabase.from("milestones").delete().eq("project_id", projectId);
  // Note: audit_trail is kept for historical records
  
  // Finally delete the project
  await supabase.from("projects").delete().eq("id", projectId);
}

// ============================================
// Milestone Management
// ============================================

export interface Milestone {
  id: number;
  project_id: number;
  name: string;
  stage: number;
  status: string;
  approver_role: string;
  is_view_only: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface InsertMilestone {
  project_id: number;
  name: string;
  stage: number;
  status?: string;
  approver_role: string;
  is_view_only: boolean;
}

export async function createMilestone(milestone: InsertMilestone): Promise<number> {
  const { data, error } = await supabase
    .from("milestones")
    .insert(milestone)
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function getMilestonesByProject(projectId: number): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("stage", { ascending: true });

  if (error || !data) return [];
  return data as Milestone[];
}

export async function getMilestoneById(milestoneId: number): Promise<Milestone | undefined> {
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("id", milestoneId)
    .single();

  if (error || !data) return undefined;
  return data as Milestone;
}

export async function updateMilestoneStatus(milestoneId: number, status: string): Promise<void> {
  await supabase.from("milestones").update({ status }).eq("id", milestoneId);
}

// ============================================
// Form Management
// ============================================

export interface Form {
  id: number;
  project_id: number;
  milestone_id: number;
  name: string;
  s3_key: string;
  s3_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface InsertForm {
  project_id: number;
  milestone_id: number;
  name: string;
  s3_key: string;
  s3_url: string;
  file_type?: string | null;
  file_size?: number | null;
  uploaded_by: number;
}

export async function createForm(form: InsertForm): Promise<number> {
  const { data, error } = await supabase
    .from("forms")
    .insert(form)
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function getFormsByMilestone(milestoneId: number): Promise<Form[]> {
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("milestone_id", milestoneId);

  if (error || !data) return [];
  return data as Form[];
}

export async function getFormsByProject(projectId: number): Promise<Form[]> {
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("project_id", projectId);

  if (error || !data) return [];
  return data as Form[];
}

// ============================================
// Form Template Management
// ============================================

export interface FormTemplate {
  id: number;
  name: string;
  fields: any;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface InsertFormTemplate {
  name: string;
  fields: any;
  created_by: number;
}

export async function createFormTemplate(template: InsertFormTemplate): Promise<number> {
  const { data, error } = await supabase
    .from("form_templates")
    .insert(template)
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function getAllFormTemplates(): Promise<FormTemplate[]> {
  const { data, error } = await supabase
    .from("form_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as FormTemplate[];
}

export async function getFormTemplateById(templateId: number): Promise<FormTemplate | undefined> {
  const { data, error } = await supabase
    .from("form_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error || !data) return undefined;
  return data as FormTemplate;
}

export async function updateFormTemplate(templateId: number, updates: Partial<InsertFormTemplate>): Promise<void> {
  await supabase.from("form_templates").update(updates).eq("id", templateId);
}

export async function deleteFormTemplate(templateId: number): Promise<void> {
  await supabase.from("form_templates").delete().eq("id", templateId);
}

// ============================================
// Form Submission Management
// ============================================

export interface FormSubmission {
  id: number;
  project_id: number;
  milestone_id: number;
  template_id: number;
  data: any;
  submitted_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface InsertFormSubmission {
  project_id: number;
  milestone_id: number;
  template_id: number;
  data: any;
  submitted_by: number;
}

export async function createFormSubmission(submission: InsertFormSubmission): Promise<number> {
  const { data, error } = await supabase
    .from("form_submissions")
    .insert(submission)
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function getFormSubmissionsByMilestone(milestoneId: number): Promise<FormSubmission[]> {
  const { data, error } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("milestone_id", milestoneId);

  if (error || !data) return [];
  return data as FormSubmission[];
}

// ============================================
// Approval Management
// ============================================

export interface Approval {
  id: number;
  milestone_id: number;
  project_id: number;
  approver_id: number;
  status: string;
  comments: string | null;
  created_at: Date;
}

export interface InsertApproval {
  milestone_id: number;
  project_id: number;
  approver_id: number;
  status: string;
  comments?: string | null;
}

export async function createApproval(approval: InsertApproval): Promise<number> {
  const { data, error } = await supabase
    .from("approvals")
    .insert(approval)
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function getApprovalsByMilestone(milestoneId: number): Promise<Approval[]> {
  const { data, error } = await supabase
    .from("approvals")
    .select("*")
    .eq("milestone_id", milestoneId);

  if (error || !data) return [];
  return data as Approval[];
}

export async function getApprovalsByProject(projectId: number): Promise<Approval[]> {
  const { data, error } = await supabase
    .from("approvals")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Approval[];
}

// ============================================
// Audit Trail
// ============================================

export interface AuditTrail {
  id: number;
  user_id: number;
  project_id: number | null;
  action: string;
  details: any;
  created_at: Date;
}

export interface InsertAuditTrail {
  user_id: number;
  project_id?: number | null;
  action: string;
  details?: any;
}

export async function logAudit(audit: InsertAuditTrail): Promise<void> {
  await supabase.from("audit_trail").insert(audit);
}

export async function getAuditTrailByProject(projectId: number): Promise<AuditTrail[]> {
  const { data, error } = await supabase
    .from("audit_trail")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as AuditTrail[];
}

export async function getAuditTrailByUser(userId: number): Promise<AuditTrail[]> {
  const { data, error } = await supabase
    .from("audit_trail")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as AuditTrail[];
}

// ============================================
// Sequence Management
// ============================================

export interface Sequence {
  id: number;
  type: string;
  sequence: string;
  project_id: number | null;
  generated_by: number;
  created_at: Date;
}

export interface InsertSequence {
  type: string;
  sequence: string;
  project_id?: number | null;
  generated_by: number;
}

export async function createSequence(sequence: InsertSequence): Promise<number> {
  const { data, error } = await supabase
    .from("sequences")
    .insert(sequence)
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function getSequencesByType(type: "sku" | "paf" | "maf"): Promise<Sequence[]> {
  const { data, error } = await supabase
    .from("sequences")
    .select("*")
    .eq("type", type)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Sequence[];
}

export async function getAllSequences(): Promise<Sequence[]> {
  const { data, error } = await supabase
    .from("sequences")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Sequence[];
}

// ============================================
// Sequence Config Management
// ============================================

export interface SequenceConfig {
  id: number;
  type: string;
  prefix: string;
  suffix: string;
  current_number: number;
  max_per_month: number | null;
  reset_frequency: string;
  last_reset: Date | null;
  updated_at: Date;
}

export interface InsertSequenceConfig {
  type: string;
  prefix?: string;
  suffix?: string;
  current_number?: number;
  max_per_month?: number | null;
  reset_frequency?: string;
  last_reset?: Date | null;
}

export async function getSequenceConfig(type: "sku" | "paf" | "maf"): Promise<SequenceConfig | undefined> {
  const { data, error } = await supabase
    .from("sequence_config")
    .select("*")
    .eq("type", type)
    .single();

  if (error || !data) return undefined;
  return data as SequenceConfig;
}

export async function upsertSequenceConfig(config: InsertSequenceConfig): Promise<void> {
  const { data: existing } = await supabase
    .from("sequence_config")
    .select("*")
    .eq("type", config.type)
    .single();

  if (existing) {
    await supabase.from("sequence_config").update(config).eq("type", config.type);
  } else {
    await supabase.from("sequence_config").insert({
      type: config.type,
      prefix: config.prefix || "",
      suffix: config.suffix || "",
      current_number: config.current_number || 1,
      reset_frequency: config.reset_frequency || "never",
    });
  }
}

export async function incrementSequenceNumber(type: "sku" | "paf" | "maf"): Promise<void> {
  const config = await getSequenceConfig(type);
  if (config) {
    await supabase
      .from("sequence_config")
      .update({ current_number: config.current_number + 1 })
      .eq("type", type);
  }
}

export async function generateSequence(type: "sku" | "paf" | "maf", userId: number, projectId?: number): Promise<string> {
  let config = await getSequenceConfig(type);

  if (!config) {
    await upsertSequenceConfig({
      type,
      prefix: type.toUpperCase() + "-",
      suffix: "",
      current_number: 1,
      reset_frequency: "never",
    });
    config = await getSequenceConfig(type);
    if (!config) throw new Error("Failed to create sequence config");
  }

  const year = new Date().getFullYear();
  const sequenceNumber = String(config.current_number).padStart(3, "0");
  const generatedSequence = `${config.prefix}${year}-${sequenceNumber}${config.suffix}`;

  await createSequence({
    type,
    sequence: generatedSequence,
    project_id: projectId,
    generated_by: userId,
  });

  await incrementSequenceNumber(type);

  return generatedSequence;
}
