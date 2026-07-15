import { describe, it, expect, beforeAll } from "vitest";
import ExcelJS from "exceljs";
import {
  inspectWorkbook,
  generateMappedWorkbook,
  validateMappings,
  generateOutputFilename,
  convertValueForExcel,
  looksLikeFormula,
  sanitizeFilename,
} from "./excelWorkbook";
import {
  ExcelWorkbookMapping,
  CellMapping,
  NamedRangeMapping,
  TableColumnMapping,
} from "../shared/excelMapping";

describe("Excel Workbook Service", () => {
  let testWorkbookBuffer: Buffer;

  beforeAll(async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Payment Request");

    worksheet.getCell("A1").value = "Account Number";
    worksheet.getCell("B1").value = "001234";
    worksheet.getCell("B1").numFmt = "@";

    worksheet.getCell("A2").value = "Account Name";
    worksheet.getCell("B2").value = "Acme Corporation";

    worksheet.getCell("A3").value = "Amount";
    worksheet.getCell("B3").value = 15000;
    worksheet.getCell("B3").numFmt = "#,##0.00";

    worksheet.getCell("B4").value = { formula: "B3*1.1", result: 16500 };
    workbook.definedNames.add("'Payment Request'!$B$2", "AccountName");

    worksheet.addTable({
      name: "InvoiceItems",
      ref: "A6:C8",
      headerRow: true,
      columns: [{ name: "Item" }, { name: "Quantity" }, { name: "Amount" }],
      rows: [
        ["Item 1", 5, 1000],
        ["Item 2", 3, 500],
      ],
    });

    worksheet.getCell("A1").font = { bold: true };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    testWorkbookBuffer = await workbook.xlsx.writeBuffer();
  });

  describe("inspectWorkbook", () => {
    it("should extract worksheet metadata", async () => {
      const metadata = await inspectWorkbook(testWorkbookBuffer);

      expect(metadata.worksheetNames).toContain("Payment Request");
      expect(
        metadata.worksheetDimensions["Payment Request"].rows
      ).toBeGreaterThan(0);
      expect(metadata.definedNames).toContainEqual(
        expect.objectContaining({ name: "AccountName" })
      );
      expect(metadata.tables).toContainEqual(
        expect.objectContaining({
          tableName: "InvoiceItems",
          columns: ["Item", "Quantity", "Amount"],
        })
      );
      expect(metadata.sampleCells).toContainEqual(
        expect.objectContaining({ cellAddress: "A1" })
      );
    });
  });

  describe("validateMappings", () => {
    it("should validate cell mappings", async () => {
      const mappings: ExcelWorkbookMapping[] = [
        {
          mappingKey: "account_number",
          targetType: "cell",
          sheetName: "Payment Request",
          cellAddress: "B1",
          valueType: "text",
        } as CellMapping,
      ];

      const result = await validateMappings(testWorkbookBuffer, mappings);
      expect(result).toEqual({ valid: true, errors: [] });
    });

    it("should reject invalid sheet names", async () => {
      const mappings: ExcelWorkbookMapping[] = [
        {
          mappingKey: "test",
          targetType: "cell",
          sheetName: "NonExistent",
          cellAddress: "A1",
        } as CellMapping,
      ];

      const result = await validateMappings(testWorkbookBuffer, mappings);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("generateMappedWorkbook", () => {
    it("should generate workbook with mapped values", async () => {
      const mappings: ExcelWorkbookMapping[] = [
        {
          mappingKey: "account_number",
          targetType: "cell",
          sheetName: "Payment Request",
          cellAddress: "B1",
          valueType: "text",
        } as CellMapping,
      ];

      const formTemplate = {
        fields: [
          {
            id: "field1",
            label: "Account Number",
            mappingKey: "account_number",
          },
        ],
      };

      const submission = {
        formData: {
          field1: "009876",
        },
      };

      const generatedBuffer = await generateMappedWorkbook({
        templateBuffer: testWorkbookBuffer,
        mappings,
        formTemplate,
        submission,
      });

      expect(generatedBuffer).toBeInstanceOf(Buffer);
      expect(generatedBuffer.length).toBeGreaterThan(0);

      const generatedWorkbook = new ExcelJS.Workbook();
      await generatedWorkbook.xlsx.load(generatedBuffer);
      const generatedSheet = generatedWorkbook.getWorksheet("Payment Request");

      expect(generatedSheet?.getCell("B1").value).toBe("009876");
    });

    it("should prevent formula injection", async () => {
      const mappings: ExcelWorkbookMapping[] = [
        {
          mappingKey: "account_name",
          targetType: "cell",
          sheetName: "Payment Request",
          cellAddress: "B2",
          valueType: "auto",
        } as CellMapping,
      ];

      const formTemplate = {
        fields: [
          {
            id: "field1",
            label: "Account Name",
            mappingKey: "account_name",
          },
        ],
      };

      const submission = {
        formData: {
          field1: "=1+1",
        },
      };

      const generatedBuffer = await generateMappedWorkbook({
        templateBuffer: testWorkbookBuffer,
        mappings,
        formTemplate,
        submission,
      });

      const generatedWorkbook = new ExcelJS.Workbook();
      await generatedWorkbook.xlsx.load(generatedBuffer);
      const generatedSheet = generatedWorkbook.getWorksheet("Payment Request");

      expect(generatedSheet?.getCell("B2").value).toBe("'=1+1");
    });

    it("writes named ranges, built-ins, and repeating table rows", async () => {
      const mappings: ExcelWorkbookMapping[] = [
        {
          mappingKey: "account_name",
          targetType: "named_range",
          namedRange: "AccountName",
          valueType: "text",
        } as NamedRangeMapping,
        {
          mappingKey: "workflow_number",
          targetType: "cell",
          sheetName: "Payment Request",
          cellAddress: "B5",
          valueType: "text",
        } as CellMapping,
        {
          mappingKey: "items",
          targetType: "table_column",
          sheetName: "Payment Request",
          tableName: "InvoiceItems",
          columnName: "Item",
          sourcePath: "name",
        } as TableColumnMapping,
        {
          mappingKey: "items",
          targetType: "table_column",
          sheetName: "Payment Request",
          tableName: "InvoiceItems",
          columnName: "Quantity",
          sourcePath: "quantity",
          valueType: "number",
        } as TableColumnMapping,
      ];
      const generatedBuffer = await generateMappedWorkbook({
        templateBuffer: testWorkbookBuffer,
        mappings,
        formTemplate: {
          fields: [
            { id: "name", mappingKey: "account_name" },
            { id: "items", mappingKey: "items" },
          ],
        },
        submission: {
          formData: {
            name: "Compawnion",
            items: [
              { name: "Service", quantity: 2 },
              { name: "Material", quantity: 4 },
            ],
          },
        },
        workflow: { workflowNumber: "WF-009" },
      });

      const generated = new ExcelJS.Workbook();
      await generated.xlsx.load(generatedBuffer);
      const sheet = generated.getWorksheet("Payment Request")!;
      expect(sheet.getCell("B2").value).toBe("Compawnion");
      expect(sheet.getCell("B5").value).toBe("WF-009");
      expect(sheet.getCell("A9").value).toBe("Service");
      expect(sheet.getCell("B9").value).toBe(2);
      expect(sheet.getCell("A10").value).toBe("Material");
      expect(sheet.getCell("B10").value).toBe(4);
      expect((sheet.getTable("InvoiceItems") as any).table.tableRef).toBe(
        "A6:C10"
      );
      expect(sheet.getCell("B4").value).toEqual(
        expect.objectContaining({ formula: "B3*1.1" })
      );
      expect(sheet.getCell("A1").font.bold).toBe(true);
    });
  });

  describe("Utility Functions", () => {
    describe("looksLikeFormula", () => {
      it("should detect formula-like strings", () => {
        expect(looksLikeFormula("=1+1")).toBe(true);
        expect(looksLikeFormula("+1")).toBe(true);
        expect(looksLikeFormula("-1")).toBe(true);
        expect(looksLikeFormula("@SUM(A1:A10)")).toBe(true);
        expect(looksLikeFormula("Normal text")).toBe(false);
        expect(looksLikeFormula(123)).toBe(false);
      });
    });

    describe("convertValueForExcel", () => {
      it("should preserve leading zeros with text format", () => {
        const result = convertValueForExcel("001234", "text");
        expect(result).toBe("001234");
      });

      it("should convert to number when appropriate", () => {
        const result = convertValueForExcel("123", "number");
        expect(result).toBe(123);
      });

      it("should prevent formula injection", () => {
        const result = convertValueForExcel("=1+1", "auto");
        expect(typeof result).toBe("string");
      });
    });

    describe("sanitizeFilename", () => {
      it("should remove path separators", () => {
        const result = sanitizeFilename("../../../etc/passwd");
        expect(result).not.toContain("/");
      });

      it("should remove invalid characters", () => {
        const result = sanitizeFilename('file<name>:"test"');
        expect(result).not.toMatch(/[<>:"|?*]/);
      });

      it("should limit length", () => {
        const longName = "a".repeat(300);
        const result = sanitizeFilename(longName);
        expect(result.length).toBeLessThanOrEqual(255);
      });
    });

    describe("generateOutputFilename", () => {
      it("should generate valid filename", () => {
        const filename = generateOutputFilename(
          "{templateName}_{workflowNumber}.xlsx",
          {
            templateName: "Payment Request",
            workflowNumber: "WF-001",
          }
        );

        expect(filename).toMatch(/\.xlsx$/);
        expect(filename.length).toBeGreaterThan(0);
      });

      it("should use default pattern if not provided", () => {
        const filename = generateOutputFilename(undefined, {
          templateName: "Test",
        });

        expect(filename).toMatch(/\.xlsx$/);
      });
    });
  });
});
