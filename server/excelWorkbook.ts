/**
 * Excel workbook inspection and generation service
 * Handles bounded workbook parsing, metadata extraction, and mapped value generation
 */
import ExcelJS from "exceljs";
import {
  ExcelWorkbookMapping,
  WorkbookMetadata,
  convertValueForExcel,
  looksLikeFormula,
  sanitizeFilename,
  CellMapping,
  NamedRangeMapping,
  TableColumnMapping,
} from "../shared/excelMapping";

const INSPECTION_LIMITS = {
  maxRowsPerSheet: 1000,
  maxColumnsPerSheet: 50,
  maxSampleCells: 100,
  maxTables: 20,
  maxDefinedNames: 50,
};

/**
 * Inspect workbook and extract metadata for mapping configuration
 */
export async function inspectWorkbook(buffer: Buffer): Promise<WorkbookMetadata> {
  const workbook = new ExcelJS.Workbook();
  await (workbook.xlsx.load as any)(buffer);

  const worksheetNames: string[] = [];
  const worksheetDimensions: Record<string, { rows: number; columns: number }> = {};
  const sampleCells: any[] = [];
  const tables: any[] = [];
  let cellCount = 0;

  for (const worksheet of workbook.worksheets) {
    worksheetNames.push(worksheet.name);

    const dimensions = (worksheet.dimensions as any) || {};
    worksheetDimensions[worksheet.name] = {
      rows: dimensions.lastRow || 0,
      columns: dimensions.lastCol || 0,
    };

    const maxRows = Math.min(
      dimensions?.lastRow || 0,
      INSPECTION_LIMITS.maxRowsPerSheet
    );
    const maxCols = Math.min(
      dimensions?.lastCol || 0,
      INSPECTION_LIMITS.maxColumnsPerSheet
    );

    for (let row = 1; row <= maxRows && cellCount < INSPECTION_LIMITS.maxSampleCells; row++) {
      for (let col = 1; col <= maxCols && cellCount < INSPECTION_LIMITS.maxSampleCells; col++) {
        const cell = worksheet.getCell(row, col);
        if (cell.value !== null && cell.value !== undefined) {
          const colLetter = (ExcelJS as any).utils.colNumToLetter(col);
          const cellAddress = `${colLetter}${row}`;
          sampleCells.push({
            sheetName: worksheet.name,
            cellAddress,
            value: String((cell as any).value),
            type: (cell as any).type,
          });
          cellCount++;
        }
      }
    }

    if ((worksheet as any).tables) {
      for (const [tableName, tableData] of Object.entries((worksheet as any).tables)) {
        const columns = ((tableData as any)?.columns || []).map((col: any) => col.name) || [];
        tables.push({
          sheetName: worksheet.name,
          tableName,
          displayName: (tableData as any)?.displayName || tableName,
          columns,
          ref: (tableData as any)?.ref,
        });
      }
    }
  }

  const definedNames = (Array.isArray(workbook.definedNames) ? workbook.definedNames : []).map((name: any) => ({
    name: name.name,
    formula: name.formula || "",
  }));

  return {
    worksheetNames,
    worksheetDimensions,
    definedNames,
    tables,
    sampleCells,
  };
}

/**
 * Generate mapped workbook with form submission data
 */
export async function generateMappedWorkbook(input: {
  templateBuffer: Buffer;
  mappings: ExcelWorkbookMapping[];
  formTemplate: any;
  submission: any;
  workflow?: any;
  submitter?: any;
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await (workbook.xlsx.load as any)(input.templateBuffer);

  const mappingsByKey = new Map(input.mappings.map((m) => [m.mappingKey, m]));

  for (const field of input.formTemplate.fields || []) {
    const mapping = mappingsByKey.get(field.mappingKey);
    if (!mapping) continue;

    const value = input.submission.formData?.[field.id];
    if (value === undefined || value === null) continue;

    const convertedValue = convertValueForExcel(value, (mapping as any).valueType);

    if (mapping.targetType === "cell") {
      const cellMapping = mapping as CellMapping;
      const worksheet = workbook.getWorksheet(cellMapping.sheetName);
      if (worksheet) {
        const cell = worksheet.getCell(cellMapping.cellAddress);
        if (looksLikeFormula(value) && typeof convertedValue === "string") {
          cell.value = `'${convertedValue}`;
        } else {
          cell.value = convertedValue;
        }
      }
    } else if (mapping.targetType === "named_range") {
      const namedMapping = mapping as NamedRangeMapping;
      const namedRange = (Array.isArray(workbook.definedNames) ? workbook.definedNames : []).find(
        (n: any) => n.name === namedMapping.namedRange
      );
      if (namedRange) {
        const formula = namedRange.formula;
        const match = formula.match(/^'?([^']+)'?!([A-Z]+\d+)$/);
        if (match) {
          const sheetName = match[1];
          const cellAddress = match[2];
          const worksheet = workbook.getWorksheet(sheetName);
          if (worksheet) {
            const cell = worksheet.getCell(cellAddress);
            cell.value = convertedValue;
          }
        }
      }
    } else if (mapping.targetType === "table_column") {
      const tableMapping = mapping as TableColumnMapping;
      const worksheet = workbook.getWorksheet(tableMapping.sheetName);
      if (worksheet && (worksheet as any).tables) {
        const table = ((worksheet as any).tables as any)[tableMapping.tableName];
        if (table) {
          const columnIndex = (table.columns || []).findIndex(
            (col: any) => col.name === tableMapping.columnName
          );
          if (columnIndex >= 0) {
            const startRow = parseInt(table.ref.split(":")[0].replace(/[A-Z]/g, ""));
            const values = (mapping as any).values || [];
            for (let i = 0; i < values.length; i++) {
              const row = startRow + 1 + i;
              const cell = worksheet.getCell(row, columnIndex + 1);
              cell.value = convertValueForExcel(values[i], "auto");
            }
          }
        }
      }
    }
  }

  return (await workbook.xlsx.writeBuffer()) as any;
}

/**
 * Validate that all mapping targets exist in the workbook
 */
export async function validateMappings(
  buffer: Buffer,
  mappings: ExcelWorkbookMapping[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  try {
    const workbook = new ExcelJS.Workbook();
    await (workbook.xlsx.load as any)(buffer);
    const worksheetNames = new Set(workbook.worksheets.map((ws) => ws.name));
    const definedNames = new Set(
      (Array.isArray(workbook.definedNames) ? workbook.definedNames : []).map((name: any) => name.name)
    );

    for (const mapping of mappings) {
      if (mapping.targetType === "cell") {
        const cellMapping = mapping as CellMapping;
        if (!worksheetNames.has(cellMapping.sheetName)) {
          errors.push(`Sheet "${cellMapping.sheetName}" not found`);
        }
      } else if (mapping.targetType === "named_range") {
        const namedMapping = mapping as NamedRangeMapping;
        if (!definedNames.has(namedMapping.namedRange)) {
          errors.push(`Named range "${namedMapping.namedRange}" not found`);
        }
      } else if (mapping.targetType === "table_column") {
        const tableMapping = mapping as TableColumnMapping;
        if (!worksheetNames.has(tableMapping.sheetName)) {
          errors.push(`Sheet "${tableMapping.sheetName}" not found for table mapping`);
        }
        let tableFound = false;
        const worksheet = workbook.getWorksheet(tableMapping.sheetName);
        if (worksheet && (worksheet as any).tables) {
          const table = ((worksheet as any).tables as any)[tableMapping.tableName];
          if (table) {
            const columns = (table.columns || []).map((col: any) => col.name);
            if (!columns.includes(tableMapping.columnName)) {
              errors.push(
                `Column "${tableMapping.columnName}" not found in table "${tableMapping.tableName}"`
              );
            }
            tableFound = true;
          }
        }
        if (!tableFound) {
          errors.push(`Table "${tableMapping.tableName}" not found in sheet "${tableMapping.sheetName}"`);
        }
      }
    }
  } catch (error) {
    errors.push(`Failed to validate workbook: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate output filename from pattern and context
 */
export function generateOutputFilename(
  pattern: string | undefined,
  context: {
    templateName?: string;
    workflowNumber?: string;
    submittedAt?: Date;
  }
): string {
  let filename = pattern || "{templateName}_{workflowNumber}_{timestamp}.xlsx";
  filename = filename.replace("{templateName}", context.templateName || "export");
  filename = filename.replace("{workflowNumber}", context.workflowNumber || "");
  filename = filename.replace(
    "{timestamp}",
    new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19)
  );
  filename = filename.replace("{date}", new Date().toISOString().substring(0, 10));
  filename = sanitizeFilename(filename);
  if (!filename.endsWith(".xlsx")) {
    filename += ".xlsx";
  }
  return filename;
}

// Re-export utility functions for testing
export { convertValueForExcel, looksLikeFormula, sanitizeFilename };
