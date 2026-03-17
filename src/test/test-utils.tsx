/**
 * test-utils.tsx
 *
 * Shared test helpers for the Revenue MF.
 * Provides QueryClient wrapper and mock factories for test data.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';

/**
 * Create a fresh QueryClient configured for tests (no retries, no refetch).
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface TestRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

/**
 * Render with QueryClientProvider wrapper. Returns user event instance too.
 */
export function renderWithQuery(
  ui: ReactElement,
  options?: TestRenderOptions
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  const result = render(ui, { ...options, wrapper: Wrapper });
  const user = userEvent.setup();

  return { ...result, user, queryClient };
}
