import { describe, it, expect } from "vitest";

describe("HelloDoc API Key Validation", () => {
  it("should have HELLODOC_API_KEY environment variable set", () => {
    expect(process.env.HELLODOC_API_KEY).toBeDefined();
    expect(process.env.HELLODOC_API_KEY).toBe("3b1bada35cbb5e8d505571e191fc70ccd011a35d5dc8e9d94c257a6870732449");
  });

  it("should validate HelloDoc API key format", () => {
    const apiKey = process.env.HELLODOC_API_KEY;
    expect(apiKey).toMatch(/^[a-f0-9]{64}$/); // HelloDoc API keys are 64-character hex strings
  });
});
