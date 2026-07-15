import {
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
} from "@azure/msal-browser";
import { MICROSOFT_ENTRA } from "@shared/microsoft";

const tenantId =
  import.meta.env.VITE_ENTRA_TENANT_ID?.trim() || MICROSOFT_ENTRA.tenantId;
const clientId =
  import.meta.env.VITE_ENTRA_CLIENT_ID?.trim() || MICROSOFT_ENTRA.clientId;
const allowedEmailSuffix = `@${MICROSOFT_ENTRA.allowedDomain}`;

export const entraConfiguration = {
  tenantId,
  clientId,
  configured: Boolean(tenantId && clientId),
};

export interface EntraAuthUser {
  email: string;
  sub: string;
  fullName?: string;
}

let client: PublicClientApplication | null = null;
let initialization: Promise<AuthenticationResult | null> | null = null;

function apiScope() {
  if (!clientId) {
    throw new Error("Microsoft sign-in is not configured yet.");
  }
  return `api://${clientId}/access_as_user`;
}

function getClient() {
  if (!tenantId || !clientId) {
    throw new Error(
      "Microsoft sign-in is not configured. Set VITE_ENTRA_TENANT_ID and VITE_ENTRA_CLIENT_ID."
    );
  }

  if (!client) {
    client = new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: `${window.location.origin}/auth/callback`,
        postLogoutRedirectUri: `${window.location.origin}/login`,
      },
      cache: {
        cacheLocation: "sessionStorage",
      },
    });
  }

  return client;
}

function accountEmail(account: AccountInfo) {
  const claims = account.idTokenClaims as
    | { email?: string; preferred_username?: string }
    | undefined;
  return (
    claims?.email ||
    claims?.preferred_username ||
    account.username
  ).toLowerCase();
}

function toUser(account: AccountInfo): EntraAuthUser {
  const claims = account.idTokenClaims as
    | { name?: string; oid?: string; sub?: string }
    | undefined;

  return {
    email: accountEmail(account),
    sub: claims?.oid || claims?.sub || account.homeAccountId,
    fullName: claims?.name || account.name || accountEmail(account),
  };
}

function assertAllowedAccount(account: AccountInfo) {
  if (!accountEmail(account).endsWith(allowedEmailSuffix)) {
    throw new Error(
      "Only @compawnion.co Microsoft accounts can access this system."
    );
  }
}

async function initialize() {
  const msal = getClient();

  if (!initialization) {
    initialization = (async () => {
      await msal.initialize();
      const result = await msal.handleRedirectPromise({
        navigateToLoginRequestUrl: false,
      });
      if (result?.account) {
        assertAllowedAccount(result.account);
        msal.setActiveAccount(result.account);
      } else if (!msal.getActiveAccount()) {
        const accounts = msal.getAllAccounts();
        if (accounts.length === 1) {
          assertAllowedAccount(accounts[0]);
          msal.setActiveAccount(accounts[0]);
        }
      }
      return result;
    })();
  }

  await initialization;
  return msal;
}

export const entraAuth = {
  initialize,

  async signIn() {
    const msal = await initialize();
    await msal.loginRedirect({
      scopes: ["openid", "profile", "email", apiScope()],
      redirectUri: `${window.location.origin}/auth/callback`,
      prompt: "select_account",
    });
  },

  async signOut() {
    const msal = await initialize();
    await msal.logoutRedirect({
      account: msal.getActiveAccount() || undefined,
      postLogoutRedirectUri: `${window.location.origin}/login`,
    });
  },

  async getCurrentUser(): Promise<EntraAuthUser | null> {
    if (!entraConfiguration.configured) return null;
    const msal = await initialize();
    const account = msal.getActiveAccount();
    if (!account) return null;
    assertAllowedAccount(account);
    return toUser(account);
  },

  async getAccessToken(): Promise<string | null> {
    if (!entraConfiguration.configured) return null;
    const msal = await initialize();
    const account = msal.getActiveAccount();
    if (!account) return null;

    try {
      const result = await msal.acquireTokenSilent({
        account,
        scopes: [apiScope()],
      });
      return result.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) return null;
      throw error;
    }
  },
};
