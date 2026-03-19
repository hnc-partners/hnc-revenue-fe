/**
 * use-safe-navigate.ts
 *
 * MF-safe navigation hook that does NOT import @tanstack/react-router.
 * Uses window.history.pushState + PopStateEvent to trigger shell router
 * navigation from within the MF.
 *
 * The shell's TanStack Router listens for popstate events, so pushState
 * followed by a popstate dispatch triggers route changes correctly.
 */

import { useCallback } from 'react';

interface NavigateOptions {
  /** Target path, e.g. '/revenue/imports' */
  to: string;
  /** Route params to interpolate, e.g. { batchId: '123' } replaces $batchId */
  params?: Record<string, string>;
  /** Search/query params to append as ?key=value */
  search?: Record<string, string | undefined>;
  /** Replace current history entry instead of pushing */
  replace?: boolean;
}

/**
 * Build a URL path from a pattern + params + search.
 *
 * Pattern: '/revenue/imports/$batchId' + params { batchId: '123' }
 *        → '/revenue/imports/123'
 */
function buildUrl(options: NavigateOptions): string {
  let path = options.to;

  // Interpolate route params ($paramName)
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      path = path.replace(`$${key}`, encodeURIComponent(value));
    }
  }

  // Append search params
  if (options.search) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.search)) {
      if (value !== undefined && value !== '') {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    if (qs) {
      path += `?${qs}`;
    }
  }

  return path;
}

/**
 * MF-safe navigate function (not a hook — can be called anywhere).
 * Uses pushState + popstate dispatch to trigger the shell router.
 */
export function navigateTo(options: NavigateOptions): void {
  const url = buildUrl(options);
  if (options.replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
  // Dispatch popstate so the shell's router picks up the change
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Hook version — returns a stable navigate callback.
 * Signature supports the same options as the standalone navigateTo.
 */
export function useSafeNavigate() {
  return useCallback((options: NavigateOptions) => {
    navigateTo(options);
  }, []);
}
