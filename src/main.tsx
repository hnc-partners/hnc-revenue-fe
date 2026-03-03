import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { routeTree } from './routeTree.gen';
import './index.css';

// Shell detection for Module Federation
declare global {
  interface Window {
    __SHELL__?: boolean;
  }
}

// Shell detection for conditional AuthProvider
// In shell mode (!window.__SHELL__ = false), shell provides AuthProvider
// In standalone mode (!window.__SHELL__ = true), we provide our own
// See new-frontend-guide.md Step 7 for full conditional pattern
// Example: const isStandalone = !window.__SHELL__;

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Create the router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
