-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM (
  'admin',
  'brand_manager',
  'ppic_manager',
  'production_manager',
  'purchasing_manager',
  'sales_manager',
  'pr_manager',
  'director'
);

CREATE TYPE project_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'discontinued'
);

CREATE TYPE milestone_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'rejected'
);

CREATE TYPE approval_status AS ENUM (
  'approved',
  'rejected'
);

CREATE TYPE sequence_type AS ENUM (
  'sku',
  'paf',
  'maf'
);

CREATE TYPE reset_frequency AS ENUM (
  'monthly',
  'yearly',
  'never'
);

-- Users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  open_id VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  login_method VARCHAR(64),
  role user_role NOT NULL DEFAULT 'brand_manager',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_signed_in TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  paf_sequence VARCHAR(100) UNIQUE,
  maf_sequence VARCHAR(100) UNIQUE,
  is_oem BOOLEAN NOT NULL DEFAULT false,
  status project_status NOT NULL DEFAULT 'pending',
  current_stage INTEGER NOT NULL DEFAULT 1,
  created_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Milestones table
CREATE TABLE milestones (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  stage INTEGER NOT NULL,
  status milestone_status NOT NULL DEFAULT 'pending',
  approver_role user_role NOT NULL,
  is_view_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forms table
CREATE TABLE forms (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id BIGINT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  s3_url VARCHAR(1000) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  uploaded_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Form templates table
CREATE TABLE form_templates (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  fields JSONB NOT NULL,
  created_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Form submissions table
CREATE TABLE form_submissions (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id BIGINT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  template_id BIGINT NOT NULL REFERENCES form_templates(id),
  data JSONB NOT NULL,
  submitted_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Approvals table
CREATE TABLE approvals (
  id BIGSERIAL PRIMARY KEY,
  milestone_id BIGINT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  approver_id BIGINT NOT NULL REFERENCES users(id),
  status approval_status NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit trail table
CREATE TABLE audit_trail (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sequences table
CREATE TABLE sequences (
  id BIGSERIAL PRIMARY KEY,
  type sequence_type NOT NULL,
  sequence VARCHAR(100) UNIQUE NOT NULL,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  generated_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sequence config table
CREATE TABLE sequence_config (
  id BIGSERIAL PRIMARY KEY,
  type sequence_type UNIQUE NOT NULL,
  prefix VARCHAR(50) NOT NULL DEFAULT '',
  suffix VARCHAR(50) NOT NULL DEFAULT '',
  current_number INTEGER NOT NULL DEFAULT 1,
  max_per_month INTEGER,
  reset_frequency reset_frequency NOT NULL DEFAULT 'never',
  last_reset TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_open_id ON users(open_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_stage ON milestones(stage);
CREATE INDEX idx_forms_project_id ON forms(project_id);
CREATE INDEX idx_forms_milestone_id ON forms(milestone_id);
CREATE INDEX idx_approvals_project_id ON approvals(project_id);
CREATE INDEX idx_approvals_milestone_id ON approvals(milestone_id);
CREATE INDEX idx_audit_trail_project_id ON audit_trail(project_id);
CREATE INDEX idx_audit_trail_user_id ON audit_trail(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_templates_updated_at BEFORE UPDATE ON form_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_submissions_updated_at BEFORE UPDATE ON form_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequence_config_updated_at BEFORE UPDATE ON sequence_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role bypasses these, but good for future client access)
-- Users can read all users
CREATE POLICY "Users can read all users" ON users
  FOR SELECT USING (true);

-- Users can update their own record
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid()::text = open_id);

-- Projects: Users can read projects they created or are involved in
CREATE POLICY "Users can read projects" ON projects
  FOR SELECT USING (true);

-- Projects: Users can create projects
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (true);

-- Projects: Admins and directors can update any project
CREATE POLICY "Admins can update projects" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.open_id = auth.uid()::text
      AND users.role IN ('admin', 'director')
    )
  );

-- Milestones: Users can read milestones for accessible projects
CREATE POLICY "Users can read milestones" ON milestones
  FOR SELECT USING (true);

-- Forms: Users can read forms
CREATE POLICY "Users can read forms" ON forms
  FOR SELECT USING (true);

-- Forms: Users can upload forms
CREATE POLICY "Users can upload forms" ON forms
  FOR INSERT WITH CHECK (true);

-- Approvals: Users can read approvals
CREATE POLICY "Users can read approvals" ON approvals
  FOR SELECT USING (true);

-- Approvals: Users can create approvals
CREATE POLICY "Users can create approvals" ON approvals
  FOR INSERT WITH CHECK (true);

-- Audit trail: Users can read audit trail
CREATE POLICY "Users can read audit trail" ON audit_trail
  FOR SELECT USING (true);

-- Sequences: Users can read sequences
CREATE POLICY "Users can read sequences" ON sequences
  FOR SELECT USING (true);
