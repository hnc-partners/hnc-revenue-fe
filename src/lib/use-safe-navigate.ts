/**
 * use-safe-navigate.ts
 *
 * Safe wrapper around TanStack Router's useNavigate hook.
 * When no RouterProvider is present (MF mode inside shell), the returned
 * navigate function is a no-op instead of crashing.
 *
 * Works in both standalone dev (with router) and MF mode (without router).
 */

import { useContext, useCallback } from 'react';
import { getRouterContext, type AnyRouter } from '@tanstack/react-router';

type SafeNavigateFn = (opts?: Record<string, unknown>) => Promise<void>;

/**
 * Returns a navigate function that delegates to the router when available,
 * or does nothing when no RouterProvider is present.
 *
 * All hooks are called unconditionally — no Rules of Hooks violations.
 */
export function useSafeNavigate(): SafeNavigateFn {
  const routerContext = getRouterContext();
  const router = useContext(routerContext) as AnyRouter | undefined;

  return useCallback(
    (options?: Record<string, unknown>) => {
      if (!router) {
        // No router context — silently ignore navigation
        return Promise.resolve();
      }
      return router.navigate(options as Parameters<AnyRouter['navigate']>[0]);
    },
    [router],
  );
}
