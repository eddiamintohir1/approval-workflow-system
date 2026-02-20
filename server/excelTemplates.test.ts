import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import { randomUUID } from "crypto";

describe("Excel Templates", () => {
  let testUserId: number;
  let testTemplateId: number;

  beforeAll(async () => {
    // Create a test user
    const testUser = await db.upsertUser({
      cognitoSub: `test-excel-${randomUUID()}`,
      openId: randomUUID(),
      email: `test-excel-${Date.now()}@compawnion.co`,
      fullName: "Test Excel User",
      role: "admin",
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Cleanup: delete test template if created
    if (testTemplateId) {
      try {
        await db.deleteExcelTemplate(testTemplateId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  it("should create an Excel template", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        email: `test-excel-${Date.now()}@compawnion.co`,
        role: "admin",
        fullName: "Test Excel User",
        cognitoSub: "test-sub",
        openId: "test-openid",
        department: "IT",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        signatureUrl: null,
        cognitoGroups: null,
      },
    });

    const result = await caller.excelTemplates.create({
      workflowType: "MAF",
      templateName: "Test MAF Template",
      description: "Test template for MAF workflows",
      fileUrl: "https://example.com/test-template.xlsx",
      fileKey: "templates/test-maf.xlsx",
      fileName: "test-maf.xlsx",
      fileSize: 50000,
    });

    expect(result).toBeDefined();
    expect(result.insertId).toBeDefined();
    
    // Store for cleanup
    testTemplateId = result.insertId as number;
  });

  it("should retrieve all Excel templates", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        email: `test-excel-${Date.now()}@compawnion.co`,
        role: "admin",
        fullName: "Test Excel User",
        cognitoSub: "test-sub",
        openId: "test-openid",
        department: "IT",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        signatureUrl: null,
        cognitoGroups: null,
      },
    });

    const templates = await caller.excelTemplates.getAll();
    
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
  });

  it("should retrieve active Excel templates only", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        email: `test-excel-${Date.now()}@compawnion.co`,
        role: "admin",
        fullName: "Test Excel User",
        cognitoSub: "test-sub",
        openId: "test-openid",
        department: "IT",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        signatureUrl: null,
        cognitoGroups: null,
      },
    });

    const templates = await caller.excelTemplates.getActive();
    
    expect(Array.isArray(templates)).toBe(true);
    // All returned templates should be active
    templates.forEach(template => {
      expect(template.isActive).toBe(true);
    });
  });

  it("should retrieve template by workflow type", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        email: `test-excel-${Date.now()}@compawnion.co`,
        role: "admin",
        fullName: "Test Excel User",
        cognitoSub: "test-sub",
        openId: "test-openid",
        department: "IT",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        signatureUrl: null,
        cognitoGroups: null,
      },
    });

    const template = await caller.excelTemplates.getByWorkflowType({
      workflowType: "MAF",
    });
    
    if (template) {
      expect(template.workflowType).toBe("MAF");
      expect(template.isActive).toBe(true);
    }
  });

  it("should update an Excel template", async () => {
    if (!testTemplateId) {
      // Skip if no template was created
      return;
    }

    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        email: `test-excel-${Date.now()}@compawnion.co`,
        role: "admin",
        fullName: "Test Excel User",
        cognitoSub: "test-sub",
        openId: "test-openid",
        department: "IT",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        signatureUrl: null,
        cognitoGroups: null,
      },
    });

    const result = await caller.excelTemplates.update({
      id: testTemplateId,
      templateName: "Updated MAF Template",
      description: "Updated description",
      isActive: false,
    });

    expect(result.success).toBe(true);

    // Verify the update
    const updatedTemplate = await db.getExcelTemplateById(testTemplateId);
    expect(updatedTemplate?.templateName).toBe("Updated MAF Template");
    expect(updatedTemplate?.isActive).toBe(false);
  });

  it("should delete an Excel template", async () => {
    // Create a template specifically for deletion test
    const tempTemplate = await db.createExcelTemplate({
      workflowType: "TEST",
      templateName: "Temp Delete Template",
      fileUrl: "https://example.com/temp.xlsx",
      fileKey: "templates/temp.xlsx",
      fileName: "temp.xlsx",
      uploadedBy: testUserId,
    });

    const tempId = tempTemplate.insertId as number;

    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        email: `test-excel-${Date.now()}@compawnion.co`,
        role: "admin",
        fullName: "Test Excel User",
        cognitoSub: "test-sub",
        openId: "test-openid",
        department: "IT",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        signatureUrl: null,
        cognitoGroups: null,
      },
    });

    const result = await caller.excelTemplates.delete({ id: tempId });
    expect(result.success).toBe(true);

    // Verify deletion
    const deletedTemplate = await db.getExcelTemplateById(tempId);
    expect(deletedTemplate).toBeNull();
  });
});
