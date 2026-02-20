import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import type { AppRouter } from "../../../server/routers";
import superjson from 'superjson';
import { cognitoAuth } from './cognito';

export const trpc = createTRPCReact<AppRouter>();

// API endpoint - use EC2 backend
const API_URL = import.meta.env.VITE_API_URL || 'http://54.169.119.79:3000';

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
