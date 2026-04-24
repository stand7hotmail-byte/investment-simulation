"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) => {
          // R-002: Exact Retry Policy (v5)
          // Immediate stop for client errors (400-499) or Circuit Breaker block
          if (error.status >= 400 && error.status < 500) return false;
          if (error.message?.includes('Circuit Breaker:')) return false;
          
          // Allows 1 initial + 3 retries = 4 total attempts
          return failureCount <= 3;
        },
        staleTime: 30000, // 30s
        refetchOnWindowFocus: false, // Prevent thundering herd on focus during error
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
