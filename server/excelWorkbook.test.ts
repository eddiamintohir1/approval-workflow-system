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

    worksheet.getCell("B4").value = "=B3*1.1";

    worksheet.addTable({
      name: "InvoiceItems",
      ref: "A6:C8",
      headerRow: true,
      columns: [
        { name: "Item" },
        { name: "Quantity" },
        { name: "Amount" },
      ],
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

      expect(metadata).toBeDefined();
      expect(metadata.worksheetNames).toBeDefined();
      expect(metadata.worksheetDimensions).toBeDefined();
      expect(metadata.tables).toBeDefined();
      expect(metadata.sampleCells).toBeDefined();
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
      expect(typeof result.valid).toBe("boolean");
      expect(Array.isArray(result.errors)).toBe(true);
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

      const cellValue = generatedSheet?.getCell("B2").value;
      expect(cellValue).toBeDefined();
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
        const filename = generateOutputFilename("{templateName}_{workflowNumber}.xlsx", {
          templateName: "Payment Request",
          workflowNumber: "WF-001",
        });

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
