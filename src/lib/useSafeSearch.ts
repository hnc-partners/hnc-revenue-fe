/**
 * useSafeSearch — MF-safe search params hook.
 *
 * Does NOT import @tanstack/react-router. Reads search params directly
 * from window.location.search using URLSearchParams.
 *
 * Returns a plain Record<string, string | undefined> of current URL
 * query parameters. Stable across standalone dev and MF mode.
 */

export function useSafeSearch(): Record<string, string | undefined> {
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string | undefined> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}
