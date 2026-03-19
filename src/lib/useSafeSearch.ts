/**
 * useSafeSearch — graceful wrapper around TanStack Router's useSearch.
 *
 * When rendered inside the shell (MF mode via RevenuePage tabs with useState),
 * there is no RouterProvider in the tree, so useSearch throws.
 * This hook catches that error and returns an empty object as fallback,
 * making deep-link params optional. In standalone dev mode (with router),
 * useSearch works normally and params are forwarded.
 */
import { useSearch } from '@tanstack/react-router';

export function useSafeSearch(): Record<string, string | undefined> {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSearch({ strict: false }) as Record<string, string | undefined>;
  } catch {
    // No router context (MF mode inside shell tabs) — return empty defaults
    return {};
  }
}
