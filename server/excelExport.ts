import ExcelJS from "exceljs";
import path from "path";
import fs from "fs/promises";

interface WorkflowData {
  workflowNumber: string;
  title: string;
  department: string;
  requester: string;
  createdAt: Date;
  formData?: Record<string, any>;
  stages?: Array<{
    stageName: string;
    status: string;
    approvedBy?: string;
    approvedAt?: Date;
  }>;
}

interface SignatureData {
  ceoSignatureUrl?: string;
  cfoSignatureUrl?: string;
}

/**
 * Generate Excel file for MAF workflow with data and signatures
 */
export async function generateMAFExcel(
  workflowData: WorkflowData,
  signatures: SignatureData
): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), "templates", "MAF02.2026.xlsx");
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);
  
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error("Worksheet not found in template");
  }

  // Fill in workflow data (adjust cell references based on your template)
  // Example mappings - you'll need to adjust these based on actual template structure
  worksheet.getCell("B5").value = workflowData.workflowNumber;
  worksheet.getCell("B6").value = workflowData.title;
  worksheet.getCell("B7").value = workflowData.department;
  worksheet.getCell("B8").value = workflowData.requester;
  worksheet.getCell("B9").value = workflowData.createdAt.toLocaleDateString();

  // Add CEO signature if available
  if (signatures.ceoSignatureUrl) {
    try {
      const response = await fetch(signatures.ceoSignatureUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const imageId = workbook.addImage({
        buffer,
        extension: "png",
      });

      // Add image to CEO signature cell (adjust position based on template)
      worksheet.addImage(imageId, {
        tl: { col: 5, row: 20 }, // Top-left position
        ext: { width: 100, height: 50 }, // Size
      });
    } catch (error) {
      console.error("Failed to add CEO signature:", error);
    }
  }

  // Add CFO signature if available
  if (signatures.cfoSignatureUrl) {
    try {
      const response = await fetch(signatures.cfoSignatureUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const imageId = workbook.addImage({
        buffer,
        extension: "png",
      });

      // Add image to CFO signature cell (adjust position based on template)
      worksheet.addImage(imageId, {
        tl: { col: 5, row: 22 }, // Top-left position
        ext: { width: 100, height: 50 }, // Size
      });
    } catch (error) {
      console.error("Failed to add CFO signature:", error);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generate Excel file for PR workflow with data and signatures
 */
export async function generatePRExcel(
  workflowData: WorkflowData,
  signatures: SignatureData
): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), "templates", "PR02.2026.xlsx");
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);
  
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error("Worksheet not found in template");
  }

  // Fill in workflow data (adjust cell references based on your template)
  worksheet.getCell("B5").value = workflowData.workflowNumber;
  worksheet.getCell("B6").value = workflowData.title;
  worksheet.getCell("B7").value = workflowData.department;
  worksheet.getCell("B8").value = workflowData.requester;
  worksheet.getCell("B9").value = workflowData.createdAt.toLocaleDateString();

  // Add CEO signature if available
  if (signatures.ceoSignatureUrl) {
    try {
      const response = await fetch(signatures.ceoSignatureUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const imageId = workbook.addImage({
        buffer,
        extension: "png",
      });

      worksheet.addImage(imageId, {
        tl: { col: 5, row: 20 },
        ext: { width: 100, height: 50 },
      });
    } catch (error) {
      console.error("Failed to add CEO signature:", error);
    }
  }

  // Add CFO signature if available
  if (signatures.cfoSignatureUrl) {
    try {
      const response = await fetch(signatures.cfoSignatureUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const imageId = workbook.addImage({
        buffer,
        extension: "png",
      });

      worksheet.addImage(imageId, {
        tl: { col: 5, row: 22 },
        ext: { width: 100, height: 50 },
      });
    } catch (error) {
      console.error("Failed to add CFO signature:", error);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generate Excel file for CATTO workflow with data and signatures
 */
export async function generateCATTOExcel(
  workflowData: WorkflowData,
  signatures: SignatureData
): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), "templates", "CattoPAF02.2026.xlsx");
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);
  
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error("Worksheet not found in template");
  }

  // Fill in workflow data (adjust cell references based on your template)
  worksheet.getCell("B5").value = workflowData.workflowNumber;
  worksheet.getCell("B6").value = workflowData.title;
  worksheet.getCell("B7").value = workflowData.department;
  worksheet.getCell("B8").value = workflowData.requester;
  worksheet.getCell("B9").value = workflowData.createdAt.toLocaleDateString();

  // Add CEO signature if available
  if (signatures.ceoSignatureUrl) {
    try {
      const response = await fetch(signatures.ceoSignatureUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const imageId = workbook.addImage({
        buffer,
        extension: "png",
      });

      worksheet.addImage(imageId, {
        tl: { col: 5, row: 20 },
        ext: { width: 100, height: 50 },
      });
    } catch (error) {
      console.error("Failed to add CEO signature:", error);
    }
  }

  // Add CFO signature if available
  if (signatures.cfoSignatureUrl) {
    try {
      const response = await fetch(signatures.cfoSignatureUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const imageId = workbook.addImage({
        buffer,
        extension: "png",
      });

      worksheet.addImage(imageId, {
        tl: { col: 5, row: 22 },
        ext: { width: 100, height: 50 },
      });
    } catch (error) {
      console.error("Failed to add CFO signature:", error);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
