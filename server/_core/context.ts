import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../db";
import { verifyCognitoToken } from "../cognito-auth";
import { getUserByOpenId, upsertUser } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function authenticateCognitoRequest(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  const authHeader = req.headers.authorization;
  console.log("🔐 Auth header:", authHeader ? "Bearer token present" : "No auth header");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    console.log("🔍 Verifying Cognito token...");
    // Verify Cognito JWT token
    const payload = await verifyCognitoToken(token);
    
    if (!payload) {
      console.log("❌ Token verification failed");
      return null;
    }
    console.log("✅ Token verified for user:", payload.email);

    // Check if user exists in database
    console.log("🔎 Looking up user by open_id:", payload.sub);
    const existingUser = await getUserByOpenId(payload.sub);

    if (existingUser) {
      // Update last signed in timestamp
      await upsertUser({
        cognitoSub: payload.sub,
        openId: existingUser.openId,
        email: payload.email,
        fullName: existingUser.fullName,
        department: existingUser.department || undefined,
        role: existingUser.role,
        cognitoGroups: undefined,
      });
      
      return existingUser;
    }

    // Create new user if doesn't exist
    await upsertUser({
      cognitoSub: payload.sub,
      openId: payload.sub,
      email: payload.email,
      fullName: payload.email.split('@')[0],
      department: undefined,
      role: "PPIC", // Default role
      cognitoGroups: undefined,
    });

    const newUser = await getUserByOpenId(payload.sub);
    console.log("✅ New user created:", newUser?.email);
    return newUser || null;
  } catch (error) {
    console.error("❌ Error authenticating Cognito request:", error);
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await authenticateCognitoRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
