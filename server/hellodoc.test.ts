import { describe, it, expect } from "vitest";
import { getAccountInfo } from "./hellodoc";

describe("Dropbox Sign API Integration", () => {
  it("should have HELLODOC_API_KEY environment variable set", () => {
    expect(process.env.HELLODOC_API_KEY).toBeDefined();
    expect(process.env.HELLODOC_API_KEY).toBe("3b1bada35cbb5e8d505571e191fc70ccd011a35d5dc8e9d94c257a6870732449");
  });

  it("should validate API key format", () => {
    const apiKey = process.env.HELLODOC_API_KEY;
    expect(apiKey).toMatch(/^[a-f0-9]{64}$/); // 64-character hex string
  });

  it("should successfully authenticate with Dropbox Sign API and get account info", async () => {
    const account = await getAccountInfo();
    
    expect(account).toBeDefined();
    expect(account.email_address).toBeDefined();
    expect(account.account_id).toBeDefined();
    
    console.log("✅ Dropbox Sign API key is valid");
    console.log(`Account Email: ${account.email_address}`);
  }, 15000); // 15 second timeout for API call
});
