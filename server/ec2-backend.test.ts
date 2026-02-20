import { describe, expect, it } from "vitest";
import { env } from "./_core/env";

describe("EC2 Backend Configuration", () => {
  it("should have VITE_API_URL configured", () => {
    expect(env.VITE_API_URL).toBeDefined();
    expect(env.VITE_API_URL).toContain("54.169.119.79");
  });

  it("should have AWS Cognito credentials configured", () => {
    expect(env.VITE_COGNITO_USER_POOL_ID).toBeDefined();
    expect(env.VITE_COGNITO_USER_POOL_ID).toBe("ap-southeast-1_spVxra543");
    
    expect(env.VITE_COGNITO_CLIENT_ID).toBeDefined();
    expect(env.VITE_COGNITO_CLIENT_ID).toBe("1ipgf1ad3mdft7mdott6c60230");
    
    expect(env.VITE_COGNITO_REGION).toBeDefined();
    expect(env.VITE_COGNITO_REGION).toBe("ap-southeast-1");
  });

  it("should have correct API URL format", () => {
    const apiUrl = env.VITE_API_URL || "";
    expect(apiUrl).toMatch(/^https?:\/\/.+/);
  });
});
