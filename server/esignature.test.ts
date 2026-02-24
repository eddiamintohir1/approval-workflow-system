import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { db } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "./_core/context";

describe("E-Signature Document Creation", () => {
  let testUserId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Get or create test user
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "eddie.amintohir@compawnion.co"))
      .limit(1);

    if (existingUser) {
      testUserId = existingUser.id;
    } else {
      // Create test user if doesn't exist
      const [newUser] = await db
        .insert(users)
        .values({
          openId: "test-open-id-esig",
          email: "eddie.amintohir@compawnion.co",
          name: "Eddie Test",
          role: "user",
        })
        .returning();
      testUserId = newUser.id;
    }

    // Create caller with authenticated context
    const ctx: TrpcContext = {
      user: {
        id: testUserId,
        openId: "test-open-id-esig",
        email: "eddie.amintohir@compawnion.co",
        name: "Eddie Test",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    caller = appRouter.createCaller(ctx);
  });

  it("should create e-signature document successfully", async () => {
    const result = await caller.eSignature.createDocument({
      documentName: "Test Contract.pdf",
      documentUrl: "https://example.com/test-contract.pdf",
      signerEmail: "signer@example.com",
      signerName: "John Doe",
    });

    expect(result).toBeDefined();
    expect(result.documentId).toBeDefined();
    expect(typeof result.documentId).toBe("string");
  });

  it("should create document with different signer", async () => {
    const result = await caller.eSignature.createDocument({
      documentName: "Another Contract.pdf",
      documentUrl: "https://example.com/another-contract.pdf",
      signerEmail: "another@example.com",
      signerName: "Jane Smith",
    });

    expect(result).toBeDefined();
    expect(result.documentId).toBeDefined();
    expect(typeof result.documentId).toBe("string");
  });
});
