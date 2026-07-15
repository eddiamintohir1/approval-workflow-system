import { describe, expect, it } from "vitest";
import { storageGet, storagePut } from "./storage";

const integrationTest = process.env.AZURE_STORAGE_CONNECTION_STRING
  ? it
  : it.skip;

describe("Azure Blob Storage", () => {
  integrationTest(
    "uploads and retrieves a private test file",
    async () => {
      const testContent = "Azure Blob Storage validation";
      const testKey = `test/${Date.now()}-test.txt`;

      const upload = await storagePut(
        testKey,
        Buffer.from(testContent),
        "text/plain"
      );
      expect(upload.key).toBe(testKey);
      expect(upload.url).toContain("blob.core.windows.net");

      const stored = await storageGet(testKey);
      const response = await fetch(stored.url);
      expect(response.ok).toBe(true);
      expect(await response.text()).toBe(testContent);
    },
    30_000
  );
});
