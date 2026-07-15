-- Add Excel form-template mapping fields to excel_templates table
ALTER TABLE excel_templates
ADD COLUMN form_template_id VARCHAR(36),
ADD COLUMN workbook_mappings JSON DEFAULT '[]',
ADD COLUMN workbook_metadata JSON,
ADD COLUMN output_file_name_pattern VARCHAR(255);

-- Create index for form_template_id lookups
CREATE INDEX idx_excel_templates_form_template_id ON excel_templates(form_template_id);
