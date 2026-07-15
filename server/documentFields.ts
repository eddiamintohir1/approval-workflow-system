import { db } from "./db";
import { formTemplateDocuments, formSubmissionDocuments } from "@/drizzle/schema";
import { v4 as uuidv4 } from "uuid";
import type { DocumentField, FormTemplateDocument, FormSubmissionDocument } from "@shared/documentFieldMapping";
import { validateFormSubmissionDocument } from "@shared/documentFieldMapping";

/**
 * Create a new form template document
 */
export async function createFormTemplateDocument(
  formTemplateId: string,
  documentName: string,
  documentType: "pdf" | "excel",
  fileSize: number,
  storageUrl: string,
  fields: DocumentField[],
  uploadedBy: number
): Promise<FormTemplateDocument> {
  const id = uuidv4();
  const now = new Date();

  await db.insert(formTemplateDocuments).values({
    id,
    formTemplateId,
    documentName,
    documentType,
    fileSize,
    storageUrl,
    fields: fields as any,
    uploadedBy,
    uploadedAt: now,
    updatedAt: now,
  });

  return {
    id,
    formTemplateId,
    documentName,
    documentType,
    fileSize,
    storageUrl,
    fields,
    isActive: true,
    uploadedBy,
    uploadedAt: now,
    updatedAt: now,
  };
}

/**
 * Get all documents for a form template
 */
export async function getFormTemplateDocuments(
  formTemplateId: string
): Promise<FormTemplateDocument[]> {
  const docs = await db.query.formTemplateDocuments.findMany({
    where: (table, { eq }) => eq(table.formTemplateId, formTemplateId),
  });

  return docs.map((doc) => ({
    ...doc,
    fields: (doc.fields as any) || [],
  }));
}

/**
 * Get a specific document by ID
 */
export async function getFormTemplateDocument(
  documentId: string
): Promise<FormTemplateDocument | null> {
  const doc = await db.query.formTemplateDocuments.findFirst({
    where: (table, { eq }) => eq(table.id, documentId),
  });

  if (!doc) return null;

  return {
    ...doc,
    fields: (doc.fields as any) || [],
  };
}

/**
 * Delete a form template document
 */
export async function deleteFormTemplateDocument(documentId: string): Promise<void> {
  await db.delete(formTemplateDocuments).where((table) => table.id === documentId);
}

/**
 * Create a form submission document
 */
export async function createFormSubmissionDocument(
  submissionId: string,
  templateDocumentId: string
): Promise<FormSubmissionDocument> {
  const id = uuidv4();
  const now = new Date();

  await db.insert(formSubmissionDocuments).values({
    id,
    submissionId,
    templateDocumentId,
    filledData: {} as any,
    isComplete: false,
    validationErrors: [] as any,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id,
    submissionId,
    templateDocumentId,
    filledData: {},
    isComplete: false,
    validationErrors: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get submission documents for a form submission
 */
export async function getFormSubmissionDocuments(
  submissionId: string
): Promise<FormSubmissionDocument[]> {
  const docs = await db.query.formSubmissionDocuments.findMany({
    where: (table, { eq }) => eq(table.submissionId, submissionId),
  });

  return docs.map((doc) => ({
    ...doc,
    filledData: (doc.filledData as any) || {},
    validationErrors: (doc.validationErrors as any) || [],
  }));
}

/**
 * Get a specific submission document
 */
export async function getFormSubmissionDocument(
  documentId: string
): Promise<FormSubmissionDocument | null> {
  const doc = await db.query.formSubmissionDocuments.findFirst({
    where: (table, { eq }) => eq(table.id, documentId),
  });

  if (!doc) return null;

  return {
    ...doc,
    filledData: (doc.filledData as any) || {},
    validationErrors: (doc.validationErrors as any) || [],
  };
}

/**
 * Update filled data for a submission document
 */
export async function updateFormSubmissionDocumentData(
  documentId: string,
  filledData: Record<string, any>,
  templateFields: DocumentField[]
): Promise<FormSubmissionDocument> {
  // Validate the filled data
  const validation = validateFormSubmissionDocument(templateFields, filledData);

  const now = new Date();

  await db
    .update(formSubmissionDocuments)
    .set({
      filledData: filledData as any,
      isComplete: validation.isValid,
      validationErrors: validation.errors as any,
      updatedAt: now,
    })
    .where((table) => table.id === documentId);

  const updated = await getFormSubmissionDocument(documentId);
  if (!updated) throw new Error("Document not found after update");

  return updated;
}

/**
 * Check if all required documents are complete for a submission
 */
export async function areAllSubmissionDocumentsComplete(
  submissionId: string
): Promise<boolean> {
  const docs = await getFormSubmissionDocuments(submissionId);
  if (docs.length === 0) return true; // No documents required
  return docs.every((doc) => doc.isComplete);
}

/**
 * Get validation errors for all submission documents
 */
export async function getSubmissionDocumentValidationErrors(
  submissionId: string
): Promise<Array<{ documentId: string; errors: Array<{ fieldId: string; message: string }> }>> {
  const docs = await getFormSubmissionDocuments(submissionId);
  return docs
    .filter((doc) => doc.validationErrors && doc.validationErrors.length > 0)
    .map((doc) => ({
      documentId: doc.id,
      errors: doc.validationErrors,
    }));
}
