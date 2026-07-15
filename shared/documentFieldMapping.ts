import { z } from "zod";

/**
 * Document field types for fillable areas
 */
export type DocumentFieldType = "text" | "number" | "date" | "email" | "signature" | "checkbox";

/**
 * Position information for fields on documents
 */
export const FieldPositionSchema = z.object({
  page: z.number().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type FieldPosition = z.infer<typeof FieldPositionSchema>;

/**
 * Validation rules for fields
 */
export const FieldValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  message: z.string().optional(),
});

export type FieldValidation = z.infer<typeof FieldValidationSchema>;

/**
 * Individual field definition
 */
export const DocumentFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  type: z.enum(["text", "number", "date", "email", "signature", "checkbox"]),
  required: z.boolean(),
  placeholder: z.string().optional(),
  validation: FieldValidationSchema.optional(),
  position: FieldPositionSchema.optional(),
});

export type DocumentField = z.infer<typeof DocumentFieldSchema>;

/**
 * Form template document
 */
export const FormTemplateDocumentSchema = z.object({
  id: z.string(),
  formTemplateId: z.string(),
  documentName: z.string(),
  documentType: z.enum(["pdf", "excel"]),
  fileSize: z.number(),
  storageUrl: z.string(),
  fields: z.array(DocumentFieldSchema),
  isActive: z.boolean(),
  uploadedBy: z.number(),
  uploadedAt: z.date(),
  updatedAt: z.date(),
});

export type FormTemplateDocument = z.infer<typeof FormTemplateDocumentSchema>;

/**
 * Form submission document with filled data
 */
export const FormSubmissionDocumentSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  templateDocumentId: z.string(),
  filledData: z.record(z.any()),
  isComplete: z.boolean(),
  validationErrors: z.array(
    z.object({
      fieldId: z.string(),
      message: z.string(),
    })
  ),
  generatedDocumentUrl: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FormSubmissionDocument = z.infer<typeof FormSubmissionDocumentSchema>;

/**
 * Validation result for document fields
 */
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(
    z.object({
      fieldId: z.string(),
      fieldName: z.string(),
      message: z.string(),
    })
  ),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

/**
 * Validate field value against its definition
 */
export function validateFieldValue(field: DocumentField, value: any): string | null {
  // Check required
  if (field.required && (value === null || value === undefined || value === "")) {
    return `${field.label} is required`;
  }

  if (!value) return null;

  // Type-specific validation
  switch (field.type) {
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        return `${field.label} must be a valid email`;
      }
      break;

    case "number":
      const num = Number(value);
      if (isNaN(num)) {
        return `${field.label} must be a number`;
      }
      if (field.validation?.min !== undefined && num < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && num > field.validation.max) {
        return `${field.label} must be at most ${field.validation.max}`;
      }
      break;

    case "date":
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        return `${field.label} must be a valid date (YYYY-MM-DD)`;
      }
      break;

    case "text":
      const str = String(value);
      if (field.validation?.min !== undefined && str.length < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min} characters`;
      }
      if (field.validation?.max !== undefined && str.length > field.validation.max) {
        return `${field.label} must be at most ${field.validation.max} characters`;
      }
      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(str)) {
          return field.validation.message || `${field.label} format is invalid`;
        }
      }
      break;
  }

  return null;
}

/**
 * Validate all filled data against field definitions
 */
export function validateFormSubmissionDocument(
  fields: DocumentField[],
  filledData: Record<string, any>
): ValidationResult {
  const errors: Array<{ fieldId: string; fieldName: string; message: string }> = [];

  for (const field of fields) {
    const error = validateFieldValue(field, filledData[field.id]);
    if (error) {
      errors.push({
        fieldId: field.id,
        fieldName: field.name,
        message: error,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate unique field ID
 */
export function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize field name for use as identifier
 */
export function sanitizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
