export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

// Frontend environment variables (VITE_ prefix)
export const env = {
  VITE_API_URL: process.env.VITE_API_URL,
  VITE_COGNITO_USER_POOL_ID: process.env.VITE_COGNITO_USER_POOL_ID,
  VITE_COGNITO_CLIENT_ID: process.env.VITE_COGNITO_CLIENT_ID,
  VITE_COGNITO_REGION: process.env.VITE_COGNITO_REGION,
};
