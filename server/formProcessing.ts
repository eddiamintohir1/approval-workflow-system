export interface ProcessableFormField {
  id: string;
  label: string;
  required: boolean;
  mappingKey?: string;
  showInTable?: boolean;
  tableLabel?: string;
  tableOrder?: number;
}

export type ProcessingStatus =
  | "missing_info"
  | "draft"
  | "ready"
  | "in_progress"
  | "completed";

export function isMissingFormValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function buildProcessingFields(
  fields: ProcessableFormField[],
  formData: Record<string, unknown>
) {
  const missingFields = fields
    .filter(field => field.required && isMissingFormValue(formData[field.id]))
    .map(field => ({ id: field.id, label: field.label }));

  const mappedFields = fields
    .filter(field => field.mappingKey && field.showInTable)
    .map(field => ({
      key: field.mappingKey!,
      label: field.tableLabel || field.label,
      order: field.tableOrder ?? 0,
      value: formData[field.id],
    }))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));

  return { missingFields, mappedFields };
}

export function deriveProcessingStatus(input: {
  workflowCompleted: boolean;
  missingFieldCount: number;
  submissionIsDraft: boolean;
  hasWorkflowProgress: boolean;
}): ProcessingStatus {
  if (input.workflowCompleted) return "completed";
  if (input.submissionIsDraft) return "draft";
  if (input.missingFieldCount > 0) return "missing_info";
  if (input.hasWorkflowProgress) return "in_progress";
  return "ready";
}
