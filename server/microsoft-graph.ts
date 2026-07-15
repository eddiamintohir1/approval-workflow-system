type CachedToken = { accessToken: string; expiresAt: number };

let cachedToken: CachedToken | null = null;

function graphConfiguration() {
  const tenantId = process.env.GRAPH_TENANT_ID || process.env.ENTRA_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID || process.env.ENTRA_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;
  const senderMailbox = process.env.GRAPH_SENDER_MAILBOX;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Microsoft Graph is not configured. Set GRAPH_TENANT_ID, GRAPH_CLIENT_ID and GRAPH_CLIENT_SECRET."
    );
  }

  return { tenantId, clientId, clientSecret, senderMailbox };
}

async function getGraphAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const { tenantId, clientId, clientSecret } = graphConfiguration();
  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Microsoft Graph token request failed (${response.status}): ${await response.text()}`
    );
  }

  const result = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    accessToken: result.access_token,
    expiresAt: Date.now() + result.expires_in * 1000,
  };
  return cachedToken.accessToken;
}

async function graphRequest<T>(
  pathOrUrl: string,
  init?: RequestInit
): Promise<T> {
  const token = await getGraphAccessToken();
  const url = pathOrUrl.startsWith("https://graph.microsoft.com/")
    ? pathOrUrl
    : `https://graph.microsoft.com/v1.0${pathOrUrl}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Microsoft Graph request failed (${response.status}): ${await response.text()}`
    );
  }

  if (response.status === 202 || response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function extractEmail(value?: string) {
  if (!value) return undefined;
  return value.match(/<([^>]+)>/)?.[1] || value;
}

export async function sendGraphEmail(options: {
  to: string[];
  subject: string;
  htmlBody: string;
  replyTo?: string;
}) {
  const { senderMailbox } = graphConfiguration();
  if (!senderMailbox) {
    throw new Error(
      "Set GRAPH_SENDER_MAILBOX before sending Microsoft 365 email."
    );
  }

  const replyTo = extractEmail(options.replyTo);
  await graphRequest<void>(
    `/users/${encodeURIComponent(senderMailbox)}/sendMail`,
    {
      method: "POST",
      body: JSON.stringify({
        message: {
          subject: options.subject,
          body: { contentType: "HTML", content: options.htmlBody },
          toRecipients: options.to.map(address => ({
            emailAddress: { address },
          })),
          ...(replyTo
            ? { replyTo: [{ emailAddress: { address: replyTo } }] }
            : {}),
        },
        saveToSentItems: true,
      }),
    }
  );
}

export interface MicrosoftDirectoryUser {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  accountEnabled?: boolean;
}

export async function listMicrosoftDirectoryUsers() {
  const users: MicrosoftDirectoryUser[] = [];
  let nextUrl: string | undefined =
    "/users?$select=id,displayName,mail,userPrincipalName,accountEnabled&$top=100";

  while (nextUrl) {
    const page: {
      value: MicrosoftDirectoryUser[];
      "@odata.nextLink"?: string;
    } = await graphRequest(nextUrl);
    users.push(...page.value);
    nextUrl = page["@odata.nextLink"];
  }

  return users;
}
