import { CognitoJwtVerifier } from "aws-jwt-verify";

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.VITE_COGNITO_USER_POOL_ID || "ap-southeast-1_spVxra543",
  tokenUse: "id",
  clientId: process.env.VITE_COGNITO_CLIENT_ID || "1ipgf1ad3mdft7mdott6c60230",
});

export interface CognitoTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  "cognito:username": string;
}

export async function verifyCognitoToken(token: string): Promise<CognitoTokenPayload | null> {
  try {
    const payload = await verifier.verify(token);
    const email = payload.email || payload["cognito:username"];
    console.log("✅ Cognito token verified for:", email);
    return {
      sub: payload.sub,
      email: email as string,
      email_verified: payload.email_verified || false,
      "cognito:username": payload["cognito:username"] as string,
    };
  } catch (error) {
    console.error("❌ Cognito token verification failed:", error);
    return null;
  }
}
