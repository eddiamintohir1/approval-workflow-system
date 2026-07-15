import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";
import superjson from "superjson";
import { entraAuth } from "./entra";

export const trpc = createTRPCReact<AppRouter>();

// API endpoint - use same origin (Manus hosting)
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;
console.log(
  "🌐 API_URL:",
  API_URL,
  "| VITE_API_URL:",
  import.meta.env.VITE_API_URL,
  "| origin:",
  window.location.origin
);

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      transformer: superjson,
      async headers() {
        // Send the Microsoft Entra access token issued for this API.
        const accessToken = await entraAuth.getAccessToken();
        return {
          authorization: accessToken ? `Bearer ${accessToken}` : "",
        };
      },
    }),
  ],
});
