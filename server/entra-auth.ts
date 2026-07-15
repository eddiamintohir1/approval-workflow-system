import { createRemoteJWKSet, jwtVerify } from "jose";
import { MICROSOFT_ENTRA } from "@shared/microsoft";

const tenantId =
  process.env.ENTRA_TENANT_ID ||
  process.env.VITE_ENTRA_TENANT_ID ||
  MICROSOFT_ENTRA.tenantId;
const clientId =
  process.env.ENTRA_CLIENT_ID ||
  process.env.VITE_ENTRA_CLIENT_ID ||
  MICROSOFT_ENTRA.clientId;
const allowedEmailSuffix = `@${MICROSOFT_ENTRA.allowedDomain}`;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export const entraServerConfiguration = {
  tenantId,
  clientId,
  configured: Boolean(tenantId && clientId),
};

export interface EntraTokenPayload {
  sub: string;
  oid: string;
  tenantId: string;
  email: string;
  name: string;
}

export async function verifyEntraToken(
  token: string
): Promise<EntraTokenPayload | null> {
  if (!tenantId || !clientId) {
    console.error("[Auth] Microsoft Entra server configuration is missing");
    return null;
  }

  try {
    jwks ||= createRemoteJWKSet(
      new URL(
        `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
      )
    );

    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ["RS256"],
      audience: [clientId, `api://${clientId}`],
      issuer: [
        `https://login.microsoftonline.com/${tenantId}/v2.0`,
        `https://sts.windows.net/${tenantId}/`,
      ],
    });

    if (payload.tid !== tenantId) {
      throw new Error("Token was issued by a different Microsoft tenant");
    }

    const scopes =
      typeof payload.scp === "string" ? payload.scp.split(" ") : [];
    if (!scopes.includes("access_as_user")) {
      throw new Error("Token is missing the access_as_user API scope");
    }

    const email = String(
      payload.email || payload.preferred_username || payload.upn || ""
    ).toLowerCase();
    if (!email.endsWith(allowedEmailSuffix)) {
      throw new Error("Only @compawnion.co Microsoft accounts are allowed");
    }

    return {
      sub: String(payload.sub),
      oid: String(payload.oid || payload.sub),
      tenantId: String(payload.tid),
      email,
      name: String(payload.name || email),
    };
  } catch (error) {
    console.error(
      "[Auth] Microsoft Entra token verification failed",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}
