import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@slotly/trpc";

import { env } from "../env";

export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient(queryClient: QueryClient) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${env.VITE_API_URL}/trpc`,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  });
}
