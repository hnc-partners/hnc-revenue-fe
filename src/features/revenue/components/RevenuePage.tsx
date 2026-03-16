/**
 * RevenuePage.tsx
 *
 * The main exposed MF component for Revenue.
 * Shell loads this via Module Federation.
 *
 * Dual export pattern (REQUIRED for MF lazy loading):
 * - Named export (primary)
 * - Default export (required for MF lazy loading)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

// Create a query client for MF mode
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Create router with memory history for MF mode
const memoryHistory = createMemoryHistory({
  initialEntries: ['/revenue/statements'],
});

const router = createRouter({
  routeTree,
  history: memoryHistory,
});

export function RevenuePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default RevenuePage;
