import { describe, expect, it } from "vitest";
import { storagePut, storageGet } from "./storage";

describe("AWS S3 Storage", () => {
  it("should successfully upload and retrieve a test file", async () => {
    const testContent = "Test file content for AWS S3 validation";
    const testKey = `test/${Date.now()}-test.txt`;
    
    // Upload test file
    const uploadResult = await storagePut(
      testKey,
      Buffer.from(testContent),
      "text/plain"
    );

    expect(uploadResult).toBeDefined();
    expect(uploadResult.key).toBe(testKey);
    expect(uploadResult.url).toBeDefined();
    expect(uploadResult.url).toContain("amazonaws.com"); // Check it's an AWS S3 URL

    // Retrieve the file URL
    const getResult = await storageGet(testKey);
    
    expect(getResult).toBeDefined();
    expect(getResult.key).toBe(testKey);
    expect(getResult.url).toBeDefined();

    // Verify the file is accessible
    const response = await fetch(getResult.url);
    expect(response.ok).toBe(true);
    
    const retrievedContent = await response.text();
    expect(retrievedContent).toBe(testContent);
  }, 30000); // 30 second timeout for network operations
});
