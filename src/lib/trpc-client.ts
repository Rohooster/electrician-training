/**
 * tRPC Client Setup for React
 *
 * Configures React Query and tRPC client for frontend data fetching.
 */

import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '@/server/routers/_app';
import superjson from 'superjson';

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''; // Browser should use relative URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel URL
  return `http://localhost:${process.env.PORT ?? 3000}`; // Dev SSR should use localhost
}

export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
      }),
    ],
  });
}
