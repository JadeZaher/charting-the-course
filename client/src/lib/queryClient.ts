import { QueryClient } from "@tanstack/react-query";

// No default queryFn: every query names its fetcher, and keys come from lib/query-keys.ts, never from URLs.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
    mutations: {
      retry: 0, // writes are not idempotent: a retry after a dropped response submits advice or consent twice
    },
  },
});
