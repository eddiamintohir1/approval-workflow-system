-- Create form_template_documents table
CREATE TABLE IF NOT EXISTS form_template_documents (
  id VARCHAR(36) PRIMARY KEY,
  form_template_id VARCHAR(36) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_type ENUM('pdf', 'excel') NOT NULL,
  file_size BIGINT NOT NULL,
  storage_url LONGTEXT NOT NULL,
  fields JSON NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_form_template_id (form_template_id),
  KEY idx_uploaded_by (uploaded_by),
  CONSTRAINT fk_ftd_form_template FOREIGN KEY (form_template_id) REFERENCES form_templates(id) ON DELETE CASCADE,
  CONSTRAINT fk_ftd_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Create form_submission_documents table
CREATE TABLE IF NOT EXISTS form_submission_documents (
  id VARCHAR(36) PRIMARY KEY,
  submission_id VARCHAR(36) NOT NULL,
  template_document_id VARCHAR(36) NOT NULL,
  filled_data JSON NOT NULL DEFAULT '{}',
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  validation_errors JSON DEFAULT '[]',
  generated_document_url LONGTEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_submission_id (submission_id),
  KEY idx_template_document_id (template_document_id),
  CONSTRAINT fk_fsd_submission FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_fsd_template_document FOREIGN KEY (template_document_id) REFERENCES form_template_documents(id) ON DELETE CASCADE
);
