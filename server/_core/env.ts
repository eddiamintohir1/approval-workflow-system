export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

// Frontend environment variables (VITE_ prefix)
export const env = {
  VITE_API_URL: process.env.VITE_API_URL,
  VITE_APP_URL: process.env.VITE_APP_URL,
  VITE_ENTRA_TENANT_ID: process.env.VITE_ENTRA_TENANT_ID,
  VITE_ENTRA_CLIENT_ID: process.env.VITE_ENTRA_CLIENT_ID,
};
