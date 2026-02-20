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
        open_id: payload.sub,
        email: payload.email,
        name: existingUser.name,
        role: existingUser.role,
        is_active: existingUser.is_active,
        login_method: 'cognito',
        last_signed_in: new Date(),
      });
      
      return existingUser;
    }

    // Create new user if doesn't exist
    await upsertUser({
      open_id: payload.sub,
      email: payload.email,
      name: payload.email.split('@')[0],
      login_method: 'cognito',
      role: 'brand_manager',
      is_active: true,
      last_signed_in: new Date(),
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
