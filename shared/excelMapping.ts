/**
 * Shared types and validation for Excel form-template mapping
 * Supports mapping form fields to workbook cells, named ranges, and table columns
 */

import { z } from "zod";

/**
 * Supported built-in mapping keys that don't correspond to form fields
 */
export const BUILTIN_MAPPING_KEYS = [
  "workflow_number",
  "workflow_title",
  "workflow_status",
  "department",
  "submitter_name",
  "submitter_email",
  "submitted_at",
  "created_at",
  "updated_at",
] as const;

export type BuiltinMappingKey = (typeof BUILTIN_MAPPING_KEYS)[number];

/**
 * Value type hints for Excel cell writing
 * - "auto": Infer from value (default)
 * - "text": Force text format (preserves leading zeros)
 * - "number": Force numeric format
 * - "date": Force date format
 */
export type ValueType = "auto" | "text" | "number" | "date";

/**
 * Cell-based mapping: writes to a specific sheet and cell address
 */
export interface CellMapping {
  mappingKey: string;
  targetType: "cell";
  sheetName: string;
  cellAddress: string; // A1-style: "A1", "B5", etc.
  valueType?: ValueType;
}

/**
 * Named-range mapping: writes to a defined name in the workbook
 */
export interface NamedRangeMapping {
  mappingKey: string;
  targetType: "named_range";
  namedRange: string;
  valueType?: ValueType;
}

/**
 * Table-column mapping: appends repeating rows to an Excel table
 */
export interface TableColumnMapping {
  mappingKey: string;
  targetType: "table_column";
  sheetName: string;
  tableName: string;
  columnName: string;
  sourcePath?: string; // Path for nested data extraction (e.g., "items.0.amount")
  valueType?: ValueType;
}

/**
 * Union of all mapping types
 */
export type ExcelWorkbookMapping =
  | CellMapping
  | NamedRangeMapping
  | TableColumnMapping;

/**
 * Metadata about the inspected workbook
 */
export interface WorkbookMetadata {
  worksheetNames: string[];
  worksheetDimensions: Record<string, { rows: number; columns: number }>;
  definedNames: Array<{
    name: string;
    formula: string;
    scope?: string;
  }>;
  tables: Array<{
    sheetName: string;
    tableName: string;
    displayName: string;
    columns: string[];
    ref?: string;
  }>;
  sampleCells: Array<{
    sheetName: string;
    cellAddress: string;
    value: any;
    type?: string;
  }>;
}

/**
 * Validation schema for cell addresses (A1 style)
 */
const cellAddressRegex = /^[A-Z]+\d+$/;

export const cellAddressSchema = z
  .string()
  .regex(cellAddressRegex, "Invalid cell address format (e.g., A1, B5)");

/**
 * Validation schema for sheet names
 */
export const sheetNameSchema = z
  .string()
  .min(1)
  .max(31)
  .regex(/^[^\[\]:\*?/\\]+$/, "Invalid sheet name");

/**
 * Validation schema for table and column names
 */
export const identifierSchema = z.string().min(1).max(255);

/**
 * Validation schema for mapping keys
 */
export const mappingKeySchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-zA-Z0-9_]+$/, "Mapping key must contain only alphanumeric and underscore");

/**
 * Validation schema for cell mapping
 */
export const cellMappingSchema = z.object({
  mappingKey: mappingKeySchema,
  targetType: z.literal("cell"),
  sheetName: sheetNameSchema,
  cellAddress: cellAddressSchema,
  valueType: z.enum(["auto", "text", "number", "date"]).optional(),
});

/**
 * Validation schema for named range mapping
 */
export const namedRangeMappingSchema = z.object({
  mappingKey: mappingKeySchema,
  targetType: z.literal("named_range"),
  namedRange: identifierSchema,
  valueType: z.enum(["auto", "text", "number", "date"]).optional(),
});

/**
 * Validation schema for table column mapping
 */
export const tableColumnMappingSchema = z.object({
  mappingKey: mappingKeySchema,
  targetType: z.literal("table_column"),
  sheetName: sheetNameSchema,
  tableName: identifierSchema,
  columnName: identifierSchema,
  sourcePath: z.string().optional(),
  valueType: z.enum(["auto", "text", "number", "date"]).optional(),
});

/**
 * Validation schema for any mapping type
 */
export const excelWorkbookMappingSchema = z.union([
  cellMappingSchema,
  namedRangeMappingSchema,
  tableColumnMappingSchema,
]);

/**
 * Validation schema for the complete mapping array
 */
export const excelWorkbookMappingsSchema = z.array(excelWorkbookMappingSchema);

/**
 * Validation schema for workbook metadata
 */
export const workbookMetadataSchema = z.object({
  worksheetNames: z.array(z.string()),
  worksheetDimensions: z.record(z.string(), z.object({
      rows: z.number(),
      columns: z.number(),
    })),
  definedNames: z.array(
    z.object({
      name: z.string(),
      formula: z.string(),
      scope: z.string().optional(),
    })
  ),
  tables: z.array(
    z.object({
      sheetName: z.string(),
      tableName: z.string(),
      displayName: z.string(),
      columns: z.array(z.string()),
      ref: z.string().optional(),
    })
  ),
  sampleCells: z.array(
    z.object({
      sheetName: z.string(),
      cellAddress: z.string(),
      value: z.any(),
      type: z.string().optional(),
    })
  ),
});

/**
 * Validate that a mapping key is either a form field ID or a supported built-in key
 */
export function isValidMappingKey(
  key: string,
  formFieldIds: string[] = []
): boolean {
  return (
    formFieldIds.includes(key) || BUILTIN_MAPPING_KEYS.includes(key as any)
  );
}

/**
 * Validate that mapping keys are unique within a mapping array
 */
export function validateUniqueMappingKeys(
  mappings: ExcelWorkbookMapping[]
): boolean {
  const keys = new Set<string>();
  for (const mapping of mappings) {
    if (keys.has(mapping.mappingKey)) {
      return false;
    }
    keys.add(mapping.mappingKey);
  }
  return true;
}

/**
 * Sanitize output filename to prevent path traversal and invalid characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\:*?"<>|]/g, "_")
    .replace(/^\.+/, "") // Remove leading dots
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .substring(0, 255); // Limit length
}

/**
 * Check if a string looks like a formula (starts with =, +, -, or @)
 */
export function looksLikeFormula(value: any): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return /^[=+\-@]/.test(trimmed);
}

/**
 * Safely convert a value to the target type, preventing formula injection
 */
export function convertValueForExcel(
  value: any,
  valueType: ValueType = "auto"
): any {
  // Prevent formula injection by forcing text format
  if (looksLikeFormula(value)) {
    // If explicitly targeting a formula field, allow it (out of scope for v1)
    // Otherwise, prefix with single quote to force text
    return `'${value}`;
  }

  switch (valueType) {
    case "text":
      // Force text format (preserves leading zeros)
      return String(value);
    case "number":
      // Convert to number, return original if not numeric
      const num = Number(value);
      return isNaN(num) ? value : num;
    case "date":
      // Try to parse as date
      if (value instanceof Date) return value;
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
    case "auto":
    default:
      // Auto-detect: if it looks like a number, convert it
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const num = Number(value);
        if (!isNaN(num) && value.trim() !== "") {
          return num;
        }
      }
      return value;
  }
}

/**
 * Get built-in value for a given key
 */
export function getBuiltinValue(
  key: BuiltinMappingKey,
  context: {
    workflowNumber?: string;
    workflowTitle?: string;
    workflowStatus?: string;
    department?: string;
    submitterName?: string;
    submitterEmail?: string;
    submittedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }
): any {
  switch (key) {
    case "workflow_number":
      return context.workflowNumber || "";
    case "workflow_title":
      return context.workflowTitle || "";
    case "workflow_status":
      return context.workflowStatus || "";
    case "department":
      return context.department || "";
    case "submitter_name":
      return context.submitterName || "";
    case "submitter_email":
      return context.submitterEmail || "";
    case "submitted_at":
      return context.submittedAt || null;
    case "created_at":
      return context.createdAt || null;
    case "updated_at":
      return context.updatedAt || null;
    default:
      return null;
  }
}
