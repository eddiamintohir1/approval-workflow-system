import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import type { AppRouter } from "../../../server/routers";
import superjson from 'superjson';
import { cognitoAuth } from './cognito';

export const trpc = createTRPCReact<AppRouter>();

// API endpoint - use same origin (Manus hosting)
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;
console.log('🌐 API_URL:', API_URL, '| VITE_API_URL:', import.meta.env.VITE_API_URL, '| origin:', window.location.origin);

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      transformer: superjson,
      async headers() {
        // Get Cognito ID token and add to headers
        const idToken = await cognitoAuth.getIdToken();
        return {
          authorization: idToken ? `Bearer ${idToken}` : '',
        };
      },
    }),
  ],
});
