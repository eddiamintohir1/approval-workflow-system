import ExcelJS from "exceljs";
import {
  BUILTIN_MAPPING_KEYS,
  type BuiltinMappingKey,
  type ExcelWorkbookMapping,
  type WorkbookMetadata,
  convertValueForExcel,
  getBuiltinValue,
  looksLikeFormula,
  sanitizeFilename,
} from "../shared/excelMapping";

const INSPECTION_LIMITS = {
  maxWorksheets: 30,
  maxRowsPerSheet: 1_000,
  maxColumnsPerSheet: 100,
  maxSampleCells: 200,
  maxTables: 50,
  maxDefinedNames: 100,
};

type DefinedNameModel = { name: string; ranges: string[] };

function definedNameModels(workbook: ExcelJS.Workbook): DefinedNameModel[] {
  return ((workbook.definedNames.model || []) as DefinedNameModel[]).slice(
    0,
    INSPECTION_LIMITS.maxDefinedNames
  );
}

function parseNamedRange(range: string) {
  const match = range.match(
    /^(?:'((?:[^']|'')+)'|([^!]+))!\$?([A-Z]+)\$?(\d+)$/i
  );
  if (!match) return null;
  return {
    sheetName: (match[1] || match[2]).replace(/''/g, "'"),
    cellAddress: `${match[3].toUpperCase()}${match[4]}`,
  };
}

function readableCellValue(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("formula" in value) return `=${value.formula}`;
    return JSON.stringify(value);
  }
  return String(value);
}

function valueAtPath(value: unknown, path?: string): unknown {
  if (!path) return value;
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current) && /^\d+$/.test(segment)) {
      return current[Number(segment)];
    }
    if (typeof current === "object") {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, value);
}

function writeCell(
  cell: ExcelJS.Cell,
  value: unknown,
  valueType: ExcelWorkbookMapping["valueType"] = "auto"
) {
  cell.value = convertValueForExcel(value, valueType) as ExcelJS.CellValue;
  if (valueType === "text") cell.numFmt = "@";
}

export async function inspectWorkbook(
  buffer: Buffer
): Promise<WorkbookMetadata> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const worksheets = workbook.worksheets.slice(
    0,
    INSPECTION_LIMITS.maxWorksheets
  );
  const worksheetNames = worksheets.map(worksheet => worksheet.name);
  const worksheetDimensions: WorkbookMetadata["worksheetDimensions"] = {};
  const sampleCells: WorkbookMetadata["sampleCells"] = [];
  const tables: WorkbookMetadata["tables"] = [];

  for (const worksheet of worksheets) {
    worksheetDimensions[worksheet.name] = {
      rows: worksheet.rowCount,
      columns: worksheet.columnCount,
    };

    const maxRows = Math.min(
      worksheet.rowCount,
      INSPECTION_LIMITS.maxRowsPerSheet
    );
    const maxColumns = Math.min(
      worksheet.columnCount,
      INSPECTION_LIMITS.maxColumnsPerSheet
    );

    for (let row = 1; row <= maxRows; row += 1) {
      for (let column = 1; column <= maxColumns; column += 1) {
        if (sampleCells.length >= INSPECTION_LIMITS.maxSampleCells) break;
        const cell = worksheet.getCell(row, column);
        if (cell.value !== null && cell.value !== undefined) {
          sampleCells.push({
            sheetName: worksheet.name,
            cellAddress: cell.address,
            value: readableCellValue(cell.value),
            type: String(cell.type),
          });
        }
      }
      if (sampleCells.length >= INSPECTION_LIMITS.maxSampleCells) break;
    }

    const worksheetTables = Object.values(
      (worksheet as unknown as { tables: Record<string, unknown> }).tables || {}
    ) as any[];
    for (const table of worksheetTables) {
      if (tables.length >= INSPECTION_LIMITS.maxTables) break;
      const model = (table as any).table;
      tables.push({
        sheetName: worksheet.name,
        tableName: table.name,
        displayName: table.displayName || table.name,
        columns: (model.columns || []).map(
          (column: { name: string }) => column.name
        ),
        ref: model.ref || model.tableRef,
      });
    }
  }

  return {
    worksheetNames,
    worksheetDimensions,
    definedNames: definedNameModels(workbook).map(item => ({
      name: item.name,
      formula: item.ranges.join(","),
    })),
    tables,
    sampleCells,
  };
}

export async function generateMappedWorkbook(input: {
  templateBuffer: Buffer;
  mappings: ExcelWorkbookMapping[];
  formTemplate: any;
  submission: { formData?: Record<string, unknown> };
  workflow?: any;
  submitter?: any;
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(input.templateBuffer as any);

  const values = new Map<string, unknown>();
  for (const field of input.formTemplate.fields || []) {
    if (field.mappingKey) {
      values.set(field.mappingKey, input.submission.formData?.[field.id]);
    }
  }

  const builtinContext = {
    workflowNumber: input.workflow?.workflowNumber,
    workflowTitle: input.workflow?.title,
    workflowStatus: input.workflow?.status,
    department: input.workflow?.department,
    submitterName: input.submitter?.name,
    submitterEmail: input.submitter?.email,
    submittedAt: input.submittedAt,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
  for (const key of BUILTIN_MAPPING_KEYS) {
    values.set(key, getBuiltinValue(key as BuiltinMappingKey, builtinContext));
  }

  const namedRanges = new Map(
    definedNameModels(workbook).map(item => [item.name, item.ranges])
  );
  const tableGroups = new Map<string, ExcelWorkbookMapping[]>();

  for (const mapping of input.mappings) {
    if (mapping.targetType === "table_column") {
      const groupKey = `${mapping.sheetName}\u0000${mapping.tableName}`;
      tableGroups.set(groupKey, [
        ...(tableGroups.get(groupKey) || []),
        mapping,
      ]);
      continue;
    }

    const value = values.get(mapping.mappingKey);
    if (value === undefined || value === null) continue;

    if (mapping.targetType === "cell") {
      const worksheet = workbook.getWorksheet(mapping.sheetName);
      if (!worksheet) throw new Error(`Sheet "${mapping.sheetName}" not found`);
      writeCell(
        worksheet.getCell(mapping.cellAddress),
        value,
        mapping.valueType
      );
      continue;
    }

    const range = namedRanges.get(mapping.namedRange)?.[0];
    const target = range ? parseNamedRange(range) : null;
    if (!target)
      throw new Error(`Named range "${mapping.namedRange}" is invalid`);
    const worksheet = workbook.getWorksheet(target.sheetName);
    if (!worksheet) throw new Error(`Sheet "${target.sheetName}" not found`);
    writeCell(worksheet.getCell(target.cellAddress), value, mapping.valueType);
  }

  for (const [groupKey, mappings] of Array.from(tableGroups.entries())) {
    const [sheetName, tableName] = groupKey.split("\u0000");
    const worksheet = workbook.getWorksheet(sheetName);
    const table = worksheet?.getTable(tableName);
    if (!worksheet || !table) throw new Error(`Table "${tableName}" not found`);
    const model = (table as any).table;
    const columnNames = (model.columns || []).map(
      (column: { name: string }) => column.name
    );
    const sourceRows: unknown[][] = mappings.map(
      (mapping: ExcelWorkbookMapping) => {
        const raw = values.get(mapping.mappingKey);
        return Array.isArray(raw)
          ? raw
          : raw === undefined || raw === null
            ? []
            : [raw];
      }
    );
    const rowCount = Math.max(
      0,
      ...sourceRows.map((rows: unknown[]) => rows.length)
    );

    const appendedRows: unknown[][] = [];
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const row = Array(columnNames.length).fill(null);
      mappings.forEach(
        (mapping: ExcelWorkbookMapping, mappingIndex: number) => {
          if (mapping.targetType !== "table_column") return;
          const columnIndex = columnNames.indexOf(mapping.columnName);
          if (columnIndex < 0) return;
          const sourceValue = valueAtPath(
            sourceRows[mappingIndex][rowIndex],
            mapping.sourcePath
          );
          row[columnIndex] = convertValueForExcel(
            sourceValue,
            mapping.valueType
          );
        }
      );
      appendedRows.push(row);
    }

    if (appendedRows.length > 0) {
      const range = String(model.ref || model.tableRef || "");
      const [startAddress, endAddress] = range.split(":");
      if (!startAddress || !endAddress) {
        throw new Error(`Table "${tableName}" has an invalid range`);
      }
      const start = worksheet.getCell(startAddress.replace(/\$/g, ""));
      const end = worksheet.getCell(endAddress.replace(/\$/g, ""));
      const firstDataRow =
        Number(start.row) + (model.headerRow === false ? 0 : 1);
      const lastDataRow = Number(end.row) - (model.totalsRow ? 1 : 0);
      const existingRows: unknown[][] = [];
      for (
        let rowNumber = firstDataRow;
        rowNumber <= lastDataRow;
        rowNumber += 1
      ) {
        existingRows.push(
          columnNames.map(
            (_: string, index: number) =>
              worksheet.getCell(rowNumber, Number(start.col) + index).value
          )
        );
      }

      worksheet.removeTable(tableName);
      worksheet.addTable({
        name: model.name,
        displayName: model.displayName || model.name,
        ref: startAddress.replace(/\$/g, ""),
        headerRow: model.headerRow !== false,
        totalsRow: Boolean(model.totalsRow),
        style: model.style,
        columns: model.columns,
        rows: [...existingRows, ...appendedRows],
      });
    }
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function validateMappings(
  buffer: Buffer,
  mappings: ExcelWorkbookMapping[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const namedRanges = new Map(
      definedNameModels(workbook).map(item => [item.name, item.ranges])
    );
    const targets = new Set<string>();

    for (const mapping of mappings) {
      let targetKey: string;
      if (mapping.targetType === "cell") {
        targetKey = `cell:${mapping.sheetName}:${mapping.cellAddress}`;
        if (!workbook.getWorksheet(mapping.sheetName)) {
          errors.push(`Sheet "${mapping.sheetName}" not found`);
        }
      } else if (mapping.targetType === "named_range") {
        targetKey = `name:${mapping.namedRange}`;
        if (!namedRanges.has(mapping.namedRange)) {
          errors.push(`Named range "${mapping.namedRange}" not found`);
        }
      } else {
        targetKey = `table:${mapping.sheetName}:${mapping.tableName}:${mapping.columnName}`;
        const table = workbook
          .getWorksheet(mapping.sheetName)
          ?.getTable(mapping.tableName);
        if (!table) {
          errors.push(
            `Table "${mapping.tableName}" not found in sheet "${mapping.sheetName}"`
          );
        } else {
          const columns = ((table as any).table.columns || []).map(
            (column: { name: string }) => column.name
          );
          if (!columns.includes(mapping.columnName)) {
            errors.push(
              `Column "${mapping.columnName}" not found in table "${mapping.tableName}"`
            );
          }
        }
      }

      if (targets.has(targetKey))
        errors.push(`Target "${targetKey}" is mapped twice`);
      targets.add(targetKey);
    }
  } catch (error) {
    errors.push(
      `Failed to validate workbook: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
  return { valid: errors.length === 0, errors };
}

export function generateOutputFilename(
  pattern: string | undefined,
  context: {
    templateName?: string;
    workflowNumber?: string;
    submittedAt?: Date;
  }
): string {
  let filename = pattern || "{templateName}_{workflowNumber}_{timestamp}.xlsx";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const replacements: Record<string, string> = {
    "{templateName}": context.templateName || "export",
    "{workflowNumber}": context.workflowNumber || "",
    "{timestamp}": timestamp,
    "{date}": (context.submittedAt || new Date()).toISOString().slice(0, 10),
  };
  for (const [token, value] of Object.entries(replacements)) {
    filename = filename.replaceAll(token, value);
  }
  filename = sanitizeFilename(filename) || `export_${timestamp}`;
  return filename.toLowerCase().endsWith(".xlsx")
    ? filename
    : `${filename}.xlsx`;
}

export { convertValueForExcel, looksLikeFormula, sanitizeFilename };
